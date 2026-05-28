import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { AUTH_PROVIDER_TYPES, AuthProviderType } from '../providers/mobile-id-auth-provider.interface';

const AUTH_REQUEST_STATUSES = ['pending', 'verified', 'expired', 'failed'] as const;

export class AuthRequestStatusQueryDto {
  @ApiPropertyOptional({ enum: AUTH_PROVIDER_TYPES })
  @IsOptional()
  @IsIn(AUTH_PROVIDER_TYPES)
  provider?: AuthProviderType;

  @ApiPropertyOptional({ enum: AUTH_REQUEST_STATUSES })
  @IsOptional()
  @IsIn(AUTH_REQUEST_STATUSES)
  status?: (typeof AUTH_REQUEST_STATUSES)[number];
}
