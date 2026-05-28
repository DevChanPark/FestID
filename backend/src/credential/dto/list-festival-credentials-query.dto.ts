import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const CREDENTIAL_TYPES = ['entry', 'student', 'adult', 'staff', 'admin'] as const;
const CREDENTIAL_STATUSES = ['issued', 'pending', 'expired', 'revoked'] as const;

export class ListFestivalCredentialsQueryDto {
  @ApiPropertyOptional({ enum: CREDENTIAL_TYPES })
  @IsOptional()
  @IsIn(CREDENTIAL_TYPES)
  type?: (typeof CREDENTIAL_TYPES)[number];

  @ApiPropertyOptional({ enum: CREDENTIAL_STATUSES })
  @IsOptional()
  @IsIn(CREDENTIAL_STATUSES)
  status?: (typeof CREDENTIAL_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUUID()
  userId?: string;

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
}
