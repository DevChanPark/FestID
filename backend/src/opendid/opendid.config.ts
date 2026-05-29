import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OpenDidCredentialConfig,
  OpenDidCredentialIssueMode,
  OpenDidCredentialType,
  OpenDidCredentialVerifyMode,
} from './types';

@Injectable()
export class OpenDidConfigService {
  constructor(private readonly configService: ConfigService) {}

  get mode(): 'self_hosted' {
    return 'self_hosted';
  }

  get credentialIssuanceEnabled(): boolean {
    return this.configService.get<string>('OPENDID_CREDENTIAL_ISSUANCE_ENABLED') === 'true';
  }

  get verificationEnabled(): boolean {
    return this.configService.get<string>('OPENDID_VERIFICATION_ENABLED') === 'true';
  }

  get credentialIssueMode(): OpenDidCredentialIssueMode {
    return this.parseEnum<OpenDidCredentialIssueMode>(
      this.configService.get<string>('OPENDID_CREDENTIAL_ISSUE_MODE'),
      ['official_wallet', 'custom_direct'],
      'official_wallet',
    );
  }

  get credentialVerifyMode(): OpenDidCredentialVerifyMode {
    return this.parseEnum<OpenDidCredentialVerifyMode>(
      this.configService.get<string>('OPENDID_CREDENTIAL_VERIFY_MODE'),
      ['official_vp', 'custom_status'],
      'official_vp',
    );
  }

  get issuerBaseUrl(): string | undefined {
    return this.emptyToUndefined(this.configService.get<string>('OPENDID_ISSUER_BASE_URL'));
  }

  get verifierBaseUrl(): string | undefined {
    return this.emptyToUndefined(this.configService.get<string>('OPENDID_VERIFIER_BASE_URL'));
  }

  get issuerDid(): string | undefined {
    return this.emptyToUndefined(this.configService.get<string>('OPENDID_ISSUER_DID'));
  }

  get issuerKid(): string | undefined {
    return this.emptyToUndefined(this.configService.get<string>('OPENDID_ISSUER_KID'));
  }

  get issuerServiceId(): string | undefined {
    return this.emptyToUndefined(
      this.configService.get<string>('OPENDID_ISSUER_SERVICE_ID'),
    );
  }

  get apiToken(): string | undefined {
    return this.emptyToUndefined(this.configService.get<string>('OPENDID_API_TOKEN'));
  }

  get issuePath(): string {
    return this.configService.get<string>('OPENDID_CREDENTIAL_ISSUE_PATH') ??
      '/issuer/api/v1/issue-vc';
  }

  get revokePath(): string {
    return this.configService.get<string>('OPENDID_CREDENTIAL_REVOKE_PATH') ??
      '/issuer/api/v1/revoke-vc';
  }

  get verifyPath(): string {
    return this.configService.get<string>('OPENDID_CREDENTIAL_VERIFY_PATH') ??
      '/verifier/api/v1/request-verify';
  }

  get issueOfferPath(): string {
    return this.configService.get<string>('OPENDID_ISSUE_OFFER_PATH') ??
      '/issuer/api/v1/request-offer';
  }

  get issueProfilePath(): string {
    return this.configService.get<string>('OPENDID_ISSUE_PROFILE_PATH') ??
      '/issuer/api/v1/generate-issue-profile';
  }

  get verifyOfferPath(): string {
    return this.configService.get<string>('OPENDID_VERIFY_OFFER_PATH') ??
      '/verifier/api/v1/request-offer-qr';
  }

  get verifyProfilePath(): string {
    return this.configService.get<string>('OPENDID_VERIFY_PROFILE_PATH') ??
      '/verifier/api/v1/request-profile';
  }

  get issuerHealthPath(): string | undefined {
    return this.emptyToUndefined(
      this.configService.get<string>('OPENDID_ISSUER_HEALTH_PATH'),
    );
  }

  get verifierHealthPath(): string | undefined {
    return this.emptyToUndefined(
      this.configService.get<string>('OPENDID_VERIFIER_HEALTH_PATH'),
    );
  }

  get requestTimeoutMs(): number {
    const raw = this.configService.get<string>('OPENDID_REQUEST_TIMEOUT_MS');
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10000;
  }

  getSchemaId(type: OpenDidCredentialType): string | undefined {
    const key = `OPENDID_${type.toUpperCase()}_SCHEMA_ID`;
    return this.emptyToUndefined(this.configService.get<string>(key));
  }

  getCredentialConfig(type: OpenDidCredentialType): OpenDidCredentialConfig {
    const prefix = `OPENDID_${type.toUpperCase()}`;
    return {
      schemaId: this.emptyToUndefined(
        this.configService.get<string>(`${prefix}_SCHEMA_ID`),
      ),
      schemaName: this.emptyToUndefined(
        this.configService.get<string>(`${prefix}_SCHEMA_NAME`),
      ),
      vcPlanId: this.emptyToUndefined(
        this.configService.get<string>(`${prefix}_VC_PLAN_ID`),
      ),
      issueProfileId: this.emptyToUndefined(
        this.configService.get<string>(`${prefix}_ISSUE_PROFILE_ID`),
      ),
      credentialDefinitionId: this.emptyToUndefined(
        this.configService.get<string>(`${prefix}_CREDENTIAL_DEFINITION_ID`),
      ),
      verifyPolicyId: this.emptyToUndefined(
        this.configService.get<string>(`${prefix}_VERIFY_POLICY_ID`),
      ),
    };
  }

  private emptyToUndefined(value: string | undefined): string | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }
    return value;
  }

  private parseEnum<T extends string>(
    value: string | undefined,
    allowedValues: readonly T[],
    fallback: T,
  ): T {
    if (!value) {
      return fallback;
    }

    return allowedValues.includes(value as T) ? (value as T) : fallback;
  }
}
