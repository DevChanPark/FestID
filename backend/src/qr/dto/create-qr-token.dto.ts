import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const QR_PURPOSES = [
  'entry',
  'benefit',
  'event',
  'adult_check',
  'student_check',
] as const;

export class CreateQrTokenDto {
  @ApiPropertyOptional({ enum: QR_PURPOSES, default: 'entry' })
  @IsOptional()
  @IsIn(QR_PURPOSES)
  purpose?: (typeof QR_PURPOSES)[number];

  @ApiPropertyOptional({
    default: 300,
    description: 'QR token lifetime in seconds. Allowed range: 30-600.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(600)
  expiresInSeconds?: number;
}
