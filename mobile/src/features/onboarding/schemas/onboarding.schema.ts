import { z } from 'zod';

export const onboardingNameSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters'),
});

export type OnboardingNameData = z.infer<typeof onboardingNameSchema>;

export const createBlockSchema = z.object({
  name: z.string().min(1, 'Block name is required').max(30, 'Name too long'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  activeDays: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  reminderEnabled: z.boolean().default(false),
  reminderHour: z.number().min(0).max(23).optional(),
  sortOrder: z.number().default(0),
});

export type CreateBlockData = z.infer<typeof createBlockSchema>;

export const updateBlockSchema = createBlockSchema.extend({
  id: z.string().uuid('Invalid block ID'),
});

export type UpdateBlockData = z.infer<typeof updateBlockSchema>;

export const remindersSchema = z.object({
  dayCloseEnabled: z.boolean().default(true),
  dayCloseHour: z.number().min(0).max(23).default(21),
  blockRemindersEnabled: z.boolean().default(true),
});

export type RemindersData = z.infer<typeof remindersSchema>;
