import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminAccessService } from '../access/admin-access.service';
import { JwtUser } from '../common/types/jwt-user.type';
import { CredentialIssuerService } from '../credential/credential-issuer.service';
import { PrismaService } from '../database/prisma.service';
import { CreateStudentVerificationDto } from './dto/create-student-verification.dto';
import { UpdateStudentVerificationStatusDto } from './dto/update-student-verification-status.dto';

@Injectable()
export class StudentVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
    private readonly credentialIssuerService: CredentialIssuerService,
  ) {}

  async requestVerification(
    userId: string,
    festivalId: string,
    dto: CreateStudentVerificationDto,
  ) {
    await this.ensureFestivalExists(festivalId);

    const existing = await this.prisma.studentVerification.findUnique({
      where: { userId_festivalId: { userId, festivalId } },
    });

    if (existing?.status === 'approved') {
      return { verification: existing };
    }

    const verification = existing
      ? await this.prisma.studentVerification.update({
          where: { id: existing.id },
          data: {
            schoolName: dto.schoolName,
            studentId: dto.studentId,
            schoolEmail: dto.schoolEmail,
            proofFileUrl: dto.proofFileUrl,
            status: 'pending',
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
          },
        })
      : await this.prisma.studentVerification.create({
          data: {
            userId,
            festivalId,
            schoolName: dto.schoolName,
            studentId: dto.studentId,
            schoolEmail: dto.schoolEmail,
            proofFileUrl: dto.proofFileUrl,
          },
        });

    return { verification };
  }

  async getMyVerification(userId: string, festivalId: string) {
    const verification = await this.prisma.studentVerification.findUnique({
      where: { userId_festivalId: { userId, festivalId } },
    });

    return { verification };
  }

  async listFestivalVerifications(user: JwtUser, festivalId: string) {
    await this.ensureFestivalManager(user, festivalId);

    const verifications = await this.prisma.studentVerification.findMany({
      where: { festivalId },
      orderBy: { createdAt: 'desc' },
    });

    return { verifications };
  }

  async updateStatus(
    reviewer: JwtUser,
    verificationId: string,
    dto: UpdateStudentVerificationStatusDto,
  ) {
    const verification = await this.prisma.studentVerification.findUnique({
      where: { id: verificationId },
      include: { user: true, festival: true },
    });

    if (!verification) {
      throw new NotFoundException({
        code: 'STUDENT_VERIFICATION_NOT_FOUND',
        message: 'Student verification request was not found.',
      });
    }

    await this.ensureFestivalManager(reviewer, verification.festivalId);

    const updatedVerification = await this.prisma.studentVerification.update({
      where: { id: verificationId },
      data: {
        status: dto.status,
        reviewedBy: reviewer.sub,
        reviewedAt: new Date(),
        rejectionReason:
          dto.status === 'rejected' ? dto.rejectionReason ?? null : null,
      },
    });

    if (dto.status === 'approved') {
      await this.issueStudentCredentialIfNeeded({
        userId: verification.userId,
        subjectDid: this.requireDid(verification.user.did),
        festivalId: verification.festivalId,
        schoolName: verification.schoolName,
        studentId: verification.studentId,
        schoolEmail: verification.schoolEmail,
      });
    }

    return { verification: updatedVerification };
  }

  private async issueStudentCredentialIfNeeded(input: {
    userId: string;
    subjectDid: string;
    festivalId: string;
    schoolName: string;
    studentId: string;
    schoolEmail: string;
  }) {
    const existingCredential = await this.prisma.credential.findFirst({
      where: {
        userId: input.userId,
        festivalId: input.festivalId,
        type: 'student',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (existingCredential) {
      return existingCredential;
    }

    return this.credentialIssuerService.issueStudentCredential({
      userId: input.userId,
      subjectDid: input.subjectDid,
      issuerDid: `did:campass:issuer:${input.festivalId}`,
      festivalId: input.festivalId,
      claims: {
        permission: 'student',
        schoolName: input.schoolName,
        studentId: input.studentId,
        schoolEmail: input.schoolEmail,
        verified: true,
      } satisfies Prisma.InputJsonObject,
    });
  }

  private async ensureFestivalExists(festivalId: string) {
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
  }

  private async ensureFestivalManager(user: JwtUser, festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
      select: { ownerId: true },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }

    if (
      festival.ownerId === user.sub ||
      (await this.adminAccessService.isSuperAdmin(user))
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'FESTIVAL_MANAGER_REQUIRED',
      message: 'Only the festival owner or super admin can manage this resource.',
    });
  }

  private requireDid(did: string | null): string {
    if (!did) {
      throw new BadRequestException({
        code: 'USER_DID_REQUIRED',
        message: 'User DID is required before issuing a credential.',
      });
    }
    return did;
  }
}
