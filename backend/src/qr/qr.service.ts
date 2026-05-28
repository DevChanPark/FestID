import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';

type QrPurpose = 'entry' | 'benefit' | 'event' | 'adult_check' | 'student_check';
type RequiredCredential = 'entry' | 'adult' | 'student';

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  async createQrToken(
    userId: string,
    festivalId: string,
    dto: CreateQrTokenDto,
  ) {
    const purpose = dto.purpose ?? 'entry';
    const expiresInSeconds = dto.expiresInSeconds ?? 300;

    await this.ensureActiveFestival(festivalId);
    await this.ensureRequiredCredential(userId, festivalId, purpose);

    const token = this.createToken();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await this.prisma.qrToken.create({
      data: {
        userId,
        festivalId,
        token,
        purpose,
        expiresAt,
      },
    });

    return {
      qrPayload: `campass://qr?token=${encodeURIComponent(token)}`,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async ensureActiveFestival(festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
      select: { status: true },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }

    if (festival.status !== 'active') {
      throw new BadRequestException({
        code: 'FESTIVAL_NOT_ACTIVE',
        message: 'QR tokens can only be issued for active festivals.',
      });
    }
  }

  private async ensureRequiredCredential(
    userId: string,
    festivalId: string,
    purpose: QrPurpose,
  ) {
    const requiredCredential = this.requiredCredentialForPurpose(purpose);
    const credential = await this.prisma.credential.findFirst({
      where: {
        userId,
        festivalId,
        type: requiredCredential,
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!credential) {
      throw new ForbiddenException({
        code: 'MISSING_CREDENTIAL',
        message: `${requiredCredential} credential is required to create this QR token.`,
      });
    }
  }

  private requiredCredentialForPurpose(purpose: QrPurpose): RequiredCredential {
    switch (purpose) {
      case 'adult_check':
        return 'adult';
      case 'student_check':
        return 'student';
      case 'entry':
      case 'benefit':
      case 'event':
        return 'entry';
    }
  }

  private createToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
