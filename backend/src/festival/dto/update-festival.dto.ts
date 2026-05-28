import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

const FESTIVAL_STATUSES = ['draft', 'active', 'ended'] as const;
const VISIBILITY_VALUES = ['public', 'private'] as const;

export class UpdateFestivalDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  schoolName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  operatingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ enum: VISIBILITY_VALUES })
  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  visibility?: 'public' | 'private';

  @ApiPropertyOptional({ enum: FESTIVAL_STATUSES })
  @IsOptional()
  @IsIn(FESTIVAL_STATUSES)
  status?: 'draft' | 'active' | 'ended';
}
