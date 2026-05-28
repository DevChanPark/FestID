import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProviderType } from './mobile-id-auth-provider.interface';

type ProviderEnvSpec = {
  prefix: string;
  implementation: 'implemented' | 'pending_sdk_documents';
  requiredKeys: string[];
  optionalKeys: string[];
};

const PROVIDER_ENV_SPECS: Record<AuthProviderType, ProviderEnvSpec> = {
  omnione_cx: {
    prefix: 'OMNIONE_CX',
    implementation: 'implemented',
    requiredKeys: [
      'OMNIONE_CX_BASE_URL',
      'OMNIONE_CX_PROVIDER_ID',
      'OMNIONE_CX_SIGN_TYPE',
    ],
    optionalKeys: [
      'OMNIONE_CX_WEB_BASE_URL',
      'OMNIONE_CX_CONFIG_URL',
      'OMNIONE_CX_REQUEST_TYPE',
      'OMNIONE_CX_USE_CONVERTOR',
      'OMNIONE_CX_ZKP_TYPE',
    ],
  },
  mobile_id_sdk: {
    prefix: 'MOBILE_ID_SDK',
    implementation: 'pending_sdk_documents',
    requiredKeys: [
      'MOBILE_ID_SDK_BASE_URL',
      'MOBILE_ID_SDK_CLIENT_ID',
      'MOBILE_ID_SDK_CLIENT_SECRET',
      'MOBILE_ID_SDK_REDIRECT_URI',
      'MOBILE_ID_SDK_JWKS_URL',
    ],
    optionalKeys: [],
  },
  raonsecure_sdk: {
    prefix: 'RAONSECURE_SDK',
    implementation: 'pending_sdk_documents',
    requiredKeys: [
      'RAONSECURE_SDK_BASE_URL',
      'RAONSECURE_SDK_CLIENT_ID',
      'RAONSECURE_SDK_CLIENT_SECRET',
      'RAONSECURE_SDK_REDIRECT_URI',
      'RAONSECURE_SDK_JWKS_URL',
    ],
    optionalKeys: [],
  },
};

@Injectable()
export class MobileIdProviderConfigService {
  constructor(private readonly configService: ConfigService) {}

  getProviderStatus(provider: AuthProviderType) {
    const spec = PROVIDER_ENV_SPECS[provider];
    const missingRequiredKeys = spec.requiredKeys.filter(
      (key) => !this.configService.get<string>(key),
    );

    return {
      provider,
      configured: missingRequiredKeys.length === 0,
      implementation: spec.implementation,
      requiredKeys: spec.requiredKeys,
      optionalKeys: spec.optionalKeys,
      missingRequiredKeys,
      configuredKeys: [...spec.requiredKeys, ...spec.optionalKeys].filter((key) =>
        Boolean(this.configService.get<string>(key)),
      ),
    };
  }

  listProviderStatuses() {
    return {
      providers: Object.keys(PROVIDER_ENV_SPECS).map((provider) =>
        this.getProviderStatus(provider as AuthProviderType),
      ),
    };
  }
}
