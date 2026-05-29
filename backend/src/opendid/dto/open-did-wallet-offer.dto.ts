import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const OPEN_DID_CREDENTIAL_TYPES = [
  'entry',
  'adult',
  'student',
  'staff',
  'admin',
] as const;

export type OpenDidCredentialTypeValue =
  (typeof OPEN_DID_CREDENTIAL_TYPES)[number];

export class CreateOpenDidIssueOfferDto {
  @ApiProperty({
    description:
      'CamPass credential id. The credential must belong to the authenticated user and have status=issued.',
  })
  @IsString()
  @IsUUID()
  credentialId: string;
}

export class CreateOpenDidVerifyOfferDto {
  @ApiProperty({ enum: OPEN_DID_CREDENTIAL_TYPES })
  @IsIn(OPEN_DID_CREDENTIAL_TYPES)
  credentialType: OpenDidCredentialTypeValue;

  @ApiPropertyOptional({
    description:
      'Optional request id sent to the official verifier. Defaults to a generated UUID.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}

export class RequestOpenDidIssueProfileDto {
  @ApiProperty()
  @IsString()
  txId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;

  @ApiPropertyOptional({
    description:
      'Holder wallet DID. Defaults to the authenticated CamPass user DID when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  holderDid?: string;

  @ApiPropertyOptional({
    description:
      'Official OpenDID holder PII field, passed through only when the wallet flow provides it.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  holderPii?: string;
}

export class RequestOpenDidVerifyProfileDto {
  @ApiProperty()
  @IsString()
  offerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}
