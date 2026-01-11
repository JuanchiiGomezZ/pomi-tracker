import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type {
  CalendarDay,
  DayCompletion,
  HeatmapDay,
  StreakInfo,
  InsightsSummary,
} from './dto/insights.dto';

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyCompletion(
    userId: string,
    dateStr: string,
  ): Promise<DayCompletion> {
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Get all instances for this date
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            isOneOff: true,
            skipDays: true,
          },
        },
      },
    });

    // Calculate totals
    const total = instances.length;
    const completed = instances.filter((i) => i.status === 'COMPLETED').length;
    const skipped = instances.filter((i) => i.status === 'SKIPPED').length;

    // Calculate percentage based on non-skipped tasks
    const nonSkipped = total - skipped;
    let percentage = 0;
    let status: DayCompletion['status'] = 'no_tasks';

    if (total === 0) {
      status = 'no_tasks';
      percentage = 0;
    } else if (nonSkipped === 0) {
      // All tasks were skipped
      status = 'none';
      percentage = 0;
    } else {
      percentage = Math.round((completed / nonSkipped) * 100);
      if (percentage === 100) {
        status = 'perfect';
      } else if (percentage > 0) {
        status = 'partial';
      } else {
        status = 'none';
      }
    }

    return {
      date: dateStr,
      total,
      completed,
      skipped,
      percentage,
      status,
    };
  }

  async getCalendarData(
    userId: string,
    year: number,
    month: number,
  ): Promise<CalendarDay[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarDays: CalendarDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];

      const completion = await this.getDailyCompletion(userId, dateStr);

      calendarDays.push({
        day,
        date: dateStr,
        total: completion.total,
        completed: completion.completed,
        skipped: completion.skipped,
        percentage: completion.percentage,
        status: completion.status,
      });
    }

    return calendarDays;
  }

  async getHeatmapData(userId: string, year?: number): Promise<HeatmapDay[]> {
    const targetYear = year || new Date().getFullYear();
    const heatmapDays: HeatmapDay[] = [];

    // Get all instances for the year
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        task: {
          select: { id: true, skipDays: true },
        },
      },
    });

    // Group instances by date
    const instancesByDate = new Map<string, typeof instances>();

    for (const instance of instances) {
      const dateKey = instance.date.toISOString().split('T')[0];
      const existing = instancesByDate.get(dateKey) || [];
      instancesByDate.set(dateKey, [...existing, instance]);
    }

    // Calculate completion for each day of the year
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const dayInstances = instancesByDate.get(dateStr) || [];

      const total = dayInstances.length;
      const completed = dayInstances.filter(
        (i) => i.status === 'COMPLETED',
      ).length;
      const skipped = dayInstances.filter((i) => i.status === 'SKIPPED').length;

      const nonSkipped = total - skipped;
      let percentage = 0;
      let status: HeatmapDay['status'] = 'no_tasks';

      if (total === 0) {
        status = 'no_tasks';
        percentage = 0;
      } else if (nonSkipped === 0) {
        status = 'none';
        percentage = 0;
      } else {
        percentage = Math.round((completed / nonSkipped) * 100);
        status =
          percentage === 100 ? 'perfect' : percentage > 0 ? 'partial' : 'none';
      }

      heatmapDays.push({
        date: dateStr,
        percentage,
        status,
      });
    }

    return heatmapDays;
  }

  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        bestStreak: true,
        lastActiveDate: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total perfect days
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const perfectDaysThisYear = await this.countPerfectDays(
      userId,
      startOfYear,
    );

    return {
      currentStreak: user.currentStreak || 0,
      bestStreak: user.bestStreak || 0,
      lastActiveDate: user.lastActiveDate?.toISOString().split('T')[0] || null,
      totalPerfectDays: perfectDaysThisYear,
    };
  }

  async getWeeklyAverages(
    userId: string,
  ): Promise<{ weekStartDate: string; average: number }[]> {
    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);

    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: twelveWeeksAgo,
          lte: now,
        },
      },
      include: {
        task: {
          select: { id: true, skipDays: true },
        },
      },
    });

    // Group by week
    const weekData = new Map<
      string,
      { total: number; completed: number; skipped: number }
    >();

    for (const instance of instances) {
      const date = instance.date;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekData.get(weekKey) || {
        total: 0,
        completed: 0,
        skipped: 0,
      };
      existing.total += 1;
      if (instance.status === 'COMPLETED') existing.completed += 1;
      if (instance.status === 'SKIPPED') existing.skipped += 1;
      weekData.set(weekKey, existing);
    }

    // Calculate averages
    const averages = Array.from(weekData.entries())
      .map(([weekStartDate, data]) => {
        const nonSkipped = data.total - data.skipped;
        const percentage =
          nonSkipped > 0 ? Math.round((data.completed / nonSkipped) * 100) : 0;
        return { weekStartDate, average: percentage };
      })
      .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

    return averages;
  }

  async getInsightsSummary(userId: string): Promise<InsightsSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [streakInfo, monthlyData, yearlyData, perfectDaysThisMonth] =
      await Promise.all([
        this.getStreakInfo(userId),
        this.getMonthlyCompletion(
          userId,
          now.getFullYear(),
          now.getMonth() + 1,
        ),
        this.getYearlyCompletion(userId, now.getFullYear()),
        this.countPerfectDays(userId, startOfMonth),
      ]);

    // Calculate yearly perfect days
    const perfectDaysThisYear = await this.countPerfectDays(
      userId,
      startOfYear,
    );

    // Calculate weekly average
    const weeklyAverages = await this.getWeeklyAverages(userId);
    const weeklyAverage =
      weeklyAverages.length > 0
        ? Math.round(
            weeklyAverages.reduce((sum, w) => sum + w.average, 0) /
              weeklyAverages.length,
          )
        : 0;

    return {
      streak: streakInfo,
      weeklyAverage,
      monthlyCompletion: monthlyData,
      yearlyCompletion: yearlyData,
      perfectDaysThisMonth,
      perfectDaysThisYear,
    };
  }

  private async countPerfectDays(
    userId: string,
    fromDate: Date,
  ): Promise<number> {
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: fromDate,
        },
      },
    });

    // Group by date
    const byDate = new Map<string, typeof instances>();

    for (const instance of instances) {
      const dateKey = instance.date.toISOString().split('T')[0];
      const existing = byDate.get(dateKey) || [];
      byDate.set(dateKey, [...existing, instance]);
    }

    // Count perfect days
    let perfectDays = 0;

    for (const [, dayInstances] of byDate) {
      const total = dayInstances.length;
      const completed = dayInstances.filter(
        (i) => i.status === 'COMPLETED',
      ).length;
      const skipped = dayInstances.filter((i) => i.status === 'SKIPPED').length;

      const nonSkipped = total - skipped;

      if (total > 0 && nonSkipped > 0 && completed === nonSkipped) {
        perfectDays += 1;
      }
    }

    return perfectDays;
  }

  private async getMonthlyCompletion(
    userId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    if (instances.length === 0) return 0;

    const completed = instances.filter((i) => i.status === 'COMPLETED').length;
    const skipped = instances.filter((i) => i.status === 'SKIPPED').length;
    const nonSkipped = instances.length - skipped;

    return nonSkipped > 0 ? Math.round((completed / nonSkipped) * 100) : 0;
  }

  private async getYearlyCompletion(
    userId: string,
    year: number,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const instances = await this.prisma.taskInstance.findMany({
      where: {
        task: { userId },
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    if (instances.length === 0) return 0;

    const completed = instances.filter((i) => i.status === 'COMPLETED').length;
    const skipped = instances.filter((i) => i.status === 'SKIPPED').length;
    const nonSkipped = instances.length - skipped;

    return nonSkipped > 0 ? Math.round((completed / nonSkipped) * 100) : 0;
  }
}
