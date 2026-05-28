import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import {
  AUTH_PROVIDER_TYPES,
  AuthProviderType,
} from '../providers/mobile-id-auth-provider.interface';

export class VerifyMobileIdAuthDto {
  @ApiProperty({ enum: AUTH_PROVIDER_TYPES })
  @IsIn(AUTH_PROVIDER_TYPES)
  provider: AuthProviderType;

  @ApiProperty()
  @IsString()
  authRequestId: string;

  @ApiPropertyOptional({
    description: 'State returned by /auth/mobile-id/start and echoed by SDK callback when supported.',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'Raw SDK result such as token, JWT, authCode, VP, or eVP.',
    type: Object,
  })
  @IsObject()
  result: Record<string, unknown>;
}
