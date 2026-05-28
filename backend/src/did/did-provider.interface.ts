export type DidProviderType = 'campass' | 'opendid';

export interface CreateUserDidInput {
  userId?: string;
}

export interface DidRegistrationResult {
  did: string;
  didMethod: 'campass' | 'omnione' | 'opendid';
  externalDid?: string;
  didDocument?: Record<string, unknown>;
  registrationTxId?: string;
  registeredAt?: string;
}

export interface DidProvider {
  readonly type: DidProviderType;
  createUserDid(input?: CreateUserDidInput): DidRegistrationResult;
  maskDid(did: string): string;
}
