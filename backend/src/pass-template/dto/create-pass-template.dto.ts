import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const PASS_TEMPLATE_TYPES = [
  'entry',
  'student',
  'adult',
  'staff',
  'admin',
] as const;

export type PassTemplateType = (typeof PASS_TEMPLATE_TYPES)[number];

export class CreatePassTemplateDto {
  @ApiProperty({ enum: PASS_TEMPLATE_TYPES })
  @IsIn(PASS_TEMPLATE_TYPES)
  type: PassTemplateType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Provider-agnostic verification rule JSON for this template.',
  })
  @IsOptional()
  @IsObject()
  verificationRule?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
