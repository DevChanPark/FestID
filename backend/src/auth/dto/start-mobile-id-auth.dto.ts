import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import {
  AUTH_PROVIDER_TYPES,
  AuthProviderType,
  CLIENT_TYPES,
  ClientType,
} from '../providers/mobile-id-auth-provider.interface';

export class StartMobileIdAuthDto {
  @ApiProperty({ enum: AUTH_PROVIDER_TYPES })
  @IsIn(AUTH_PROVIDER_TYPES)
  provider: AuthProviderType;

  @ApiProperty({ enum: CLIENT_TYPES })
  @IsIn(CLIENT_TYPES)
  clientType: ClientType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  redirectUri?: string;

  @ApiPropertyOptional({
    enum: ['app', 'qr'],
    description: 'OmniOne CX flow. app uses WebToApp/AppToApp request; qr returns qrBase64.',
  })
  @IsOptional()
  @IsIn(['app', 'qr'])
  authFlow?: 'app' | 'qr';

  @ApiPropertyOptional({
    description: 'OmniOne OACX provider code such as comdl_v1.5 or comrc_v1.5.',
  })
  @IsOptional()
  @IsString()
  oacxProvider?: string;

  @ApiPropertyOptional({ enum: ['WEB2APP', 'APP2APP'] })
  @IsOptional()
  @IsIn(['WEB2APP', 'APP2APP'])
  requestType?: 'WEB2APP' | 'APP2APP';

  @ApiPropertyOptional({
    description:
      'Whether OmniOne CX should include/request birth-date verification data.',
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
  isBirth?: boolean;

  @ApiPropertyOptional({
    description: 'OmniOne ZKP type such as AdultVerify or GenderVerify.',
  })
  @IsOptional()
  @IsString()
  zkpType?: string;

  @ApiPropertyOptional()
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
  useConvertor?: boolean;
}
