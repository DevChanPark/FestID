import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const UPLOAD_PURPOSES = [
  'admin-proof',
  'student-proof',
  'booth-poster',
  'festival-image',
] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export class UploadPurposeDto {
  @ApiProperty({ enum: UPLOAD_PURPOSES })
  @IsIn(UPLOAD_PURPOSES)
  purpose: UploadPurpose;
}
