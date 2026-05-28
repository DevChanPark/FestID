import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenDidCredentialType } from './types';

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
      '/credentials/issue';
  }

  get revokePath(): string {
    return this.configService.get<string>('OPENDID_CREDENTIAL_REVOKE_PATH') ??
      '/credentials/revoke';
  }

  get verifyPath(): string {
    return this.configService.get<string>('OPENDID_CREDENTIAL_VERIFY_PATH') ??
      '/credentials/verify';
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

  private emptyToUndefined(value: string | undefined): string | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }
    return value;
  }
}
