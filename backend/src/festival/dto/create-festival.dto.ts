import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateFestivalDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  schoolName: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

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

  @ApiPropertyOptional({ enum: VISIBILITY_VALUES, default: 'private' })
  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  visibility?: 'public' | 'private';

  @ApiPropertyOptional({ enum: FESTIVAL_STATUSES, default: 'draft' })
  @IsOptional()
  @IsIn(FESTIVAL_STATUSES)
  status?: 'draft' | 'active' | 'ended';
}
