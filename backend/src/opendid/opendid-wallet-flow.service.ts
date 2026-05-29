import {
  BadRequestException,
  BadGatewayException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CredentialStatus,
  CredentialType,
  OpenDidWalletFlowType,
  OpenDidWalletFlowStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { JwtUser } from '../common/types/jwt-user.type';
import { PrismaService } from '../database/prisma.service';
import {
  CompleteOpenDidIssueVcDto,
  ConfirmOpenDidVerifyDto,
  CreateOpenDidIssueOfferDto,
  CreateOpenDidVerifyOfferDto,
  InspectOpenDidIssueProposeDto,
  ListOpenDidWalletTransactionsQueryDto,
  RequestOpenDidIssueVcDto,
  RequestOpenDidIssueProfileDto,
  RequestOpenDidVerifyProfileDto,
  RequestOpenDidVerifyVpDto,
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
    const issueOfferPayload =
      this.recordValue(data.issueOfferPayload) ??
      this.recordValue(data.payload);
    const txId = this.stringValue(data.txId);
    const offerId = this.extractOpenDidId(data, issueOfferPayload);
    const transaction =
      await this.prismaService.openDidWalletTransaction.create({
        data: {
          userId: user.sub,
          credentialId: credential.id,
          festivalId: credential.festivalId ?? undefined,
          credentialType: credential.type,
          flowType: 'issue',
          status: OpenDidWalletFlowStatus.offer_created,
          txId,
          offerId,
          vcPlanId,
          payloadJson: this.toJsonValue(issueOfferPayload),
          rawJson: this.toJsonValue(response),
          expiresAt: this.createExpiresAt(),
        },
      });

    return {
      walletTransactionId: transaction.id,
      credentialId: credential.id,
      credentialType,
      festivalId: credential.festivalId,
      vcPlanId,
      txId,
      issueOfferPayload,
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

    const transaction = await this.findWalletTransactionForProfile(user.sub, {
      flowType: 'issue',
      walletTransactionId: dto.walletTransactionId,
      txId: dto.txId,
      requestId: dto.requestId,
    });

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
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
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }
    const data = this.recordValue(response.data) ?? response;
    const txId =
      this.stringValue(data.txId) ?? this.stringValue(response.txId) ?? dto.txId;
    const profile =
      this.recordValue(data.profile) ?? this.recordValue(response.profile);

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status: OpenDidWalletFlowStatus.profile_requested,
        requestId: dto.requestId,
        txId,
        holderDid,
        profileJson: this.toJsonValue(profile),
        rawJson: this.toJsonValue(response),
      },
    });

    return {
      walletTransactionId: transaction.id,
      txId,
      profile,
      raw: response,
    };
  }

  async inspectIssuePropose(user: JwtUser, dto: InspectOpenDidIssueProposeDto) {
    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(user.sub, {
      flowType: 'issue',
      walletTransactionId: dto.walletTransactionId,
      txId: dto.txId,
      requestId: dto.requestId,
      offerId: dto.offerId,
    });
    const vcPlanId = this.requireConfig(
      dto.vcPlanId ?? transaction.vcPlanId ?? undefined,
      'OPENDID_ISSUE_INSPECT_PROPOSE_VC_PLAN_ID',
    );
    const offerId = this.requireConfig(
      dto.offerId ?? transaction.offerId ?? undefined,
      'OPENDID_ISSUE_INSPECT_PROPOSE_OFFER_ID',
    );

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
        issuerBaseUrl,
        this.openDidConfigService.issueInspectProposePath,
        {
          id: dto.requestId,
          vcPlanId,
          issuer: dto.issuer ?? this.openDidConfigService.issuerDid,
          offerId,
        },
      );
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }

    const data = this.recordValue(response.data) ?? response;
    const txId =
      this.stringValue(data.txId) ?? this.stringValue(response.txId) ?? dto.txId;

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        requestId: dto.requestId ?? transaction.requestId,
        txId,
        offerId,
        vcPlanId,
        resultJson: this.toJsonValue(data),
        rawJson: this.toJsonValue(response),
      },
    });

    return {
      walletTransactionId: transaction.id,
      txId,
      refId: this.stringValue(data.refId),
      raw: response,
    };
  }

  async requestIssueVc(user: JwtUser, dto: RequestOpenDidIssueVcDto) {
    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(
      user.sub,
      {
        flowType: 'issue',
        walletTransactionId: dto.walletTransactionId,
        txId: dto.txId,
        requestId: dto.requestId,
      },
      [
        OpenDidWalletFlowStatus.profile_requested,
        OpenDidWalletFlowStatus.request_submitted,
      ],
    );

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
        issuerBaseUrl,
        this.openDidConfigService.issuePath,
        {
          id: dto.requestId,
          txId: dto.txId,
          accE2e: dto.accE2e,
          encReqVc: dto.encReqVc,
        },
      );
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }

    const data = this.recordValue(response.data) ?? response;
    const txId =
      this.stringValue(data.txId) ?? this.stringValue(response.txId) ?? dto.txId;

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status: OpenDidWalletFlowStatus.request_submitted,
        requestId: dto.requestId ?? transaction.requestId,
        txId,
        resultJson: this.toJsonValue(data),
        rawJson: this.toJsonValue(response),
      },
    });

    return {
      walletTransactionId: transaction.id,
      txId,
      e2e: this.recordValue(data.e2e),
      raw: response,
    };
  }

  async completeIssueVc(user: JwtUser, dto: CompleteOpenDidIssueVcDto) {
    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(
      user.sub,
      {
        flowType: 'issue',
        walletTransactionId: dto.walletTransactionId,
        txId: dto.txId,
        requestId: dto.requestId,
      },
      [
        OpenDidWalletFlowStatus.profile_requested,
        OpenDidWalletFlowStatus.request_submitted,
      ],
    );

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
        issuerBaseUrl,
        this.openDidConfigService.issueCompletePath,
        {
          id: dto.requestId,
          txId: dto.txId,
          vcId: dto.vcId,
        },
      );
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }

    const data = this.recordValue(response.data) ?? response;
    const txId =
      this.stringValue(data.txId) ?? this.stringValue(response.txId) ?? dto.txId;
    await this.completeCredentialWithOpenDidVc(transaction.credentialId, {
      vcId: dto.vcId,
      txId,
    });

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status: OpenDidWalletFlowStatus.completed,
        requestId: dto.requestId ?? transaction.requestId,
        txId,
        resultJson: this.toJsonValue(data),
        rawJson: this.toJsonValue(response),
        completedAt: new Date(),
      },
    });

    return {
      walletTransactionId: transaction.id,
      txId,
      vcId: dto.vcId,
      raw: response,
    };
  }

  async createVerifyOffer(
    user: JwtUser,
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
    const payload = this.recordValue(data.payload);
    const txId = this.stringValue(data.txId);
    const offerId = this.extractOpenDidId(data, payload);
    const transaction =
      await this.prismaService.openDidWalletTransaction.create({
        data: {
          userId: user.sub,
          credentialType: dto.credentialType as CredentialType,
          flowType: 'verify',
          status: OpenDidWalletFlowStatus.offer_created,
          requestId,
          txId,
          offerId,
          policyId,
          payloadJson: this.toJsonValue(payload),
          rawJson: this.toJsonValue(response),
          expiresAt: this.createExpiresAt(),
        },
      });

    return {
      walletTransactionId: transaction.id,
      credentialType,
      policyId,
      requestId,
      txId,
      payload,
      raw: response,
    };
  }

  async requestVerifyProfile(user: JwtUser, dto: RequestOpenDidVerifyProfileDto) {
    const verifierBaseUrl = this.requireConfig(
      this.openDidConfigService.verifierBaseUrl,
      'OPENDID_VERIFIER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(user.sub, {
      flowType: 'verify',
      walletTransactionId: dto.walletTransactionId,
      txId: dto.txId,
      requestId: dto.requestId,
      offerId: dto.offerId,
    });

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
        verifierBaseUrl,
        this.openDidConfigService.verifyProfilePath,
        {
          id: dto.requestId,
          txId: dto.txId,
          offerId: dto.offerId,
        },
      );
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }
    const data = this.recordValue(response.data) ?? response;
    const txId =
      this.stringValue(data.txId) ?? this.stringValue(response.txId) ?? dto.txId;
    const profile =
      this.recordValue(data.profile) ?? this.recordValue(response.profile);

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status: OpenDidWalletFlowStatus.profile_requested,
        requestId: dto.requestId ?? transaction.requestId,
        txId,
        offerId: dto.offerId,
        profileJson: this.toJsonValue(profile),
        rawJson: this.toJsonValue(response),
      },
    });

    return {
      walletTransactionId: transaction.id,
      txId,
      profile,
      raw: response,
    };
  }

  async requestVerifyVp(user: JwtUser, dto: RequestOpenDidVerifyVpDto) {
    const verifierBaseUrl = this.requireConfig(
      this.openDidConfigService.verifierBaseUrl,
      'OPENDID_VERIFIER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(
      user.sub,
      {
        flowType: 'verify',
        walletTransactionId: dto.walletTransactionId,
        txId: dto.txId,
        requestId: dto.requestId,
      },
      [
        OpenDidWalletFlowStatus.profile_requested,
        OpenDidWalletFlowStatus.request_submitted,
      ],
    );

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
        verifierBaseUrl,
        this.openDidConfigService.verifyPath,
        {
          id: dto.requestId,
          txId: dto.txId,
          accE2e: dto.accE2e,
          encVp: dto.encVp,
        },
      );
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }

    const data = this.recordValue(response.data) ?? response;
    const txId =
      this.stringValue(data.txId) ?? this.stringValue(response.txId) ?? dto.txId;

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status: OpenDidWalletFlowStatus.request_submitted,
        requestId: dto.requestId ?? transaction.requestId,
        txId,
        resultJson: this.toJsonValue(data),
        rawJson: this.toJsonValue(response),
      },
    });

    return {
      walletTransactionId: transaction.id,
      txId,
      raw: response,
    };
  }

  async confirmVerify(user: JwtUser, dto: ConfirmOpenDidVerifyDto) {
    const verifierBaseUrl = this.requireConfig(
      this.openDidConfigService.verifierBaseUrl,
      'OPENDID_VERIFIER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(
      user.sub,
      {
        flowType: 'verify',
        walletTransactionId: dto.walletTransactionId,
        offerId: dto.offerId,
      },
      [
        OpenDidWalletFlowStatus.profile_requested,
        OpenDidWalletFlowStatus.request_submitted,
      ],
    );
    const offerId = this.requireConfig(
      dto.offerId ?? transaction.offerId ?? undefined,
      'OPENDID_VERIFY_CONFIRM_OFFER_ID',
    );

    let response: Record<string, unknown>;
    try {
      response = await this.openDidHttpService.post<Record<string, unknown>>(
        verifierBaseUrl,
        this.openDidConfigService.verifyConfirmPath,
        { offerId },
      );
    } catch (error) {
      await this.markWalletTransactionFailed(transaction.id, error);
      throw error;
    }

    const data = this.recordValue(response.data) ?? response;
    const verified = this.booleanValue(data.result);
    if (verified === undefined) {
      await this.markWalletTransactionBadResult(
        transaction.id,
        'VERIFY_RESULT_MISSING',
      );
      throw new BadGatewayException({
        code: 'OPENDID_VERIFY_RESULT_MISSING',
        message: 'OpenDID verifier response did not include a boolean result.',
      });
    }
    const status =
      verified === false
        ? OpenDidWalletFlowStatus.failed
        : OpenDidWalletFlowStatus.completed;

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status,
        offerId,
        resultJson: this.toJsonValue(data),
        rawJson: this.toJsonValue(response),
        completedAt:
          status === OpenDidWalletFlowStatus.completed ? new Date() : undefined,
        errorCode: status === OpenDidWalletFlowStatus.failed ? 'VERIFY_FAILED' : undefined,
        errorMessage:
          status === OpenDidWalletFlowStatus.failed
            ? 'OpenDID verifier returned result=false.'
            : undefined,
      },
    });

    return {
      walletTransactionId: transaction.id,
      result: verified,
      vc: this.stringValue(data.vc),
      issuer: this.stringValue(data.issuer),
      claims: Array.isArray(data.claims) ? data.claims : undefined,
      raw: response,
    };
  }

  async getIssueResult(user: JwtUser, transactionId: string) {
    const issuerBaseUrl = this.requireConfig(
      this.openDidConfigService.issuerBaseUrl,
      'OPENDID_ISSUER_BASE_URL',
    );
    const transaction = await this.findWalletTransactionForProfile(
      user.sub,
      {
        flowType: 'issue',
        walletTransactionId: transactionId,
      },
      [
        OpenDidWalletFlowStatus.offer_created,
        OpenDidWalletFlowStatus.profile_requested,
        OpenDidWalletFlowStatus.request_submitted,
        OpenDidWalletFlowStatus.completed,
        OpenDidWalletFlowStatus.failed,
      ],
    );
    const offerId = this.requireConfig(
      transaction.offerId ?? undefined,
      'OPENDID_ISSUE_RESULT_OFFER_ID',
    );

    const response = await this.openDidHttpService.get<Record<string, unknown>>(
      issuerBaseUrl,
      this.openDidConfigService.issueResultPath,
      { offerId },
    );
    const data = this.recordValue(response.data) ?? response;
    const issued = this.booleanValue(data.result);
    if (issued === undefined) {
      await this.markWalletTransactionBadResult(
        transaction.id,
        'ISSUE_RESULT_MISSING',
      );
      throw new BadGatewayException({
        code: 'OPENDID_ISSUE_RESULT_MISSING',
        message: 'OpenDID issuer response did not include a boolean result.',
      });
    }
    const status =
      issued === false
        ? OpenDidWalletFlowStatus.failed
        : OpenDidWalletFlowStatus.completed;

    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transaction.id },
      data: {
        status,
        resultJson: this.toJsonValue(data),
        rawJson: this.toJsonValue(response),
        completedAt:
          status === OpenDidWalletFlowStatus.completed ? new Date() : undefined,
        errorCode: status === OpenDidWalletFlowStatus.failed ? 'ISSUE_FAILED' : undefined,
        errorMessage:
          status === OpenDidWalletFlowStatus.failed
            ? 'OpenDID issuer returned result=false.'
            : undefined,
      },
    });

    if (transaction.credentialId && issued !== false) {
      await this.prismaService.credential.update({
        where: { id: transaction.credentialId },
        data: {
          credentialProvider: 'opendid',
          externalStatus: 'issued',
          issuedTxId:
            this.stringValue(data.txId) ??
            this.stringValue(response.txId) ??
            transaction.txId,
        },
      });
    }

    return {
      walletTransactionId: transaction.id,
      txId:
        this.stringValue(data.txId) ??
        this.stringValue(response.txId) ??
        transaction.txId,
      offerId,
      result: issued,
      raw: response,
    };
  }

  async listTransactions(
    user: JwtUser,
    query: ListOpenDidWalletTransactionsQueryDto,
  ) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    await this.expireOpenTransactions(user.sub);

    const where: Prisma.OpenDidWalletTransactionWhereInput = {
      userId: user.sub,
      flowType: query.flowType,
      status: query.status,
    };
    const [items, total] = await Promise.all([
      this.prismaService.openDidWalletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.openDidWalletTransaction.count({ where }),
    ]);

    return {
      total,
      limit,
      offset,
      items: items.map((transaction) =>
        this.toTransactionResponse(transaction),
      ),
    };
  }

  async getTransaction(user: JwtUser, transactionId: string) {
    const transaction =
      await this.prismaService.openDidWalletTransaction.findFirst({
        where: {
          id: transactionId,
          userId: user.sub,
        },
      });

    if (!transaction) {
      throw new NotFoundException({
        code: 'OPENDID_WALLET_TRANSACTION_NOT_FOUND',
        message: 'OpenDID wallet transaction was not found.',
      });
    }

    const reusableStatuses = [
      OpenDidWalletFlowStatus.offer_created,
      OpenDidWalletFlowStatus.profile_requested,
      OpenDidWalletFlowStatus.request_submitted,
    ];
    const status =
      reusableStatuses.includes(transaction.status) &&
      transaction.expiresAt.getTime() <= Date.now()
        ? OpenDidWalletFlowStatus.expired
        : transaction.status;

    if (status !== transaction.status) {
      await this.prismaService.openDidWalletTransaction.update({
        where: { id: transaction.id },
        data: { status },
      });
    }

    return this.toTransactionResponse({ ...transaction, status });
  }

  private async findWalletTransactionForProfile(
    userId: string,
    input: {
      flowType: 'issue' | 'verify';
      walletTransactionId?: string;
      txId?: string;
      requestId?: string;
      offerId?: string;
    },
    reusableStatuses = [
      OpenDidWalletFlowStatus.offer_created,
      OpenDidWalletFlowStatus.profile_requested,
      OpenDidWalletFlowStatus.request_submitted,
    ],
  ) {
    if (
      !input.walletTransactionId &&
      !input.txId &&
      !input.offerId &&
      !input.requestId
    ) {
      throw new BadRequestException({
        code: 'OPENDID_WALLET_TRANSACTION_IDENTIFIER_REQUIRED',
        message:
          'walletTransactionId, txId, offerId, or requestId is required to find an OpenDID wallet transaction.',
      });
    }

    const baseWhere: Prisma.OpenDidWalletTransactionWhereInput = {
      userId,
      flowType: input.flowType,
      status: { in: reusableStatuses },
    };

    const transaction = input.walletTransactionId
      ? await this.prismaService.openDidWalletTransaction.findFirst({
          where: {
            ...baseWhere,
            id: input.walletTransactionId,
          },
        })
      : await this.prismaService.openDidWalletTransaction.findFirst({
          where: {
            ...baseWhere,
            OR: [
              input.txId ? { txId: input.txId } : undefined,
              input.offerId ? { offerId: input.offerId } : undefined,
              input.requestId ? { requestId: input.requestId } : undefined,
            ].filter(
              (condition): condition is Prisma.OpenDidWalletTransactionWhereInput =>
                Boolean(condition),
            ),
          },
          orderBy: { createdAt: 'desc' },
        });

    if (!transaction) {
      throw new NotFoundException({
        code: 'OPENDID_WALLET_TRANSACTION_NOT_FOUND',
        message:
          'OpenDID wallet transaction was not found. Create an offer before requesting a profile.',
      });
    }

    const expirableStatuses = [
      OpenDidWalletFlowStatus.offer_created,
      OpenDidWalletFlowStatus.profile_requested,
      OpenDidWalletFlowStatus.request_submitted,
    ];
    if (
      expirableStatuses.includes(transaction.status) &&
      transaction.expiresAt.getTime() <= Date.now()
    ) {
      await this.prismaService.openDidWalletTransaction.update({
        where: { id: transaction.id },
        data: { status: OpenDidWalletFlowStatus.expired },
      });
      throw new BadRequestException({
        code: 'OPENDID_WALLET_TRANSACTION_EXPIRED',
        message: 'OpenDID wallet transaction has expired. Create a new offer.',
      });
    }

    return transaction;
  }

  private toOpenDidCredentialType(type: CredentialType): OpenDidCredentialType {
    return type as OpenDidCredentialType;
  }

  private async markWalletTransactionFailed(
    transactionId: string,
    error: unknown,
  ) {
    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transactionId },
      data: {
        status: OpenDidWalletFlowStatus.failed,
        errorCode: this.errorCode(error),
        errorMessage: this.errorMessage(error),
      },
    });
  }

  private async markWalletTransactionBadResult(
    transactionId: string,
    errorCode: string,
  ) {
    await this.prismaService.openDidWalletTransaction.update({
      where: { id: transactionId },
      data: {
        status: OpenDidWalletFlowStatus.failed,
        errorCode,
        errorMessage: 'OpenDID server response did not include a valid result.',
      },
    });
  }

  private async expireOpenTransactions(userId: string) {
    await this.prismaService.openDidWalletTransaction.updateMany({
      where: {
        userId,
        status: {
          in: [
            OpenDidWalletFlowStatus.offer_created,
            OpenDidWalletFlowStatus.profile_requested,
            OpenDidWalletFlowStatus.request_submitted,
          ],
        },
        expiresAt: { lte: new Date() },
      },
      data: { status: OpenDidWalletFlowStatus.expired },
    });
  }

  private toTransactionResponse(transaction: {
    id: string;
    credentialId: string | null;
    festivalId: string | null;
    credentialType: CredentialType;
    flowType: OpenDidWalletFlowType;
    status: OpenDidWalletFlowStatus;
    requestId: string | null;
    txId: string | null;
    offerId: string | null;
    vcPlanId: string | null;
    policyId: string | null;
    holderDid: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    expiresAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: transaction.id,
      credentialId: transaction.credentialId,
      festivalId: transaction.festivalId,
      credentialType: transaction.credentialType,
      flowType: transaction.flowType,
      status: transaction.status,
      nextAction: this.nextAction(transaction.flowType, transaction.status),
      requestId: transaction.requestId,
      txId: transaction.txId,
      offerId: transaction.offerId,
      vcPlanId: transaction.vcPlanId,
      policyId: transaction.policyId,
      holderDid: transaction.holderDid,
      errorCode: transaction.errorCode,
      errorMessage: transaction.errorMessage,
      expiresAt: transaction.expiresAt,
      completedAt: transaction.completedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private nextAction(
    flowType: OpenDidWalletFlowType,
    status: OpenDidWalletFlowStatus,
  ): string {
    if (status === OpenDidWalletFlowStatus.offer_created) {
      return flowType === OpenDidWalletFlowType.issue
        ? 'request_issue_profile'
        : 'request_verify_profile';
    }

    if (status === OpenDidWalletFlowStatus.profile_requested) {
      return flowType === OpenDidWalletFlowType.issue
        ? 'request_issue_vc'
        : 'request_verify_vp';
    }

    if (status === OpenDidWalletFlowStatus.request_submitted) {
      return flowType === OpenDidWalletFlowType.issue
        ? 'complete_or_poll_issue_result'
        : 'confirm_verify';
    }

    return 'none';
  }

  private async completeCredentialWithOpenDidVc(
    credentialId: string | null,
    input: { vcId: string; txId?: string },
  ) {
    if (!credentialId) {
      return;
    }

    await this.prismaService.credential.update({
      where: { id: credentialId },
      data: {
        credentialProvider: 'opendid',
        externalCredentialId: input.vcId,
        externalStatus: 'issued',
        issuedTxId: input.txId,
      },
    });
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

  private booleanValue(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private createExpiresAt(): Date {
    return new Date(Date.now() + this.openDidConfigService.walletTransactionTtlMs);
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private extractOpenDidId(
    data: Record<string, unknown>,
    payload?: Record<string, unknown>,
  ): string | undefined {
    return this.firstString(
      data.offerId,
      data.offer_id,
      data.issueOfferId,
      data.verifyOfferId,
      data.id,
      payload?.offerId,
      payload?.offer_id,
      payload?.id,
    );
  }

  private firstString(...values: unknown[]): string | undefined {
    for (const value of values) {
      const parsed = this.stringValue(value);
      if (parsed) {
        return parsed;
      }
    }

    return undefined;
  }

  private errorCode(error: unknown): string | undefined {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (this.recordValue(response)) {
        return this.stringValue(this.recordValue(response)?.code);
      }
    }

    return undefined;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const responseMessage = this.recordValue(response)?.message;
      return this.stringValue(responseMessage) ?? error.message;
    }

    return error instanceof Error ? error.message : 'OpenDID wallet flow failed.';
  }
}
