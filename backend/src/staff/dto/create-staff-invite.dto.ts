import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const STAFF_SCOPES = [
  'entry_scan',
  'benefit_check',
  'event_check',
  'adult_check',
  'student_check',
] as const;

export type StaffScope = (typeof STAFF_SCOPES)[number];

export class CreateStaffInviteDto {
  @ApiProperty({ example: 'gate_staff' })
  @IsString()
  @MaxLength(80)
  role: string;

  @ApiProperty({ enum: STAFF_SCOPES, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(STAFF_SCOPES, { each: true })
  scope: StaffScope[];

  @ApiPropertyOptional({
    description: 'Defaults to 7 days from creation when omitted.',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
