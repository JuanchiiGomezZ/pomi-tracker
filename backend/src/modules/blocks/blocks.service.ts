import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  CreateBlockDto,
  UpdateBlockDto,
  ReorderBlocksDto,
} from './dto/block.dto';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBlockDto, userId: string) {
    // Get current max sort order
    const maxOrder = await this.prisma.block.aggregate({
      where: { userId, deletedAt: null },
      _max: { sortOrder: true },
    });

    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const block = await this.prisma.block.create({
      data: {
        ...dto,
        userId,
        sortOrder,
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
        activeDays: true,
        isArchived: false,
        reminderEnabled: true,
        reminderHour: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return block;
  }

  async findAll(userId: string, includeArchived = false) {
    const where = {
      userId,
      deletedAt: null,
      ...(!includeArchived && { isArchived: false }),
    };

    const blocks = await this.prisma.block.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
        activeDays: true,
        isArchived: false,
        reminderEnabled: true,
        reminderHour: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            emoji: true,
            isOneOff: true,
            dueDate: true,
            daysOfWeek: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
          take: 10, // Limit tasks in list
        },
      },
    });

    return blocks;
  }

  async findOne(id: string, userId: string) {
    const block = await this.prisma.block.findFirst({
      where: { id, userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
        activeDays: true,
        isArchived: true,
        reminderEnabled: true,
        reminderHour: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            description: true,
            emoji: true,
            isOneOff: true,
            dueDate: true,
            daysOfWeek: true,
            sortOrder: true,
            isArchived: true,
            createdAt: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    return block;
  }

  async update(id: string, dto: UpdateBlockDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.block.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
        activeDays: true,
        isArchived: true,
        reminderEnabled: true,
        reminderHour: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, userId: string, reassignToBlockId?: string) {
    await this.findOne(id, userId);

    // Check if block has tasks
    const taskCount = await this.prisma.task.count({
      where: { blockId: id, deletedAt: null },
    });

    if (taskCount > 0 && !reassignToBlockId) {
      throw new BadRequestException(
        'Block has tasks. Please reassign tasks to another block before deleting.',
      );
    }

    // Reassign tasks if specified
    if (reassignToBlockId) {
      const targetBlock = await this.prisma.block.findFirst({
        where: { id: reassignToBlockId, userId, deletedAt: null },
      });

      if (!targetBlock) {
        throw new NotFoundException('Target block not found');
      }

      await this.prisma.task.updateMany({
        where: { blockId: id },
        data: { blockId: reassignToBlockId },
      });
    }

    // Soft delete
    await this.prisma.block.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async reorder(dto: ReorderBlocksDto, userId: string) {
    // Verify all blocks belong to user
    const blocks = await this.prisma.block.findMany({
      where: {
        id: { in: dto.blockIds },
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (blocks.length !== dto.blockIds.length) {
      throw new BadRequestException('One or more blocks not found');
    }

    // Update sort orders in transaction
    await this.prisma.$transaction(
      dto.blockIds.map((id, index) =>
        this.prisma.block.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { success: true };
  }

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.block.update({
      where: { id },
      data: { isArchived: true },
      select: { id: true, isArchived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.block.update({
      where: { id },
      data: { isArchived: false },
      select: { id: true, isArchived: true },
    });
  }

  async getActiveForDay(userId: string, dayOfWeek: number) {
    // Get blocks that are active for this day OR have tasks for this day
    const blocks = await this.prisma.block.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { activeDays: { has: dayOfWeek } },
          {
            tasks: {
              some: {
                deletedAt: null,
                isOneOff: true,
                dueDate: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
            },
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        activeDays: true,
        reminderEnabled: true,
        reminderHour: true,
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            emoji: true,
            isOneOff: true,
            dueDate: true,
            daysOfWeek: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return blocks;
  }
}
