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
import { CreatePassTemplateDto } from './dto/create-pass-template.dto';
import { UpdatePassTemplateDto } from './dto/update-pass-template.dto';

@Injectable()
export class PassTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async createTemplate(
    user: JwtUser,
    festivalId: string,
    dto: CreatePassTemplateDto,
  ) {
    await this.ensureFestivalManager(user, festivalId);
    this.assertFutureExpiry(dto.expiresAt);

    const template = await this.prisma.passTemplate.upsert({
      where: {
        festivalId_type: {
          festivalId,
          type: dto.type,
        },
      },
      create: {
        festivalId,
        type: dto.type,
        name: dto.name,
        enabled: dto.enabled ?? true,
        verificationRule: this.toJsonObject(dto.verificationRule),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      update: {
        name: dto.name,
        enabled: dto.enabled ?? true,
        verificationRule: this.toJsonObject(dto.verificationRule),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return { template };
  }

  async listTemplates(user: JwtUser, festivalId: string) {
    await this.ensureFestivalManager(user, festivalId);

    const templates = await this.prisma.passTemplate.findMany({
      where: { festivalId },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });

    return { templates };
  }

  async updateTemplate(
    user: JwtUser,
    templateId: string,
    dto: UpdatePassTemplateDto,
  ) {
    const template = await this.prisma.passTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException({
        code: 'PASS_TEMPLATE_NOT_FOUND',
        message: 'Pass template was not found.',
      });
    }

    await this.ensureFestivalManager(user, template.festivalId);
    this.assertFutureExpiry(dto.expiresAt);

    const updatedTemplate = await this.prisma.passTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name,
        enabled: dto.enabled,
        verificationRule:
          dto.verificationRule === undefined
            ? undefined
            : this.toJsonObject(dto.verificationRule),
        expiresAt:
          dto.expiresAt === undefined ? undefined : new Date(dto.expiresAt),
      },
    });

    return { template: updatedTemplate };
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
      message: 'Only the festival owner or super admin can manage pass templates.',
    });
  }

  private assertFutureExpiry(expiresAt?: string) {
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_PASS_TEMPLATE_EXPIRATION',
        message: 'Pass template expiresAt must be in the future.',
      });
    }
  }

  private toJsonObject(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonObject | undefined {
    return value as Prisma.InputJsonObject | undefined;
  }
}
