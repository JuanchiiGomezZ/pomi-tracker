import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsUUID()
  @IsOptional()
  organizationId?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  avatarUrl?: string | null;
}

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  timezone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  dayCutoffHour?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  dayCloseReminderHour?: number;
}

export class RegisterFcmTokenDto {
  @IsString()
  @MinLength(1)
  fcmToken: string;
}
