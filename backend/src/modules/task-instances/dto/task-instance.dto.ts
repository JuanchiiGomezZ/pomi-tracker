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
