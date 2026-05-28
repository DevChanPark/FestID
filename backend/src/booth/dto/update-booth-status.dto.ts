import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { OPERATING_STATUSES } from './create-booth.dto';

export class UpdateBoothStatusDto {
  @ApiProperty({ enum: OPERATING_STATUSES })
  @IsIn(OPERATING_STATUSES)
  operatingStatus: (typeof OPERATING_STATUSES)[number];
}
