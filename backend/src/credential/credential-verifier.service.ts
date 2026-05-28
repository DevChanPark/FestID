import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CredentialVerifierService {
  constructor(private readonly prisma: PrismaService) {}

  getUserCredentials(userId: string) {
    return this.prisma.credential.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async hasIssuedCredential(
    userId: string,
    type: 'entry' | 'student' | 'adult' | 'staff' | 'admin',
    festivalId?: string,
  ): Promise<boolean> {
    const credential = await this.prisma.credential.findFirst({
      where: {
        userId,
        type,
        status: 'issued',
        festivalId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return Boolean(credential);
  }
}
