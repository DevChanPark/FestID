import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export const SCAN_PURPOSES = [
  'entry',
  'benefit',
  'event',
  'adult_check',
  'student_check',
] as const;

export type ScanPurposeValue = (typeof SCAN_PURPOSES)[number];

export class VerifyQrDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  festivalId: string;

  @ApiProperty({ enum: SCAN_PURPOSES })
  @IsIn(SCAN_PURPOSES)
  scanPurpose: ScanPurposeValue;

  @ApiPropertyOptional({
    description: 'Required for booth-scoped scans such as benefit, event, adult_check, and student_check.',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  boothId?: string;
}
