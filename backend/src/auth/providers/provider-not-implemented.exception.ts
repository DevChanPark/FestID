import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthProviderType } from './mobile-id-auth-provider.interface';

export class ProviderNotImplementedException extends HttpException {
  constructor(provider: AuthProviderType) {
    super(
      {
        code: 'PROVIDER_NOT_IMPLEMENTED',
        message:
          'Mobile ID provider SDK is not configured yet. Add the real SDK verification details before enabling authentication.',
        provider,
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
