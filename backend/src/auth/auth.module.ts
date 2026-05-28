import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MobileIdProviderFactory } from './providers/mobile-id-provider.factory';
import { MobileIdProviderConfigService } from './providers/mobile-id-provider-config.service';
import { MobileIdSdkProvider } from './providers/mobile-id-sdk.provider';
import { OmniOneCxProvider } from './providers/omnione-cx.provider';
import { RaonSecureProvider } from './providers/raonsecure.provider';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    MobileIdProviderConfigService,
    MobileIdProviderFactory,
    OmniOneCxProvider,
    MobileIdSdkProvider,
    RaonSecureProvider,
  ],
  exports: [AuthService],
})
export class AuthModule {}
