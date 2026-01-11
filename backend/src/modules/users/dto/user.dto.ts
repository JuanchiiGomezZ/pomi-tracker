import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  organizationId: z.string().uuid().optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

// Profile update (user updates their own profile)
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

// User settings (app-specific settings)
export const updateSettingsSchema = z.object({
  timezone: z.string().min(1).max(50).optional(),
  dayCutoffHour: z.number().int().min(0).max(23).optional(),
  dayCloseReminderHour: z.number().int().min(0).max(23).optional(),
});

export class UpdateSettingsDto extends createZodDto(updateSettingsSchema) {}

// FCM token for push notifications
export const registerFcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});

export class RegisterFcmTokenDto extends createZodDto(registerFcmTokenSchema) {}
