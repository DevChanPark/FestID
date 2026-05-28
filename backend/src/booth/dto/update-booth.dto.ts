import { ApiPropertyOptional } from '@nestjs/swagger';
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
import {
  BENEFIT_POLICIES,
  BOOTH_CATEGORIES,
  OPERATING_STATUSES,
  REQUIRED_PERMISSIONS,
} from './create-booth.dto';

export class UpdateBoothDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: BOOTH_CATEGORIES })
  @IsOptional()
  @IsIn(BOOTH_CATEGORIES)
  category?: (typeof BOOTH_CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ enum: OPERATING_STATUSES })
  @IsOptional()
  @IsIn(OPERATING_STATUSES)
  operatingStatus?: (typeof OPERATING_STATUSES)[number];

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ enum: REQUIRED_PERMISSIONS })
  @IsOptional()
  @IsIn(REQUIRED_PERMISSIONS)
  requiredPermission?: (typeof REQUIRED_PERMISSIONS)[number];

  @ApiPropertyOptional({ enum: BENEFIT_POLICIES })
  @IsOptional()
  @IsIn(BENEFIT_POLICIES)
  benefitPolicy?: (typeof BENEFIT_POLICIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  posterUrl?: string;
}
