import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class OpenDidStatusQueryDto {
  @ApiPropertyOptional({
    description:
      'When true, probes configured issuer/verifier health endpoints and checks configured OpenDID API paths against /api-docs.',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  probe?: boolean;
}
