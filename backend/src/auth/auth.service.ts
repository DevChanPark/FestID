import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthRequestStatusQueryDto } from './dto/auth-request-status-query.dto';
import { StartMobileIdAuthDto } from './dto/start-mobile-id-auth.dto';
import { VerifyMobileIdAuthDto } from './dto/verify-mobile-id-auth.dto';
import {
  AuthResult,
  MobileIdProviderState,
} from './providers/mobile-id-auth-provider.interface';
import { MobileIdProviderConfigService } from './providers/mobile-id-provider-config.service';
import { MobileIdProviderFactory } from './providers/mobile-id-provider.factory';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly providerConfigService: MobileIdProviderConfigService,
    private readonly providerFactory: MobileIdProviderFactory,
  ) {}

  async startMobileIdAuth(dto: StartMobileIdAuthDto) {
    const authRequestId = randomUUID();
    const nonce = this.createSecureToken();
    const state = this.createSecureToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.authRequest.create({
      data: {
        id: authRequestId,
        provider: dto.provider,
        clientType: dto.clientType,
        nonce,
        state,
        expiresAt,
      },
    });

    try {
      const provider = this.providerFactory.getProvider(dto.provider);
      const startOutput = await provider.startAuth({
        authRequestId,
        provider: dto.provider,
        clientType: dto.clientType,
        redirectUri: dto.redirectUri,
        nonce,
        state,
        expiresAt: expiresAt.toISOString(),
        options: {
          authFlow: dto.authFlow,
          oacxProvider: dto.oacxProvider,
          requestType: dto.requestType,
          zkpType: dto.zkpType,
          useConvertor: dto.useConvertor,
        },
      });

      if (startOutput.providerState) {
        await this.prisma.authRequest.update({
          where: { id: authRequestId },
          data: this.toProviderStateUpdateData(startOutput.providerState),
        });
      }

      const { providerState: _providerState, ...publicOutput } = startOutput;
      return publicOutput;
    } catch (error) {
      await this.prisma.authRequest.update({
        where: { id: authRequestId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async verifyMobileIdAuth(dto: VerifyMobileIdAuthDto) {
    const authRequest = await this.prisma.authRequest.findUnique({
      where: { id: dto.authRequestId },
    });

    if (!authRequest || authRequest.provider !== dto.provider) {
      throw new UnauthorizedException({
        code: 'INVALID_AUTH_REQUEST',
        message: 'Authentication request does not exist.',
      });
    }

    if (authRequest.status !== 'pending') {
      throw new UnauthorizedException({
        code: 'AUTH_REQUEST_NOT_PENDING',
        message: 'Authentication request is no longer pending.',
      });
    }

    if (authRequest.expiresAt.getTime() < Date.now()) {
      await this.prisma.authRequest.update({
        where: { id: authRequest.id },
        data: { status: 'expired' },
      });
      throw new UnauthorizedException({
        code: 'AUTH_REQUEST_EXPIRED',
        message: 'Authentication request has expired.',
      });
    }

    if (dto.state && dto.state !== authRequest.state) {
      throw new UnauthorizedException({
        code: 'INVALID_AUTH_STATE',
        message: 'Authentication state does not match.',
      });
    }

    const provider = this.providerFactory.getProvider(dto.provider);
    const authResult = await provider.verify({
      provider: dto.provider,
      authRequestId: authRequest.id,
      nonce: authRequest.nonce,
      state: authRequest.state,
      result: dto.result,
      providerState: {
        oacxToken: authRequest.oacxToken ?? undefined,
        oacxTxId: authRequest.oacxTxId ?? undefined,
        oacxCxId: authRequest.oacxCxId ?? undefined,
        oacxProvider: authRequest.oacxProvider ?? undefined,
        oacxRequestType: authRequest.oacxRequestType ?? undefined,
        oacxAuthFlow: authRequest.oacxAuthFlow ?? undefined,
        oacxUseConvertor: authRequest.oacxUseConvertor ?? undefined,
        oacxStatus: authRequest.oacxStatus ?? undefined,
        oacxResultCode: authRequest.oacxResultCode ?? undefined,
      },
    });

    this.assertValidAuthResult(authResult);

    const user = await this.usersService.findOrCreateFromAuthResult(authResult);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      did: user.did,
      provider: user.provider,
    });

    await this.prisma.authRequest.update({
      where: { id: authRequest.id },
      data: { status: 'verified', verifiedAt: new Date() },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        did: user.did,
        name: user.name,
        isAdult: user.isAdult,
      },
    };
  }

  listMobileIdProviders() {
    return this.providerConfigService.listProviderStatuses();
  }

  async getAuthRequestStatus(
    authRequestId: string,
    query: AuthRequestStatusQueryDto,
  ) {
    const authRequest = await this.prisma.authRequest.findUnique({
      where: { id: authRequestId },
    });

    if (!authRequest) {
      throw new UnauthorizedException({
        code: 'INVALID_AUTH_REQUEST',
        message: 'Authentication request does not exist.',
      });
    }

    if (query.provider && query.provider !== authRequest.provider) {
      throw new UnauthorizedException({
        code: 'INVALID_AUTH_REQUEST_PROVIDER',
        message: 'Authentication request provider does not match.',
      });
    }

    if (query.status && query.status !== authRequest.status) {
      throw new UnauthorizedException({
        code: 'INVALID_AUTH_REQUEST_STATUS',
        message: 'Authentication request status does not match.',
      });
    }

    if (
      authRequest.status === 'pending' &&
      authRequest.expiresAt.getTime() < Date.now()
    ) {
      const expiredAuthRequest = await this.prisma.authRequest.update({
        where: { id: authRequest.id },
        data: { status: 'expired' },
      });
      return { authRequest: this.toAuthRequestResponse(expiredAuthRequest) };
    }

    return { authRequest: this.toAuthRequestResponse(authRequest) };
  }

  async expireStaleAuthRequests() {
    const result = await this.prisma.authRequest.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    return {
      expiredCount: result.count,
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'Authenticated user no longer exists.',
      });
    }

    return { user };
  }

  private assertValidAuthResult(authResult: AuthResult) {
    if (!authResult.providerUserId || !authResult.provider) {
      throw new BadRequestException({
        code: 'INVALID_AUTH_RESULT',
        message: 'Provider verification did not return a normalized AuthResult.',
      });
    }
  }

  private createSecureToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private toProviderStateUpdateData(providerState: MobileIdProviderState) {
    return {
      oacxToken: providerState.oacxToken,
      oacxTxId: providerState.oacxTxId,
      oacxCxId: providerState.oacxCxId,
      oacxProvider: providerState.oacxProvider,
      oacxRequestType: providerState.oacxRequestType,
      oacxAuthFlow: providerState.oacxAuthFlow,
      oacxUseConvertor: providerState.oacxUseConvertor,
      oacxStatus: providerState.oacxStatus,
      oacxResultCode: providerState.oacxResultCode,
    };
  }

  private toAuthRequestResponse(authRequest: {
    id: string;
    provider: string;
    clientType: string;
    status: string;
    expiresAt: Date;
    verifiedAt: Date | null;
    createdAt: Date;
    oacxTxId?: string | null;
    oacxCxId?: string | null;
    oacxProvider?: string | null;
    oacxRequestType?: string | null;
    oacxAuthFlow?: string | null;
    oacxUseConvertor?: boolean | null;
    oacxStatus?: string | null;
    oacxResultCode?: string | null;
  }) {
    return {
      id: authRequest.id,
      provider: authRequest.provider,
      clientType: authRequest.clientType,
      status: authRequest.status,
      expiresAt: authRequest.expiresAt,
      verifiedAt: authRequest.verifiedAt,
      createdAt: authRequest.createdAt,
      oacxTxId: authRequest.oacxTxId,
      oacxCxId: authRequest.oacxCxId,
      oacxProvider: authRequest.oacxProvider,
      oacxRequestType: authRequest.oacxRequestType,
      oacxAuthFlow: authRequest.oacxAuthFlow,
      oacxUseConvertor: authRequest.oacxUseConvertor,
      oacxStatus: authRequest.oacxStatus,
      oacxResultCode: authRequest.oacxResultCode,
    };
  }
}
