import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { JwtUser } from '../common/types/jwt-user.type';
import { PrismaService } from '../database/prisma.service';

type AdminCredentialClaims = {
  role?: string;
  permission?: string;
};

@Injectable()
export class AdminAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async isSeedAdmin(user: JwtUser): Promise<boolean> {
    const seedUserIds = this.readCsvConfig('SEED_ADMIN_USER_IDS');
    const seedDids = this.readCsvConfig('SEED_ADMIN_DIDS');
    return seedUserIds.has(user.sub) || seedDids.has(user.did);
  }

  async hasAdminCredential(userId: string): Promise<boolean> {
    const credential = await this.prisma.credential.findFirst({
      where: {
        userId,
        type: 'admin',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return Boolean(credential);
  }

  async isSuperAdmin(user: JwtUser): Promise<boolean> {
    if (await this.isSeedAdmin(user)) {
      return true;
    }

    const credentials = await this.prisma.credential.findMany({
      where: {
        userId: user.sub,
        type: 'admin',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return credentials.some((credential) => {
      const claims = credential.claimsJson as Prisma.JsonObject;
      return (claims as AdminCredentialClaims).role === 'super_admin';
    });
  }

  async canManageFestival(user: JwtUser, festivalId: string): Promise<boolean> {
    if (await this.isSuperAdmin(user)) {
      return true;
    }

    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
      select: { ownerId: true },
    });

    return festival?.ownerId === user.sub;
  }

  private readCsvConfig(key: string): Set<string> {
    const value = this.configService.get<string>(key) ?? '';
    return new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }
}
