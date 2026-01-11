import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Days of week validation: 0=Sun, 1=Mon, ..., 6=Sat
const dayOfWeekSchema = z.number().min(0).max(6);

// Hour validation: 0-23
const hourSchema = z.number().int().min(0).max(23).optional();

export const createBlockSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  activeDays: z.array(dayOfWeekSchema).default([0, 1, 2, 3, 4, 5, 6]),
  sortOrder: z.number().int().min(0).optional(),
  // Reminder settings
  reminderEnabled: z.boolean().default(false),
  reminderHour: hourSchema,
});

export class CreateBlockDto extends createZodDto(createBlockSchema) {}

export const updateBlockSchema = createBlockSchema.partial();

export class UpdateBlockDto extends createZodDto(updateBlockSchema) {}

export const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string().uuid()),
});

export class ReorderBlocksDto extends createZodDto(reorderBlocksSchema) {}
