import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CredentialIssuerService } from '../credential/credential-issuer.service';
import { PrismaService } from '../database/prisma.service';
import { IssuePassDto } from './dto/issue-pass.dto';

type PassType = 'entry' | 'adult' | 'student';
type PassIssueStatus = 'issued' | 'pending' | 'not_requested' | 'denied';

@Injectable()
export class PassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialIssuerService: CredentialIssuerService,
  ) {}

  async issuePass(userId: string, festivalId: string, dto: IssuePassDto) {
    const user = await this.findUserOrThrow(userId);
    const festival = await this.findActiveFestivalOrThrow(festivalId);
    const requestedTypes = new Set<PassType>(dto.requestedTypes);
    const statuses: Record<PassType, { status: PassIssueStatus; reason?: string }> =
      {
        entry: { status: 'not_requested' },
        adult: { status: 'not_requested' },
        student: { status: 'not_requested' },
    };

    if (requestedTypes.has('entry')) {
      const templateAvailability = await this.getTemplateAvailability(
        festival.id,
        'entry',
      );
      if (!templateAvailability.available) {
        statuses.entry = {
          status: 'denied',
          reason: templateAvailability.reason,
        };
      } else {
        await this.issueEntryIfNeeded(user.id, this.requireDid(user.did), festival.id);
        statuses.entry = { status: 'issued' };
      }
    }

    if (requestedTypes.has('adult')) {
      const templateAvailability = await this.getTemplateAvailability(
        festival.id,
        'adult',
      );
      if (!templateAvailability.available) {
        statuses.adult = {
          status: 'denied',
          reason: templateAvailability.reason,
        };
      } else if (user.isAdult === true) {
        await this.issueAdultIfNeeded(user.id, this.requireDid(user.did), festival.id);
        statuses.adult = { status: 'issued' };
      } else {
        statuses.adult = {
          status: 'denied',
          reason: 'Mobile ID authentication result does not include isAdult=true.',
        };
      }
    }

    if (requestedTypes.has('student')) {
      const templateAvailability = await this.getTemplateAvailability(
        festival.id,
        'student',
      );
      if (!templateAvailability.available) {
        statuses.student = {
          status: 'denied',
          reason: templateAvailability.reason,
        };
      } else {
        const studentStatus = await this.handleStudentPassRequest(
          user.id,
          this.requireDid(user.did),
          festival.id,
          dto,
        );
        statuses.student = studentStatus;
      }
    }

    const pass = await this.getMyPass(user.id, festival.id);
    return { ...pass, statuses };
  }

  async getMyPass(userId: string, festivalId: string) {
    await this.findFestivalOrThrow(festivalId);

    const [credentials, studentVerification] = await Promise.all([
      this.prisma.credential.findMany({
        where: {
          userId,
          festivalId,
          type: { in: ['entry', 'adult', 'student'] },
          status: 'issued',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.studentVerification.findUnique({
        where: { userId_festivalId: { userId, festivalId } },
      }),
    ]);

    return {
      pass: {
        festivalId,
        credentials,
        credentialState: {
          entry: credentials.some((credential) => credential.type === 'entry'),
          adult: credentials.some((credential) => credential.type === 'adult'),
          student: credentials.some((credential) => credential.type === 'student'),
        },
        studentVerification,
      },
    };
  }

  private async handleStudentPassRequest(
    userId: string,
    subjectDid: string,
    festivalId: string,
    dto: IssuePassDto,
  ): Promise<{ status: PassIssueStatus; reason?: string }> {
    const existingVerification = await this.prisma.studentVerification.findUnique({
      where: { userId_festivalId: { userId, festivalId } },
    });

    if (existingVerification?.status === 'approved') {
      await this.issueStudentIfNeeded({
        userId,
        subjectDid,
        festivalId,
        schoolName: existingVerification.schoolName,
        studentId: existingVerification.studentId,
        schoolEmail: existingVerification.schoolEmail,
      });
      return { status: 'issued' };
    }

    if (!dto.studentProof) {
      return {
        status: existingVerification?.status === 'pending' ? 'pending' : 'denied',
        reason: 'Student proof is required before Student VC can be requested.',
      };
    }

    if (existingVerification) {
      await this.prisma.studentVerification.update({
        where: { id: existingVerification.id },
        data: {
          schoolName: dto.studentProof.schoolName,
          studentId: dto.studentProof.studentId,
          schoolEmail: dto.studentProof.schoolEmail,
          proofFileUrl: dto.studentProof.proofFileUrl,
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null,
        },
      });
    } else {
      await this.prisma.studentVerification.create({
        data: {
          userId,
          festivalId,
          schoolName: dto.studentProof.schoolName,
          studentId: dto.studentProof.studentId,
          schoolEmail: dto.studentProof.schoolEmail,
          proofFileUrl: dto.studentProof.proofFileUrl,
        },
      });
    }

    return { status: 'pending' };
  }

  private async issueEntryIfNeeded(
    userId: string,
    subjectDid: string,
    festivalId: string,
  ) {
    const existingCredential = await this.findIssuedCredential(
      userId,
      festivalId,
      'entry',
    );

    if (existingCredential) {
      return existingCredential;
    }

    return this.credentialIssuerService.issueEntryCredential({
      userId,
      subjectDid,
      issuerDid: `did:campass:issuer:${festivalId}`,
      festivalId,
      claims: {
        permission: 'entry',
        verified: true,
      } satisfies Prisma.InputJsonObject,
    });
  }

  private async issueAdultIfNeeded(
    userId: string,
    subjectDid: string,
    festivalId: string,
  ) {
    const existingCredential = await this.findIssuedCredential(
      userId,
      festivalId,
      'adult',
    );

    if (existingCredential) {
      return existingCredential;
    }

    return this.credentialIssuerService.issueAdultCredential({
      userId,
      subjectDid,
      issuerDid: `did:campass:issuer:${festivalId}`,
      festivalId,
      claims: {
        permission: 'adult',
        isAdult: true,
        verified: true,
      } satisfies Prisma.InputJsonObject,
    });
  }

  private async issueStudentIfNeeded(input: {
    userId: string;
    subjectDid: string;
    festivalId: string;
    schoolName: string;
    studentId: string;
    schoolEmail: string;
  }) {
    const existingCredential = await this.findIssuedCredential(
      input.userId,
      input.festivalId,
      'student',
    );

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

  private findIssuedCredential(
    userId: string,
    festivalId: string,
    type: 'entry' | 'adult' | 'student',
  ) {
    return this.prisma.credential.findFirst({
      where: {
        userId,
        festivalId,
        type,
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  private async getTemplateAvailability(festivalId: string, type: PassType) {
    const template = await this.prisma.passTemplate.findUnique({
      where: {
        festivalId_type: {
          festivalId,
          type,
        },
      },
    });

    if (!template) {
      return { available: true };
    }

    if (!template.enabled) {
      return {
        available: false,
        reason: `${type} pass template is disabled.`,
      };
    }

    if (template.expiresAt && template.expiresAt.getTime() <= Date.now()) {
      return {
        available: false,
        reason: `${type} pass template is expired.`,
      };
    }

    return { available: true };
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User was not found.',
      });
    }
    return user;
  }

  private async findFestivalOrThrow(festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
    });
    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }
    return festival;
  }

  private async findActiveFestivalOrThrow(festivalId: string) {
    const festival = await this.findFestivalOrThrow(festivalId);
    if (festival.status !== 'active') {
      throw new BadRequestException({
        code: 'FESTIVAL_NOT_ACTIVE',
        message: 'Passes can only be issued for active festivals.',
      });
    }
    return festival;
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
