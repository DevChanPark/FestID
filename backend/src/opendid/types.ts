export type OpenDidMode = 'self_hosted';

export type OpenDidCredentialType = 'entry' | 'student' | 'adult' | 'staff' | 'admin';

export type OpenDidCredentialIssueMode = 'official_wallet' | 'custom_direct';

export type OpenDidCredentialVerifyMode = 'official_vp' | 'custom_status';

export interface OpenDidCredentialConfig {
  schemaId?: string;
  schemaName?: string;
  vcPlanId?: string;
  issueProfileId?: string;
  credentialDefinitionId?: string;
  verifyPolicyId?: string;
}

export interface OpenDidWalletIssueOfferResult {
  walletTransactionId: string;
  credentialId: string;
  credentialType: OpenDidCredentialType;
  festivalId?: string | null;
  vcPlanId: string;
  txId?: string;
  issueOfferPayload?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export interface OpenDidWalletVerifyOfferResult {
  walletTransactionId: string;
  credentialType: OpenDidCredentialType;
  policyId: string;
  requestId: string;
  txId?: string;
  payload?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export interface OpenDidCredentialIssueInput {
  userId: string;
  subjectDid: string;
  issuerDid: string;
  festivalId?: string;
  type: OpenDidCredentialType;
  claims: Record<string, unknown>;
  expiresAt?: Date;
}

export interface OpenDidCredentialIssueResult {
  credentialProvider: 'opendid';
  issuerDid?: string;
  externalCredentialId?: string;
  vcJwt?: string;
  vcDocument?: Record<string, unknown>;
  proof?: Record<string, unknown>;
  schemaId?: string;
  issuerServiceId?: string;
  credentialStatusId?: string;
  externalStatus?: string;
  issuedTxId?: string;
  raw?: Record<string, unknown>;
}

export interface OpenDidCredentialStatusInput {
  credentialId?: string | null;
  credentialStatusId?: string | null;
  vcJwt?: string | null;
}

export interface OpenDidCredentialStatusResult {
  valid: boolean;
  revoked?: boolean;
  expired?: boolean;
  externalStatus?: string;
  raw?: Record<string, unknown>;
}

export interface OpenDidCredentialRevokeInput {
  credentialId?: string | null;
  credentialStatusId?: string | null;
  vcJwt?: string | null;
  reason?: string;
}

export interface OpenDidCredentialRevokeResult {
  revoked: boolean;
  externalStatus?: string;
  revokedTxId?: string;
  raw?: Record<string, unknown>;
}
