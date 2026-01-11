import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const completeInstanceSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  notes: z.string().optional(),
});

export class CompleteInstanceDto extends createZodDto(completeInstanceSchema) {}

export const skipInstanceSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
});

export class SkipInstanceDto extends createZodDto(skipInstanceSchema) {}

export const unskipInstanceSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
});

export class UnskipInstanceDto extends createZodDto(unskipInstanceSchema) {}

export const updateNotesSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  notes: z.string(),
});

export class UpdateNotesDto extends createZodDto(updateNotesSchema) {}

// Batch operations
export const batchCompleteSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  taskIds: z.array(z.string().uuid()).optional(), // Optional: specific tasks, or all pending
});

export class BatchCompleteDto extends createZodDto(batchCompleteSchema) {}

export const batchSkipSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  taskIds: z.array(z.string().uuid()).optional(), // Optional: specific tasks, or all pending
});

export class BatchSkipDto extends createZodDto(batchSkipSchema) {}
