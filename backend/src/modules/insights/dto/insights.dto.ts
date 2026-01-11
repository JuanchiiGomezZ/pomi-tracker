import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getCalendarSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export class GetCalendarDto extends createZodDto(getCalendarSchema) {}

export const getHeatmapSchema = z.object({
  year: z.coerce.number().min(2020).max(2100).optional(),
});

export class GetHeatmapDto extends createZodDto(getHeatmapSchema) {}

export const getDailyStatsSchema = z.object({
  date: z.string(), // YYYY-MM-DD
});

export class GetDailyStatsDto extends createZodDto(getDailyStatsSchema) {}

// Response types
export interface DayCompletion {
  date: string;
  total: number;
  completed: number;
  skipped: number;
  percentage: number; // 0-100
  status: 'perfect' | 'partial' | 'none' | 'no_tasks';
}

export interface CalendarDay {
  day: number;
  date: string;
  total: number;
  completed: number;
  skipped: number;
  percentage: number;
  status: 'perfect' | 'partial' | 'none' | 'no_tasks';
}

export interface HeatmapDay {
  date: string;
  percentage: number; // 0-100 for intensity
  status: 'perfect' | 'partial' | 'none' | 'no_tasks';
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  totalPerfectDays: number;
}

export interface WeeklyAverage {
  weekStartDate: string;
  averagePercentage: number;
}

export interface InsightsSummary {
  streak: StreakInfo;
  weeklyAverage: number;
  monthlyCompletion: number;
  yearlyCompletion: number;
  perfectDaysThisMonth: number;
  perfectDaysThisYear: number;
}
