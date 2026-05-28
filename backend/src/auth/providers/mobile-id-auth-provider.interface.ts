export const AUTH_PROVIDER_TYPES = [
  'omnione_cx',
  'mobile_id_sdk',
  'raonsecure_sdk',
] as const;

export type AuthProviderType = (typeof AUTH_PROVIDER_TYPES)[number];

export const CLIENT_TYPES = ['admin_web', 'mobile_app'] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

export interface AuthResult {
  provider: AuthProviderType;
  providerUserId: string;
  name?: string;
  phone?: string;
  birthDate?: string;
  isAdult?: boolean;
  verifiedAt: string;
  raw?: unknown;
}

export interface StartMobileIdAuthInput {
  authRequestId: string;
  provider: AuthProviderType;
  clientType: ClientType;
  redirectUri?: string;
  nonce: string;
  state: string;
  expiresAt: string;
  options?: Record<string, unknown>;
}

export interface StartMobileIdAuthOutput {
  authRequestId: string;
  provider: AuthProviderType;
  nonce: string;
  state: string;
  expiresAt: string;
  payload: unknown;
  providerState?: MobileIdProviderState;
}

export interface VerifyMobileIdAuthInput {
  provider: AuthProviderType;
  authRequestId: string;
  nonce: string;
  state: string;
  result: unknown;
  providerState?: MobileIdProviderState;
}

export interface MobileIdAuthProvider {
  startAuth(input: StartMobileIdAuthInput): Promise<StartMobileIdAuthOutput>;
  verify(input: VerifyMobileIdAuthInput): Promise<AuthResult>;
}

export interface MobileIdProviderState {
  oacxToken?: string;
  oacxTxId?: string;
  oacxCxId?: string;
  oacxProvider?: string;
  oacxRequestType?: string;
  oacxAuthFlow?: string;
  oacxUseConvertor?: boolean;
  oacxStatus?: string;
  oacxResultCode?: string;
}
