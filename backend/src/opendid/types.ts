export type OpenDidMode = 'self_hosted';

export type OpenDidCredentialType = 'entry' | 'student' | 'adult' | 'staff' | 'admin';

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
