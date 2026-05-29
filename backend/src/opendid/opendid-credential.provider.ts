import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenDidConfigService } from './opendid.config';
import { OpenDidHttpService } from './opendid-http.service';
import {
  OpenDidCredentialIssueInput,
  OpenDidCredentialIssueResult,
  OpenDidCredentialRevokeInput,
  OpenDidCredentialRevokeResult,
  OpenDidCredentialStatusInput,
  OpenDidCredentialStatusResult,
} from './types';

@Injectable()
export class OpenDidCredentialProvider {
  constructor(
    private readonly openDidConfigService: OpenDidConfigService,
    private readonly openDidHttpService: OpenDidHttpService,
  ) {}

  async issueCredential(
    input: OpenDidCredentialIssueInput,
  ): Promise<OpenDidCredentialIssueResult | null> {
    if (!this.openDidConfigService.credentialIssuanceEnabled) {
      return null;
    }

    this.requireCustomDirectIssueMode();

    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const issuerDid =
      this.openDidConfigService.issuerDid ?? input.issuerDid;
    const credentialConfig =
      this.openDidConfigService.getCredentialConfig(input.type);
    const payload = {
      issuerDid,
      issuerKid: this.openDidConfigService.issuerKid,
      issuerServiceId: this.openDidConfigService.issuerServiceId,
      subjectDid: input.subjectDid,
      userId: input.userId,
      festivalId: input.festivalId,
      credentialType: input.type,
      schemaId: credentialConfig.schemaId,
      schemaName: credentialConfig.schemaName,
      vcPlanId: credentialConfig.vcPlanId,
      issueProfileId: credentialConfig.issueProfileId,
      credentialDefinitionId: credentialConfig.credentialDefinitionId,
      verifyPolicyId: credentialConfig.verifyPolicyId,
      claims: input.claims,
      expiresAt: input.expiresAt?.toISOString(),
    };

    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      issuerBaseUrl,
      this.openDidConfigService.issuePath,
      payload,
    );

    return this.toIssueResult(response, credentialConfig.schemaId);
  }

  async verifyCredentialStatus(
    input: OpenDidCredentialStatusInput,
  ): Promise<OpenDidCredentialStatusResult | null> {
    if (!this.openDidConfigService.verificationEnabled) {
      return null;
    }

    this.requireCustomStatusVerifyMode();

    const verifierBaseUrl = this.requireConfig(
      this.openDidConfigService.verifierBaseUrl,
      'OPENDID_VERIFIER_BASE_URL',
    );
    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      verifierBaseUrl,
      this.openDidConfigService.verifyPath,
      {
        credentialId: input.credentialId,
        credentialStatusId: input.credentialStatusId,
        vcJwt: input.vcJwt,
      },
    );

    return this.toStatusResult(response);
  }

  async revokeCredential(
    input: OpenDidCredentialRevokeInput,
  ): Promise<OpenDidCredentialRevokeResult | null> {
    if (!this.openDidConfigService.credentialIssuanceEnabled) {
      return null;
    }

    this.requireCustomDirectIssueMode();

    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      issuerBaseUrl,
      this.openDidConfigService.revokePath,
      {
        credentialId: input.credentialId,
        credentialStatusId: input.credentialStatusId,
        vcJwt: input.vcJwt,
        reason: input.reason,
      },
    );

    return this.toRevokeResult(response);
  }

  private toIssueResult(
    response: Record<string, unknown>,
    fallbackSchemaId?: string,
  ): OpenDidCredentialIssueResult {
    const data = this.recordValue(response.data) ?? response;
    const vcDocument =
      this.recordValue(data.vcDocument) ??
      this.recordValue(data.vc) ??
      this.recordValue(data.credential);

    return {
      credentialProvider: 'opendid',
      issuerDid:
        this.stringValue(data.issuerDid) ??
        this.stringValue(this.recordValue(vcDocument?.issuer)?.id) ??
        this.openDidConfigService.issuerDid,
      externalCredentialId:
        this.stringValue(data.externalCredentialId) ??
        this.stringValue(data.credentialId) ??
        this.stringValue(data.vcId) ??
        this.stringValue(data.id),
      vcJwt:
        this.stringValue(data.vcJwt) ??
        this.stringValue(data.jwt) ??
        this.stringValue(data.credentialJwt),
      vcDocument,
      proof:
        this.recordValue(data.proof) ??
        this.recordValue(vcDocument?.proof),
      schemaId:
        this.stringValue(data.schemaId) ??
        this.stringValue(vcDocument?.schemaId) ??
        fallbackSchemaId,
      issuerServiceId:
        this.stringValue(data.issuerServiceId) ??
        this.openDidConfigService.issuerServiceId,
      credentialStatusId:
        this.stringValue(data.credentialStatusId) ??
        this.stringValue(this.recordValue(vcDocument?.credentialStatus)?.id),
      externalStatus:
        this.stringValue(data.status) ??
        this.stringValue(data.credentialStatus),
      issuedTxId:
        this.stringValue(data.txId) ??
        this.stringValue(data.transactionId) ??
        this.stringValue(data.txHash),
      raw: response,
    };
  }

  private toStatusResult(
    response: Record<string, unknown>,
  ): OpenDidCredentialStatusResult {
    const data = this.recordValue(response.data) ?? response;
    const status =
      this.stringValue(data.status) ??
      this.stringValue(data.credentialStatus) ??
      this.stringValue(data.result);
    const revoked =
      data.revoked === true ||
      status === 'revoked' ||
      status === 'REVOKED';
    const expired =
      data.expired === true ||
      status === 'expired' ||
      status === 'EXPIRED';

    return {
      valid:
        data.valid === true ||
        data.verified === true ||
        (!revoked && !expired && status !== 'invalid' && status !== 'INVALID'),
      revoked,
      expired,
      externalStatus: status,
      raw: response,
    };
  }

  private toRevokeResult(
    response: Record<string, unknown>,
  ): OpenDidCredentialRevokeResult {
    const data = this.recordValue(response.data) ?? response;
    const status =
      this.stringValue(data.status) ??
      this.stringValue(data.credentialStatus) ??
      this.stringValue(data.result);

    return {
      revoked:
        data.revoked === true ||
        data.success === true ||
        status === 'revoked' ||
        status === 'REVOKED',
      externalStatus: status,
      revokedTxId:
        this.stringValue(data.txId) ??
        this.stringValue(data.transactionId) ??
        this.stringValue(data.txHash),
      raw: response,
    };
  }

  private requireConfig(value: string | undefined, key: string): string {
    if (!value) {
      throw new BadRequestException({
        code: 'OPENDID_CONFIG_REQUIRED',
        message: `${key} is required when OpenDID integration is enabled.`,
      });
    }

    return value;
  }

  private requireCustomDirectIssueMode() {
    if (this.openDidConfigService.credentialIssueMode === 'custom_direct') {
      return;
    }

    throw new BadRequestException({
      code: 'OPENDID_OFFICIAL_WALLET_FLOW_REQUIRED',
      message:
        'Official OpenDID issuer APIs require the holder wallet issuance protocol. Keep OPENDID_CREDENTIAL_ISSUANCE_ENABLED=false until the wallet flow is connected, or set OPENDID_CREDENTIAL_ISSUE_MODE=custom_direct only when using a compatible custom adapter endpoint.',
    });
  }

  private requireCustomStatusVerifyMode() {
    if (this.openDidConfigService.credentialVerifyMode === 'custom_status') {
      return;
    }

    throw new BadRequestException({
      code: 'OPENDID_OFFICIAL_VP_FLOW_REQUIRED',
      message:
        'Official OpenDID verifier APIs require encrypted VP verification payloads from the holder wallet. Keep OPENDID_VERIFICATION_ENABLED=false until the VP flow is connected, or set OPENDID_CREDENTIAL_VERIFY_MODE=custom_status only when using a compatible custom status adapter endpoint.',
    });
  }

  private recordValue(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() !== ''
      ? value
      : undefined;
  }
}
