import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DidService } from '../did/did.service';
import { AuthResult } from '../auth/providers/mobile-id-auth-provider.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly didService: DidService,
  ) {}

  async findOrCreateFromAuthResult(authResult: AuthResult) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        provider_providerUserId: {
          provider: authResult.provider,
          providerUserId: authResult.providerUserId,
        },
      },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: authResult.name,
          phone: authResult.phone,
          birthDate: authResult.birthDate,
          isAdult: authResult.isAdult,
          did: existingUser.did ?? this.didService.createUserDid(),
          didMethod: existingUser.didMethod,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        provider: authResult.provider,
        providerUserId: authResult.providerUserId,
        name: authResult.name,
        phone: authResult.phone,
        birthDate: authResult.birthDate,
        isAdult: authResult.isAdult,
        did: this.didService.createUserDid(),
        didMethod: 'campass',
      },
    });
  }

  findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        provider: true,
        name: true,
        phone: true,
        birthDate: true,
        isAdult: true,
        did: true,
        didMethod: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
