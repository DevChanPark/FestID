import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export const REPORT_SCAN_PURPOSES = [
  'entry',
  'benefit',
  'event',
  'adult_check',
  'student_check',
] as const;

export const REPORT_VERIFICATION_RESULTS = [
  'allowed',
  'denied',
  'expired',
  'already_used',
  'missing_credential',
  'invalid_qr',
  'missing_staff_scope',
] as const;

export const REPORT_USAGE_TYPES = [
  'entry',
  'benefit',
  'event',
  'adult_check',
  'student_check',
] as const;

export class ReportListQueryDto {
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ScanReportQueryDto extends ReportListQueryDto {
  @ApiPropertyOptional({ enum: REPORT_SCAN_PURPOSES })
  @IsOptional()
  @IsIn(REPORT_SCAN_PURPOSES)
  scanPurpose?: (typeof REPORT_SCAN_PURPOSES)[number];

  @ApiPropertyOptional({ enum: REPORT_VERIFICATION_RESULTS })
  @IsOptional()
  @IsIn(REPORT_VERIFICATION_RESULTS)
  result?: (typeof REPORT_VERIFICATION_RESULTS)[number];
}

export class UsageReportQueryDto extends ReportListQueryDto {
  @ApiPropertyOptional({ enum: REPORT_USAGE_TYPES })
  @IsOptional()
  @IsIn(REPORT_USAGE_TYPES)
  usageType?: (typeof REPORT_USAGE_TYPES)[number];
}
