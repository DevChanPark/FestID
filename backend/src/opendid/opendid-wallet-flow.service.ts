import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CredentialStatus, CredentialType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { JwtUser } from '../common/types/jwt-user.type';
import { PrismaService } from '../database/prisma.service';
import {
  CreateOpenDidIssueOfferDto,
  CreateOpenDidVerifyOfferDto,
  RequestOpenDidIssueProfileDto,
  RequestOpenDidVerifyProfileDto,
} from './dto/open-did-wallet-offer.dto';
import { OpenDidConfigService } from './opendid.config';
import { OpenDidHttpService } from './opendid-http.service';
import {
  OpenDidCredentialType,
  OpenDidWalletIssueOfferResult,
  OpenDidWalletVerifyOfferResult,
} from './types';

@Injectable()
export class OpenDidWalletFlowService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly openDidConfigService: OpenDidConfigService,
    private readonly openDidHttpService: OpenDidHttpService,
  ) {}

  async createIssueOffer(
    user: JwtUser,
    dto: CreateOpenDidIssueOfferDto,
  ): Promise<OpenDidWalletIssueOfferResult> {
    const credential = await this.prismaService.credential.findUnique({
      where: { id: dto.credentialId },
    });

    if (!credential) {
      throw new NotFoundException({
        code: 'CREDENTIAL_NOT_FOUND',
        message: 'Credential was not found.',
      });
    }

    if (credential.userId !== user.sub) {
      throw new ForbiddenException({
        code: 'CREDENTIAL_OWNER_REQUIRED',
        message: 'Only the credential owner can request an OpenDID issue offer.',
      });
    }

    if (credential.status !== CredentialStatus.issued) {
      throw new BadRequestException({
        code: 'CREDENTIAL_NOT_ISSUED',
        message: 'Only issued CamPass credentials can request an OpenDID issue offer.',
      });
    }

    const credentialType = this.toOpenDidCredentialType(credential.type);
    const credentialConfig =
      this.openDidConfigService.getCredentialConfig(credentialType);
    const vcPlanId = this.requireConfig(
      credentialConfig.vcPlanId,
      `OPENDID_${credentialType.toUpperCase()}_VC_PLAN_ID`,
    );
    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );

    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      issuerBaseUrl,
      this.openDidConfigService.issueOfferPath,
      { vcPlanId },
    );
    const data = this.recordValue(response.data) ?? response;

    return {
      credentialId: credential.id,
      credentialType,
      festivalId: credential.festivalId,
      vcPlanId,
      txId: this.stringValue(data.txId),
      issueOfferPayload:
        this.recordValue(data.issueOfferPayload) ??
        this.recordValue(data.payload),
      raw: response,
    };
  }

  async requestIssueProfile(
    user: JwtUser,
    dto: RequestOpenDidIssueProfileDto,
  ) {
    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const holderDid = dto.holderDid ?? user.did;

    if (!holderDid) {
      throw new BadRequestException({
        code: 'HOLDER_DID_REQUIRED',
        message: 'Holder DID is required to request an OpenDID issue profile.',
      });
    }

    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      issuerBaseUrl,
      this.openDidConfigService.issueProfilePath,
      {
        id: dto.requestId,
        txId: dto.txId,
        holder: {
          did: holderDid,
          pii: dto.holderPii,
        },
      },
    );

    return {
      txId:
        this.stringValue(this.recordValue(response.data)?.txId) ??
        this.stringValue(response.txId) ??
        dto.txId,
      profile:
        this.recordValue(this.recordValue(response.data)?.profile) ??
        this.recordValue(response.profile),
      raw: response,
    };
  }

  async createVerifyOffer(
    dto: CreateOpenDidVerifyOfferDto,
  ): Promise<OpenDidWalletVerifyOfferResult> {
    const credentialType = dto.credentialType as OpenDidCredentialType;
    const credentialConfig =
      this.openDidConfigService.getCredentialConfig(credentialType);
    const policyId = this.requireConfig(
      credentialConfig.verifyPolicyId,
      `OPENDID_${credentialType.toUpperCase()}_VERIFY_POLICY_ID`,
    );
    const verifierBaseUrl = this.requireConfig(
      this.openDidConfigService.verifierBaseUrl,
      'OPENDID_VERIFIER_BASE_URL',
    );
    const requestId = dto.requestId ?? randomUUID();

    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      verifierBaseUrl,
      this.openDidConfigService.verifyOfferPath,
      {
        id: requestId,
        policyId,
      },
    );
    const data = this.recordValue(response.data) ?? response;

    return {
      credentialType,
      policyId,
      requestId,
      txId: this.stringValue(data.txId),
      payload: this.recordValue(data.payload),
      raw: response,
    };
  }

  async requestVerifyProfile(dto: RequestOpenDidVerifyProfileDto) {
    const verifierBaseUrl = this.requireConfig(
      this.openDidConfigService.verifierBaseUrl,
      'OPENDID_VERIFIER_BASE_URL',
    );
    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      verifierBaseUrl,
      this.openDidConfigService.verifyProfilePath,
      {
        id: dto.requestId,
        txId: dto.txId,
        offerId: dto.offerId,
      },
    );

    return {
      txId:
        this.stringValue(this.recordValue(response.data)?.txId) ??
        this.stringValue(response.txId) ??
        dto.txId,
      profile:
        this.recordValue(this.recordValue(response.data)?.profile) ??
        this.recordValue(response.profile),
      raw: response,
    };
  }

  private toOpenDidCredentialType(type: CredentialType): OpenDidCredentialType {
    return type as OpenDidCredentialType;
  }

  private requireConfig(value: string | undefined, key: string): string {
    if (!value) {
      throw new BadRequestException({
        code: 'OPENDID_CONFIG_REQUIRED',
        message: `${key} is required for the OpenDID wallet flow.`,
      });
    }

    return value;
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
