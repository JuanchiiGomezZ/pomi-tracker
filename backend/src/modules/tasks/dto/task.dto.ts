import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Days of week validation: 0=Sun, 1=Mon, ..., 6=Sat
const dayOfWeekSchema = z.number().min(0).max(6);

const baseTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  emoji: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  blockId: z.string().uuid().optional(),
});

export const createTaskSchema = baseTaskSchema.extend({
  // Type differentiation
  isOneOff: z.boolean().default(false),

  // One-off specific
  dueDate: z.string().datetime().optional(), // ISO date string

  // Loop specific (only used if isOneOff is false)
  daysOfWeek: z.array(dayOfWeekSchema).default([1, 2, 3, 4, 5]),
  skipDays: z.number().int().min(0).default(0),
  resetDays: z.number().int().min(0).default(0),
});

export class CreateTaskDto extends createZodDto(createTaskSchema) {}

export const updateTaskSchema = createTaskSchema.partial();

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()),
});

export class ReorderTasksDto extends createZodDto(reorderTasksSchema) {}

export const getTasksForDateSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED', 'ALL']).default('ALL'),
  blockId: z.string().uuid().optional(),
});

export class GetTasksForDateDto extends createZodDto(getTasksForDateSchema) {}
