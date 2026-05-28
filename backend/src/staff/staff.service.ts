import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AdminAccessService } from '../access/admin-access.service';
import { JwtUser } from '../common/types/jwt-user.type';
import { CredentialIssuerService } from '../credential/credential-issuer.service';
import { PrismaService } from '../database/prisma.service';
import { DidService } from '../did/did.service';
import {
  CreateStaffInviteDto,
  STAFF_SCOPES,
  StaffScope,
} from './dto/create-staff-invite.dto';
import { RejectStaffRequestDto } from './dto/reject-staff-request.dto';

type StaffCredentialClaims = {
  role?: string;
  scope?: unknown;
  canScanQr?: unknown;
};

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
    private readonly credentialIssuerService: CredentialIssuerService,
    private readonly didService: DidService,
  ) {}

  async createInvite(
    user: JwtUser,
    festivalId: string,
    dto: CreateStaffInviteDto,
  ) {
    await this.ensureFestivalManager(user, festivalId);

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_INVITE_EXPIRATION',
        message: 'Staff invite expiresAt must be in the future.',
      });
    }

    const invite = await this.prisma.staffInvite.create({
      data: {
        festivalId,
        createdBy: user.sub,
        inviteCode: await this.createUniqueInviteCode(),
        role: dto.role,
        scopeJson: dto.scope,
        expiresAt,
      },
    });

    return { invite };
  }

  async listInvites(user: JwtUser, festivalId: string) {
    await this.ensureFestivalManager(user, festivalId);

    const invites = await this.prisma.staffInvite.findMany({
      where: { festivalId },
      orderBy: { createdAt: 'desc' },
    });

    return { invites };
  }

  async revokeInvite(user: JwtUser, inviteCode: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { inviteCode },
    });

    if (!invite) {
      throw new NotFoundException({
        code: 'STAFF_INVITE_NOT_FOUND',
        message: 'Staff invite was not found.',
      });
    }

    await this.ensureFestivalManager(user, invite.festivalId);

    const revokedInvite = await this.prisma.staffInvite.update({
      where: { id: invite.id },
      data: { status: 'revoked' },
    });

    return { invite: revokedInvite };
  }

  async requestStaffRole(user: JwtUser, inviteCode: string) {
    const appUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    if (!appUser?.did) {
      throw new BadRequestException({
        code: 'USER_DID_REQUIRED',
        message: 'User DID is required before requesting staff role.',
      });
    }

    const invite = await this.prisma.staffInvite.findUnique({
      where: { inviteCode },
    });

    if (!invite || invite.status !== 'active') {
      throw new NotFoundException({
        code: 'STAFF_INVITE_NOT_FOUND',
        message: 'Active staff invite was not found.',
      });
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      await this.prisma.staffInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException({
        code: 'STAFF_INVITE_EXPIRED',
        message: 'Staff invite has expired.',
      });
    }

    const existingRequest = await this.prisma.staffRequest.findUnique({
      where: {
        userId_festivalId: {
          userId: user.sub,
          festivalId: invite.festivalId,
        },
      },
    });

    const request = existingRequest
      ? await this.prisma.staffRequest.update({
          where: { id: existingRequest.id },
          data: {
            inviteId: invite.id,
            requestedRole: invite.role,
            maskedDid: this.didService.maskDid(appUser.did),
            status: 'requested',
            approvedAt: null,
          },
        })
      : await this.prisma.staffRequest.create({
          data: {
            inviteId: invite.id,
            festivalId: invite.festivalId,
            userId: user.sub,
            requestedRole: invite.role,
            maskedDid: this.didService.maskDid(appUser.did),
          },
        });

    return { request };
  }

  async listRequests(user: JwtUser, festivalId: string) {
    await this.ensureFestivalManager(user, festivalId);

    const requests = await this.prisma.staffRequest.findMany({
      where: { festivalId },
      include: {
        invite: true,
        user: {
          select: {
            id: true,
            did: true,
            name: true,
            provider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      requests: requests.map((request) => ({
        ...request,
        user: {
          ...request.user,
          did: request.user.did ? this.didService.maskDid(request.user.did) : null,
        },
      })),
    };
  }

  async approveRequest(user: JwtUser, requestId: string) {
    const request = await this.findRequestOrThrow(requestId);
    await this.ensureFestivalManager(user, request.festivalId);

    const scope = this.parseScope(request.invite.scopeJson);
    const credential = await this.issueStaffCredentialIfNeeded({
      userId: request.userId,
      subjectDid: this.requireDid(request.user.did),
      festivalId: request.festivalId,
      role: request.requestedRole,
      scope,
    });

    const updatedRequest = await this.prisma.staffRequest.update({
      where: { id: requestId },
      data: { status: 'approved', approvedAt: new Date() },
    });

    return { request: updatedRequest, credential };
  }

  async rejectRequest(
    user: JwtUser,
    requestId: string,
    _dto: RejectStaffRequestDto,
  ) {
    const request = await this.findRequestOrThrow(requestId);
    await this.ensureFestivalManager(user, request.festivalId);

    const updatedRequest = await this.prisma.staffRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', approvedAt: null },
    });

    return { request: updatedRequest };
  }

  async getMyStaffMode(userId: string, festivalId: string) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        userId,
        festivalId,
        type: 'staff',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { issuedAt: 'desc' },
    });

    if (!credential) {
      return {
        staffMode: false,
        role: null,
        scope: [],
        message: '스태프 권한이 없습니다.',
      };
    }

    const claims = credential.claimsJson as Prisma.JsonObject;
    const parsedClaims = claims as StaffCredentialClaims;
    const scope = Array.isArray(parsedClaims.scope)
      ? parsedClaims.scope.filter(this.isStaffScope)
      : [];

    return {
      staffMode: parsedClaims.canScanQr === true,
      role: typeof parsedClaims.role === 'string' ? parsedClaims.role : null,
      scope,
      message: '스태프 권한이 활성화되었습니다.',
    };
  }

  private async issueStaffCredentialIfNeeded(input: {
    userId: string;
    subjectDid: string;
    festivalId: string;
    role: string;
    scope: StaffScope[];
  }) {
    const existingCredential = await this.prisma.credential.findFirst({
      where: {
        userId: input.userId,
        festivalId: input.festivalId,
        type: 'staff',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (existingCredential) {
      return existingCredential;
    }

    return this.credentialIssuerService.issueStaffCredential({
      userId: input.userId,
      subjectDid: input.subjectDid,
      issuerDid: `did:campass:issuer:${input.festivalId}`,
      festivalId: input.festivalId,
      claims: {
        role: input.role,
        scope: input.scope,
        canScanQr: true,
      } satisfies Prisma.InputJsonObject,
    });
  }

  private async ensureFestivalManager(user: JwtUser, festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
      select: { id: true },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }

    if (await this.adminAccessService.canManageFestival(user, festivalId)) {
      return;
    }

    throw new ForbiddenException({
      code: 'FESTIVAL_MANAGER_REQUIRED',
      message: 'Only the festival owner or super admin can manage staff.',
    });
  }

  private async findRequestOrThrow(requestId: string) {
    const request = await this.prisma.staffRequest.findUnique({
      where: { id: requestId },
      include: { invite: true, user: true },
    });

    if (!request) {
      throw new NotFoundException({
        code: 'STAFF_REQUEST_NOT_FOUND',
        message: 'Staff request was not found.',
      });
    }

    return request;
  }

  private parseScope(scopeJson: Prisma.JsonValue): StaffScope[] {
    if (!Array.isArray(scopeJson)) {
      throw new BadRequestException({
        code: 'INVALID_STAFF_SCOPE',
        message: 'Staff invite scope must be an array.',
      });
    }

    const scope = scopeJson.filter(this.isStaffScope);
    if (scope.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_STAFF_SCOPE',
        message: 'Staff invite scope must include at least one valid scope.',
      });
    }

    return scope;
  }

  private isStaffScope(value: unknown): value is StaffScope {
    return typeof value === 'string' && STAFF_SCOPES.includes(value as StaffScope);
  }

  private async createUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const inviteCode = randomBytes(6).toString('base64url').toUpperCase();
      const existingInvite = await this.prisma.staffInvite.findUnique({
        where: { inviteCode },
        select: { id: true },
      });

      if (!existingInvite) {
        return inviteCode;
      }
    }

    throw new BadRequestException({
      code: 'INVITE_CODE_GENERATION_FAILED',
      message: 'Failed to generate a unique staff invite code.',
    });
  }

  private requireDid(did: string | null): string {
    if (!did) {
      throw new BadRequestException({
        code: 'USER_DID_REQUIRED',
        message: 'User DID is required before issuing staff credential.',
      });
    }

    return did;
  }
}
