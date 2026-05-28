import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CompleteVerificationDto {
  @ApiProperty({
    description: 'scanLogId returned by POST /verification/qr when result is allowed.',
  })
  @IsString()
  @IsUUID()
  scanLogId: string;
}
