import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const STUDENT_VERIFICATION_STATUSES = ['approved', 'rejected'] as const;

export class UpdateStudentVerificationStatusDto {
  @ApiProperty({ enum: STUDENT_VERIFICATION_STATUSES })
  @IsIn(STUDENT_VERIFICATION_STATUSES)
  status: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
