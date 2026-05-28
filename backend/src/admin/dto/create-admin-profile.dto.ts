import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateAdminProfileDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  schoolName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  organizationName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiProperty({
    description: 'Organization role/title. This is not the Admin VC permission role.',
  })
  @IsString()
  @MaxLength(100)
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  proofFileUrl?: string;
}
