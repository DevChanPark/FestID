import { Injectable } from '@nestjs/common';
import {
  AuthResult,
  MobileIdAuthProvider,
  StartMobileIdAuthInput,
  StartMobileIdAuthOutput,
  VerifyMobileIdAuthInput,
} from './mobile-id-auth-provider.interface';
import { ProviderNotImplementedException } from './provider-not-implemented.exception';

@Injectable()
export class RaonSecureProvider implements MobileIdAuthProvider {
  async startAuth(
    _input: StartMobileIdAuthInput,
  ): Promise<StartMobileIdAuthOutput> {
    throw new ProviderNotImplementedException('raonsecure_sdk');
  }

  async verify(_input: VerifyMobileIdAuthInput): Promise<AuthResult> {
    throw new ProviderNotImplementedException('raonsecure_sdk');
  }
}
