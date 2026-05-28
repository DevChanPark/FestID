import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateStudentVerificationDto {
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
