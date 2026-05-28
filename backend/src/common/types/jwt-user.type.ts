import { AuthProviderType } from '../../auth/providers/mobile-id-auth-provider.interface';

export interface JwtUser {
  sub: string;
  did: string;
  provider: AuthProviderType;
}
