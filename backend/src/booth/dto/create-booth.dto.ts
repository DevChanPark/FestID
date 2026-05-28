import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const BOOTH_CATEGORIES = [
  'food',
  'experience',
  'goods',
  'event',
  'alcohol',
] as const;

export const OPERATING_STATUSES = [
  'open',
  'crowded',
  'closing_soon',
  'closed',
] as const;

export const REQUIRED_PERMISSIONS = [
  'none',
  'entry',
  'student',
  'adult',
  'staff',
] as const;

export const BENEFIT_POLICIES = [
  'none',
  'once_per_user',
  'once_per_day',
  'student_once',
  'adult_once',
] as const;

export class CreateBoothDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: BOOTH_CATEGORIES })
  @IsIn(BOOTH_CATEGORIES)
  category: (typeof BOOTH_CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ enum: OPERATING_STATUSES, default: 'open' })
  @IsOptional()
  @IsIn(OPERATING_STATUSES)
  operatingStatus?: (typeof OPERATING_STATUSES)[number];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  currentWaitingCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  expectedWaitTime?: number;

  @ApiPropertyOptional({ enum: REQUIRED_PERMISSIONS, default: 'none' })
  @IsOptional()
  @IsIn(REQUIRED_PERMISSIONS)
  requiredPermission?: (typeof REQUIRED_PERMISSIONS)[number];

  @ApiPropertyOptional({ enum: BENEFIT_POLICIES, default: 'none' })
  @IsOptional()
  @IsIn(BENEFIT_POLICIES)
  benefitPolicy?: (typeof BENEFIT_POLICIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  posterUrl?: string;
}
