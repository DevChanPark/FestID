import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CredentialIssuerService } from '../credential/credential-issuer.service';
import { PrismaService } from '../database/prisma.service';
import { CreateAdminProfileDto } from './dto/create-admin-profile.dto';
import { ListAdminProfilesQueryDto } from './dto/list-admin-profiles-query.dto';
import { UpdateAdminProofStatusDto } from './dto/update-admin-proof-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialIssuerService: CredentialIssuerService,
  ) {}

  async upsertMyProfile(userId: string, dto: CreateAdminProfileDto) {
    const existingProfile = await this.prisma.adminProfile.findUnique({
      where: { userId },
    });

    if (existingProfile?.proofStatus === 'approved') {
      throw new BadRequestException({
        code: 'ADMIN_PROFILE_ALREADY_APPROVED',
        message: 'Approved admin profile cannot be modified through this API.',
      });
    }

    const profile = existingProfile
      ? await this.prisma.adminProfile.update({
          where: { id: existingProfile.id },
          data: {
            schoolName: dto.schoolName,
            organizationName: dto.organizationName,
            department: dto.department,
            position: dto.position,
            role: dto.role,
            proofFileUrl: dto.proofFileUrl,
            proofStatus: 'pending',
          },
        })
      : await this.prisma.adminProfile.create({
          data: {
            userId,
            schoolName: dto.schoolName,
            organizationName: dto.organizationName,
            department: dto.department,
            position: dto.position,
            role: dto.role,
            proofFileUrl: dto.proofFileUrl,
          },
        });

    return { profile };
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId },
    });

    return { profile };
  }

  async listProfiles(query: ListAdminProfilesQueryDto) {
    const where: Prisma.AdminProfileWhereInput = {
      proofStatus: query.proofStatus,
    };

    const [profiles, total] = await Promise.all([
      this.prisma.adminProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              did: true,
              name: true,
              provider: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.adminProfile.count({ where }),
    ]);

    return {
      profiles,
      pagination: {
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    };
  }

  async updateProofStatus(profileId: string, dto: UpdateAdminProofStatusDto) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'ADMIN_PROFILE_NOT_FOUND',
        message: 'Admin profile was not found.',
      });
    }

    const updatedProfile = await this.prisma.adminProfile.update({
      where: { id: profileId },
      data: { proofStatus: dto.proofStatus },
    });

    if (dto.proofStatus === 'approved') {
      await this.issueAdminCredentialIfNeeded({
        userId: profile.userId,
        subjectDid: this.requireDid(profile.user.did),
        schoolName: profile.schoolName,
        organizationName: profile.organizationName,
        adminRole: dto.adminRole ?? 'festival_admin',
      });
    }

    return { profile: updatedProfile };
  }

  private async issueAdminCredentialIfNeeded(input: {
    userId: string;
    subjectDid: string;
    schoolName: string;
    organizationName: string;
    adminRole: 'festival_admin' | 'super_admin';
  }) {
    const existingCredential = await this.prisma.credential.findFirst({
      where: {
        userId: input.userId,
        type: 'admin',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (existingCredential) {
      return existingCredential;
    }

    return this.credentialIssuerService.issueAdminCredential({
      userId: input.userId,
      subjectDid: input.subjectDid,
      issuerDid: 'did:campass:issuer:admin',
      claims: {
        permission: 'admin',
        role: input.adminRole,
        schoolName: input.schoolName,
        organizationName: input.organizationName,
        verified: true,
      } satisfies Prisma.InputJsonObject,
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
