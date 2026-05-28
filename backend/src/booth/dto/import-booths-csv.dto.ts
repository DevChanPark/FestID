import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ImportBoothsCsvDto {
  @ApiPropertyOptional({
    default: true,
    description:
      'When true, existing booths with the same name in the festival are updated.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  upsert?: boolean;
}
