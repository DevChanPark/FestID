import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminAccessService } from '../access/admin-access.service';
import { JwtUser } from '../common/types/jwt-user.type';
import { PrismaService } from '../database/prisma.service';
import { ListFestivalCredentialsQueryDto } from './dto/list-festival-credentials-query.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';

@Injectable()
export class CredentialAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async listFestivalCredentials(
    user: JwtUser,
    festivalId: string,
    query: ListFestivalCredentialsQueryDto,
  ) {
    await this.ensureFestivalManager(user, festivalId);

    const where: Prisma.CredentialWhereInput = {
      festivalId,
      type: query.type,
      status: query.status,
      userId: query.userId,
    };

    const [credentials, total] = await Promise.all([
      this.prisma.credential.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.credential.count({ where }),
    ]);

    return {
      credentials,
      pagination: {
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    };
  }

  async revokeCredential(
    user: JwtUser,
    credentialId: string,
    dto: RevokeCredentialDto,
  ) {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException({
        code: 'CREDENTIAL_NOT_FOUND',
        message: 'Credential was not found.',
      });
    }

    if (credential.status === 'revoked') {
      return { credential };
    }

    await this.ensureCredentialManager(user, credential);

    const claimsJson =
      credential.claimsJson && typeof credential.claimsJson === 'object'
        ? (credential.claimsJson as Prisma.JsonObject)
        : {};

    const updatedCredential = await this.prisma.credential.update({
      where: { id: credentialId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        claimsJson: {
          ...claimsJson,
          revokedReason: dto.reason,
        },
      },
    });

    return { credential: updatedCredential };
  }

  private async ensureCredentialManager(user: JwtUser, credential: {
    festivalId: string | null;
    type: string;
    userId: string;
  }) {
    if (credential.festivalId) {
      await this.ensureFestivalManager(user, credential.festivalId);
      return;
    }

    if (
      credential.type === 'admin' &&
      (await this.adminAccessService.isSuperAdmin(user))
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'CREDENTIAL_MANAGER_REQUIRED',
      message: 'Only the festival owner or super admin can revoke this credential.',
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
      message: 'Only the festival owner or super admin can manage credentials.',
    });
  }
}
