import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const PROOF_STATUS_FILTERS = ['pending', 'approved', 'rejected'] as const;

export class ListAdminProfilesQueryDto {
  @ApiPropertyOptional({ enum: PROOF_STATUS_FILTERS })
  @IsOptional()
  @IsIn(PROOF_STATUS_FILTERS)
  proofStatus?: (typeof PROOF_STATUS_FILTERS)[number];

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
