import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const REQUESTED_PASS_TYPES = ['entry', 'adult', 'student'] as const;

class StudentProofDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  schoolName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  studentId: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  schoolEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  proofFileUrl?: string;
}

export class IssuePassDto {
  @ApiProperty({ enum: REQUESTED_PASS_TYPES, isArray: true })
  @IsArray()
  @IsIn(REQUESTED_PASS_TYPES, { each: true })
  requestedTypes: Array<(typeof REQUESTED_PASS_TYPES)[number]>;

  @ApiPropertyOptional({ type: StudentProofDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentProofDto)
  studentProof?: StudentProofDto;
}
