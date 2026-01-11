import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ReorderTasksDto,
  GetTasksForDateDto,
} from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto, userId: string) {
    // Verify block exists if provided
    if (dto.blockId) {
      const block = await this.prisma.block.findFirst({
        where: { id: dto.blockId, userId, deletedAt: null },
      });
      if (!block) {
        throw new BadRequestException('Block not found');
      }
    }

    // Get current max sort order
    const maxOrder = await this.prisma.task.aggregate({
      where: {
        userId,
        deletedAt: null,
        ...(dto.blockId ? { blockId: dto.blockId } : {}),
      },
      _max: { sortOrder: true },
    });

    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    // For one-off tasks, convert dueDate string to Date
    const dueDate = dto.isOneOff && dto.dueDate ? new Date(dto.dueDate) : null;

    // For loops, ensure daysOfWeek is set
    const daysOfWeek = !dto.isOneOff ? (dto.daysOfWeek ?? [1, 2, 3, 4, 5]) : [];

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        emoji: dto.emoji,
        sortOrder,
        isOneOff: dto.isOneOff,
        dueDate,
        daysOfWeek,
        skipDays: dto.skipDays ?? 0,
        resetDays: dto.resetDays ?? 0,
        userId,
        blockId: dto.blockId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        emoji: true,
        sortOrder: true,
        isOneOff: true,
        dueDate: true,
        daysOfWeek: true,
        skipDays: true,
        resetDays: true,
        isArchived: false,
        blockId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If one-off with due date, create instance for that date
    if (dto.isOneOff && dto.dueDate) {
      await this.createInstance(task.id, new Date(dto.dueDate));
    }

    return task;
  }

  async findAll(userId: string, includeArchived = false) {
    const where = {
      userId,
      deletedAt: null,
      ...(!includeArchived && { isArchived: false }),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ blockId: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        emoji: true,
        sortOrder: true,
        isOneOff: true,
        dueDate: true,
        daysOfWeek: true,
        skipDays: true,
        resetDays: true,
        isArchived: false,
        blockId: true,
        block: {
          select: { id: true, name: true, color: true, icon: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return tasks;
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        emoji: true,
        sortOrder: true,
        isOneOff: true,
        dueDate: true,
        daysOfWeek: true,
        skipDays: true,
        resetDays: true,
        isArchived: true,
        blockId: true,
        block: {
          select: { id: true, name: true, color: true, icon: true },
        },
        createdAt: true,
        updatedAt: true,
        instances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id, userId);

    // Handle block change
    if (dto.blockId && dto.blockId !== task.blockId) {
      const block = await this.prisma.block.findFirst({
        where: { id: dto.blockId, userId, deletedAt: null },
      });
      if (!block) {
        throw new BadRequestException('Block not found');
      }
    }

    // Handle dueDate conversion
    let dueDate = task.dueDate;
    if (dto.isOneOff !== false && dto.dueDate) {
      dueDate = new Date(dto.dueDate);
    }

    // Handle daysOfWeek for loops
    let daysOfWeek = task.daysOfWeek;
    if (dto.isOneOff !== true && dto.daysOfWeek) {
      daysOfWeek = dto.daysOfWeek;
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        emoji: dto.emoji,
        sortOrder: dto.sortOrder,
        isOneOff: dto.isOneOff,
        dueDate,
        daysOfWeek,
        skipDays: dto.skipDays ?? task.skipDays,
        resetDays: dto.resetDays ?? task.resetDays,
        blockId: dto.blockId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        emoji: true,
        sortOrder: true,
        isOneOff: true,
        dueDate: true,
        daysOfWeek: true,
        isArchived: true,
        blockId: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async reorder(dto: ReorderTasksDto, userId: string) {
    // Verify all tasks belong to user
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: dto.taskIds },
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (tasks.length !== dto.taskIds.length) {
      throw new BadRequestException('One or more tasks not found');
    }

    await this.prisma.$transaction(
      dto.taskIds.map((id, index) =>
        this.prisma.task.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { success: true };
  }

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: { isArchived: true },
      select: { id: true, isArchived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: { isArchived: false },
      select: { id: true, isArchived: true },
    });
  }

  async getTasksForDate(dto: GetTasksForDateDto, userId: string) {
    const date = new Date(dto.date);
    const dayOfWeek = date.getDay();

    // Get all loops that should appear on this day
    const loops = await this.prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        isArchived: false,
        isOneOff: false,
        daysOfWeek: { has: dayOfWeek },
      },
      select: {
        id: true,
        title: true,
        emoji: true,
        sortOrder: true,
        daysOfWeek: true,
        blockId: true,
        block: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    // Get all one-off tasks due on this date
    const oneOffs = await this.prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        isArchived: false,
        isOneOff: true,
        dueDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      select: {
        id: true,
        title: true,
        emoji: true,
        sortOrder: true,
        dueDate: true,
        blockId: true,
        block: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    // Combine and get instances for this date
    const allTasks = [...loops, ...oneOffs];

    // Get instances for this date
    const taskIds = allTasks.map((t) => t.id);
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        taskId: { in: taskIds },
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    // Merge instances with tasks
    const tasksWithInstances = allTasks.map((task) => {
      const instance = instances.find((i) => i.taskId === task.id);
      return {
        ...task,
        instance: instance
          ? {
              id: instance.id,
              status: instance.status,
              completedAt: instance.completedAt,
              notes: instance.notes,
            }
          : null,
      };
    });

    // Filter by status if needed
    let filtered = tasksWithInstances;
    if (dto.status !== 'ALL') {
      filtered = tasksWithInstances.filter(
        (t) => t.instance?.status === dto.status,
      );
    }

    // Filter by block if needed
    if (dto.blockId) {
      filtered = filtered.filter((t) => t.blockId === dto.blockId);
    }

    // Group by block
    const byBlock = filtered.reduce(
      (acc, task) => {
        const blockId = task.blockId || 'unassigned';
        if (!acc[blockId]) {
          acc[blockId] = {
            block: task.block,
            tasks: [],
          };
        }
        acc[blockId].tasks.push(task);
        return acc;
      },
      {} as Record<string, { block: any; tasks: any[] }>,
    );

    return {
      date: dto.date,
      tasks: filtered,
      byBlock,
      total: filtered.length,
      pending: filtered.filter(
        (t) => !t.instance || t.instance.status === 'PENDING',
      ).length,
      completed: filtered.filter((t) => t.instance?.status === 'COMPLETED')
        .length,
      skipped: filtered.filter((t) => t.instance?.status === 'SKIPPED').length,
    };
  }

  async createInstance(taskId: string, date: Date) {
    // Check if instance already exists
    const existing = await this.prisma.taskInstance.findUnique({
      where: {
        taskId_date: {
          taskId,
          date: new Date(date.setHours(0, 0, 0, 0)),
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.taskInstance.create({
      data: {
        taskId,
        date: new Date(date.setHours(0, 0, 0, 0)),
        status: 'PENDING',
      },
    });
  }
}
