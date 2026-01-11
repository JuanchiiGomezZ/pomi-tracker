import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  CompleteInstanceDto,
  SkipInstanceDto,
  UnskipInstanceDto,
  UpdateNotesDto,
} from './dto/task-instance.dto';

@Injectable()
export class TaskInstancesService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(dateStr: string) {
    const date = new Date(dateStr);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));
    return { start, end };
  }

  async getOrCreateInstance(taskId: string, dateStr: string) {
    const { start } = this.getDateRange(dateStr);

    // Check if instance exists
    let instance = await this.prisma.taskInstance.findUnique({
      where: {
        taskId_date: {
          taskId,
          date: start,
        },
      },
    });

    // Create if doesn't exist
    if (!instance) {
      instance = await this.prisma.taskInstance.create({
        data: {
          taskId,
          date: start,
          status: 'PENDING',
        },
      });
    }

    return instance;
  }

  async complete(taskId: string, dto: CompleteInstanceDto, userId: string) {
    // Verify task belongs to user
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Get or create instance
    const instance = await this.getOrCreateInstance(taskId, dto.date);

    // Update instance
    const updated = await this.prisma.taskInstance.update({
      where: { id: instance.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: dto.notes,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            emoji: true,
            isOneOff: true,
            blockId: true,
          },
        },
      },
    });

    // Update user streak
    await this.updateUserStreak(userId);

    return updated;
  }

  async uncomplete(taskId: string, dateStr: string, userId: string) {
    const { start } = this.getDateRange(dateStr);

    const instance = await this.prisma.taskInstance.findUnique({
      where: {
        taskId_date: {
          taskId,
          date: start,
        },
      },
    });

    if (!instance) {
      throw new BadRequestException('Instance not found');
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id: instance.id },
      data: {
        status: 'PENDING',
        completedAt: null,
      },
    });

    // Update user streak
    await this.updateUserStreak(userId);

    return updated;
  }

  async skip(taskId: string, dto: SkipInstanceDto, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const instance = await this.getOrCreateInstance(taskId, dto.date);

    const updated = await this.prisma.taskInstance.update({
      where: { id: instance.id },
      data: { status: 'SKIPPED' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            emoji: true,
          },
        },
      },
    });

    // Update user streak
    await this.updateUserStreak(userId);

    return updated;
  }

  async unskip(taskId: string, dto: UnskipInstanceDto, userId: string) {
    const { start } = this.getDateRange(dto.date);

    const instance = await this.prisma.taskInstance.findUnique({
      where: {
        taskId_date: {
          taskId,
          date: start,
        },
      },
    });

    if (!instance) {
      throw new BadRequestException('Instance not found');
    }

    const updated = await this.prisma.taskInstance.update({
      where: { id: instance.id },
      data: { status: 'PENDING' },
    });

    // Update user streak
    await this.updateUserStreak(userId);

    return updated;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateNotes(taskId: string, dto: UpdateNotesDto, userId: string) {
    const { start } = this.getDateRange(dto.date);

    const instance = await this.prisma.taskInstance.findUnique({
      where: {
        taskId_date: {
          taskId,
          date: start,
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    return this.prisma.taskInstance.update({
      where: { id: instance.id },
      data: { notes: dto.notes },
    });
  }

  async getInstancesForDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start } = this.getDateRange(startDate);
    const { end } = this.getDateRange(endDate);

    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            emoji: true,
            isOneOff: true,
            blockId: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return instances;
  }

  async getDailySummary(userId: string, dateStr: string) {
    const { start, end } = this.getDateRange(dateStr);

    // Get all instances for this date
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            emoji: true,
            isOneOff: true,
            block: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    // Calculate summary
    const pending = instances.filter((i) => i.status === 'PENDING').length;
    const completed = instances.filter((i) => i.status === 'COMPLETED').length;
    const skipped = instances.filter((i) => i.status === 'SKIPPED').length;
    const missed = instances.filter((i) => i.status === 'MISSED').length;

    const total = pending + completed + skipped;

    // Determine day result
    let result: 'PERFECT' | 'PARTIAL' | 'NONE' | 'NO_TASKS' | null = null;
    if (total === 0) {
      result = 'NO_TASKS';
    } else if (completed === total) {
      result = 'PERFECT';
    } else if (completed > 0) {
      result = 'PARTIAL';
    } else if (skipped === total) {
      result = 'NO_TASKS'; // All skipped = no activity
    } else {
      result = 'NONE';
    }

    return {
      date: dateStr,
      instances,
      summary: {
        total,
        pending,
        completed,
        skipped,
        missed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        result,
      },
    };
  }

  async updateUserStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get all instances for today
    const todayInstances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: today,
          lt: todayEnd,
        },
      },
    });

    // Calculate today's completion
    const nonSkipped = todayInstances.filter((i) => i.status !== 'SKIPPED');
    const completed = nonSkipped.filter((i) => i.status === 'COMPLETED');

    // Check if today is a "perfect day"
    const isPerfectDay =
      nonSkipped.length > 0 && completed.length === nonSkipped.length;

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Get yesterday's instances
    const yesterdayInstances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: yesterday,
          lt: yesterdayEnd,
        },
      },
    });

    const yesterdayNonSkipped = yesterdayInstances.filter(
      (i) => i.status !== 'SKIPPED',
    );
    const yesterdayCompleted = yesterdayNonSkipped.filter(
      (i) => i.status === 'COMPLETED',
    );
    const isYesterdayPerfect =
      yesterdayNonSkipped.length > 0 &&
      yesterdayCompleted.length === yesterdayNonSkipped.length;

    // Update streak
    let newStreak = user.currentStreak;
    let bestStreak = user.bestStreak;
    let lastActiveDate = user.lastActiveDate;

    if (isPerfectDay) {
      // Check if streak continues
      const lastActive = user.lastActiveDate
        ? new Date(user.lastActiveDate)
        : null;

      if (lastActive) {
        const daysSinceLastActive = Math.floor(
          (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceLastActive === 1 && isYesterdayPerfect) {
          // Continue streak
          newStreak += 1;
        } else if (daysSinceLastActive <= 1) {
          // Same day or next day with perfect yesterday
          // Streak continues
        } else {
          // Reset streak
          newStreak = 1;
        }
      } else {
        // First perfect day
        newStreak = 1;
      }

      // Update best streak
      if (newStreak > bestStreak) {
        bestStreak = newStreak;
      }

      lastActiveDate = today;
    } else if (nonSkipped.length > 0) {
      // Had tasks but not perfect - streak breaks
      newStreak = 0;
    }
    // No tasks today doesn't affect streak

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        bestStreak,
        lastActiveDate,
      },
    });
  }
}
