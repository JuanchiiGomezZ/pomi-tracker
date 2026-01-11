import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PushSyncDto, PullSyncResponse } from './dto/sync.dto';
import { Frequency } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pull changes from server since lastSyncAt
   */
  async pullChanges(
    userId: string,
    lastSyncAt?: string,
  ): Promise<PullSyncResponse> {
    const syncTimestamp = new Date();

    // Build query filters
    const whereClause = {
      userId,
      deletedAt: null,
      ...(lastSyncAt && {
        updatedAt: { gt: new Date(lastSyncAt) },
      }),
    };

    // Fetch all changes since lastSyncAt
    const [blocks, tasks, taskInstances] = await Promise.all([
      this.prisma.block.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          color: true,
          sortOrder: true,
          isArchived: true,
          activeDays: true,
          reminderEnabled: true,
          reminderHour: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.task.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          emoji: true,
          sortOrder: true,
          isArchived: true,
          isOneOff: true,
          dueDate: true,
          frequency: true,
          daysOfWeek: true,
          skipDays: true,
          resetDays: true,
          userId: true,
          blockId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.taskInstance.findMany({
        where: {
          task: { userId },
          ...(lastSyncAt && {
            updatedAt: { gt: new Date(lastSyncAt) },
          }),
        },
        orderBy: { updatedAt: 'asc' },
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          completedAt: true,
          taskId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      blocks: blocks.filter((b) => !b.deletedAt) as any,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      tasks: tasks.filter((t) => !t.deletedAt) as any,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      taskInstances: taskInstances as any,
      syncTimestamp: syncTimestamp.toISOString(),
      hasMore: false, // For pagination if needed
    };
  }

  /**
   * Push changes from client to server
   */
  async pushChanges(userId: string, dto: PushSyncDto) {
    const { changes } = dto;
    const applied: string[] = [];
    const conflicts: Array<{
      entity: string;
      entityId: string;
      serverData?: Record<string, unknown>;
      clientData?: Record<string, unknown>;
    }> = [];

    // Process each change
    for (const change of changes) {
      try {
        await this.processChange(userId, change);
        applied.push(change.entityId);
      } catch {
        // Log conflict (simplified - in production, you'd store full conflict info)
        conflicts.push({
          entity: change.entity,
          entityId: change.entityId,
          clientData: change.data as Record<string, unknown>,
        });
      }
    }

    // Update user's last sync timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSyncAt: new Date() },
    });

    return { applied, conflicts };
  }

  /**
   * Process a single change from the client
   */
  private async processChange(
    userId: string,
    change: {
      entity: string;
      entityId: string;
      action: string;
      data?: Record<string, unknown>;
    },
  ) {
    const { entity, entityId, action, data } = change;

    switch (entity) {
      case 'block':
        return this.processBlockChange(userId, entityId, action, data);
      case 'task':
        return this.processTaskChange(userId, entityId, action, data);
      case 'task-instance':
        return this.processTaskInstanceChange(userId, entityId, action, data);
      default:
        throw new BadRequestException(`Unknown entity type: ${entity}`);
    }
  }

  private async processBlockChange(
    userId: string,
    entityId: string,
    action: string,
    data?: Record<string, unknown>,
  ) {
    switch (action) {
      case 'create':
        return this.prisma.block.create({
          data: {
            id: entityId,
            name: (data?.name as string) || 'New Block',
            description: data?.description as string,
            icon: data?.icon as string,
            color: data?.color as string,
            activeDays: (data?.activeDays as number[]) || [0, 1, 2, 3, 4, 5, 6],
            reminderEnabled: (data?.reminderEnabled as boolean) || false,
            reminderHour: data?.reminderHour as number,
            userId,
            createdAt: data?.createdAt
              ? new Date(data.createdAt as string)
              : new Date(),
          },
        });

      case 'update': {
        const updateData: Record<string, unknown> = {};
        if (data?.name !== undefined) updateData.name = data.name;
        if (data?.description !== undefined)
          updateData.description = data.description;
        if (data?.icon !== undefined) updateData.icon = data.icon;
        if (data?.color !== undefined) updateData.color = data.color;
        if (data?.activeDays !== undefined)
          updateData.activeDays = data.activeDays;
        if (data?.reminderEnabled !== undefined)
          updateData.reminderEnabled = data.reminderEnabled;
        if (data?.reminderHour !== undefined)
          updateData.reminderHour = data.reminderHour;
        if (data?.isArchived !== undefined)
          updateData.isArchived = data.isArchived;

        return this.prisma.block.update({
          where: { id: entityId, userId },
          data: updateData,
        });
      }

      case 'delete':
        return this.prisma.block.update({
          where: { id: entityId, userId },
          data: { deletedAt: new Date() },
        });

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }
  }

  private async processTaskChange(
    userId: string,
    entityId: string,
    action: string,
    data?: Record<string, unknown>,
  ) {
    switch (action) {
      case 'create':
        return this.prisma.task.create({
          data: {
            id: entityId,
            title: (data?.title as string) || 'New Task',
            description: data?.description as string,
            emoji: data?.emoji as string,
            isOneOff: (data?.isOneOff as boolean) || false,
            dueDate: data?.dueDate
              ? new Date(data.dueDate as string)
              : undefined,
            frequency: (data?.frequency as Frequency) || 'DAILY',
            daysOfWeek: (data?.daysOfWeek as number[]) || [1, 2, 3, 4, 5, 6, 0],
            skipDays: (data?.skipDays as number) || 0,
            resetDays: (data?.resetDays as number) || 0,
            userId,
            blockId: data?.blockId as string,
            createdAt: data?.createdAt
              ? new Date(data.createdAt as string)
              : new Date(),
          },
        });

      case 'update': {
        const updateData: Record<string, unknown> = {};
        if (data?.title !== undefined) updateData.title = data.title;
        if (data?.description !== undefined)
          updateData.description = data.description;
        if (data?.emoji !== undefined) updateData.emoji = data.emoji;
        if (data?.isOneOff !== undefined) updateData.isOneOff = data.isOneOff;
        if (data?.dueDate !== undefined)
          updateData.dueDate = data.dueDate
            ? new Date(data.dueDate as string)
            : null;
        if (data?.frequency !== undefined)
          updateData.frequency = data.frequency;
        if (data?.daysOfWeek !== undefined)
          updateData.daysOfWeek = data.daysOfWeek;
        if (data?.skipDays !== undefined) updateData.skipDays = data.skipDays;
        if (data?.resetDays !== undefined)
          updateData.resetDays = data.resetDays;
        if (data?.blockId !== undefined) updateData.blockId = data.blockId;
        if (data?.isArchived !== undefined)
          updateData.isArchived = data.isArchived;

        return this.prisma.task.update({
          where: { id: entityId, userId },
          data: updateData,
        });
      }

      case 'delete':
        return this.prisma.task.update({
          where: { id: entityId, userId },
          data: { deletedAt: new Date() },
        });

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }
  }

  private async processTaskInstanceChange(
    userId: string,
    entityId: string,
    action: string,
    data?: Record<string, unknown>,
  ) {
    switch (action) {
      case 'create':
      case 'update': {
        const date = data?.date ? new Date(data.date as string) : new Date();
        const status = (data?.status as string) || 'PENDING';

        return this.prisma.taskInstance.upsert({
          where: { taskId_date: { taskId: entityId, date } },
          update: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            status: status as any,
            notes: data?.notes as string,
            completedAt: status === 'COMPLETED' ? new Date() : undefined,
          },
          create: {
            id: entityId,
            date,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            status: status as any,
            notes: data?.notes as string,
            taskId: (data?.taskId as string) || entityId,
            completedAt: status === 'COMPLETED' ? new Date() : undefined,
          },
        });
      }

      case 'delete':
        return this.prisma.taskInstance.delete({
          where: { id: entityId },
        });

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }
  }

  /**
   * Full sync: pull changes, then push changes
   */
  async fullSync(userId: string, dto: PushSyncDto) {
    const [pullResult, pushResult] = await Promise.all([
      this.pullChanges(userId, dto.lastSyncAt),
      this.pushChanges(userId, dto),
    ]);

    return {
      success: true,
      pull: pullResult,
      push: pushResult,
      serverTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastSyncAt: true, updatedAt: true },
    });

    const [blockCount, taskCount, instanceCount] = await Promise.all([
      this.prisma.block.count({ where: { userId, deletedAt: null } }),
      this.prisma.task.count({ where: { userId, deletedAt: null } }),
      this.prisma.taskInstance.count({
        where: { task: { userId } },
      }),
    ]);

    return {
      lastSyncAt: user?.lastSyncAt?.toISOString() || null,
      dataCounts: {
        blocks: blockCount,
        tasks: taskCount,
        taskInstances: instanceCount,
      },
    };
  }
}
