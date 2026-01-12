import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

// Days of week validation: 0=Sun, 1=Mon, ..., 6=Sat
// Hour validation: 0-23

export class CreateBlockDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  activeDays?: number[] = [0, 1, 2, 3, 4, 5, 6];

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  // Reminder settings
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean = false;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  reminderHour?: number;
}

export class UpdateBlockDto {
  @IsString()
  @IsOptional()
  @Min(1)
  @Max(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  activeDays?: number[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  reminderHour?: number;
}

export class ReorderBlocksDto {
  @IsArray()
  @IsUUID('4', { each: true })
  blockIds: string[];
}
