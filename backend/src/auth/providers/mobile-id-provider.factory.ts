import { Injectable } from '@nestjs/common';
import {
  AuthProviderType,
  MobileIdAuthProvider,
} from './mobile-id-auth-provider.interface';
import { MobileIdSdkProvider } from './mobile-id-sdk.provider';
import { OmniOneCxProvider } from './omnione-cx.provider';
import { RaonSecureProvider } from './raonsecure.provider';

@Injectable()
export class MobileIdProviderFactory {
  constructor(
    private readonly omnioneCxProvider: OmniOneCxProvider,
    private readonly mobileIdSdkProvider: MobileIdSdkProvider,
    private readonly raonSecureProvider: RaonSecureProvider,
  ) {}

  getProvider(provider: AuthProviderType): MobileIdAuthProvider {
    switch (provider) {
      case 'omnione_cx':
        return this.omnioneCxProvider;
      case 'mobile_id_sdk':
        return this.mobileIdSdkProvider;
      case 'raonsecure_sdk':
        return this.raonSecureProvider;
    }
  }
}
