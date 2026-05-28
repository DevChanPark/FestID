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
import { CreateFestivalDto } from './dto/create-festival.dto';
import { UpdateFestivalDto } from './dto/update-festival.dto';

@Injectable()
export class FestivalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async createFestival(ownerId: string, dto: CreateFestivalDto) {
    this.assertValidDateRange(dto.startDate, dto.endDate);

    const festival = await this.prisma.festival.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        schoolName: dto.schoolName,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        location: dto.location,
        operatingTime: dto.operatingTime,
        imageUrl: dto.imageUrl,
        visibility: dto.visibility ?? 'private',
        status: dto.status ?? 'draft',
      },
    });

    return { festival };
  }

  async listPublicFestivals() {
    const festivals = await this.prisma.festival.findMany({
      where: { status: 'active', visibility: 'public' },
      orderBy: { startDate: 'asc' },
    });

    return { festivals };
  }

  async listMyFestivals(ownerId: string) {
    const festivals = await this.prisma.festival.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return { festivals };
  }

  async getPublicFestival(festivalId: string) {
    const festival = await this.prisma.festival.findFirst({
      where: { id: festivalId, status: 'active', visibility: 'public' },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found or is not public.',
      });
    }

    return { festival };
  }

  async updateFestival(
    user: JwtUser,
    festivalId: string,
    dto: UpdateFestivalDto,
  ) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }

    if (
      festival.ownerId !== user.sub &&
      !(await this.adminAccessService.isSuperAdmin(user))
    ) {
      throw new ForbiddenException({
        code: 'FESTIVAL_OWNER_REQUIRED',
        message: 'Only the festival owner or super admin can update this festival.',
      });
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : festival.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : festival.endDate;
    this.assertValidDateRange(startDate.toISOString(), endDate.toISOString());

    const data: Prisma.FestivalUpdateInput = {
      name: dto.name,
      description: dto.description,
      schoolName: dto.schoolName,
      startDate,
      endDate,
      location: dto.location,
      operatingTime: dto.operatingTime,
      imageUrl: dto.imageUrl,
      visibility: dto.visibility,
      status: dto.status,
    };

    const updatedFestival = await this.prisma.festival.update({
      where: { id: festivalId },
      data,
    });

    return { festival: updatedFestival };
  }

  private assertValidDateRange(startDate: string, endDate: string) {
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      throw new BadRequestException({
        code: 'INVALID_FESTIVAL_DATE_RANGE',
        message: 'Festival startDate must be before or equal to endDate.',
      });
    }
  }
}
