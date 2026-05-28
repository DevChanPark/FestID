import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { AdminAccessService } from '../access/admin-access.service';
import { JwtUser } from '../common/types/jwt-user.type';
import { UploadedFile } from '../common/types/uploaded-file.type';
import { PrismaService } from '../database/prisma.service';
import {
  BENEFIT_POLICIES,
  BOOTH_CATEGORIES,
  CreateBoothDto,
  OPERATING_STATUSES,
  REQUIRED_PERMISSIONS,
} from './dto/create-booth.dto';
import { ImportBoothsCsvDto } from './dto/import-booths-csv.dto';
import { UpdateBoothStatusDto } from './dto/update-booth-status.dto';
import { UpdateBoothDto } from './dto/update-booth.dto';

@Injectable()
export class BoothService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async createBooth(user: JwtUser, festivalId: string, dto: CreateBoothDto) {
    await this.ensureFestivalManager(user, festivalId);

    const booth = await this.prisma.booth.create({
      data: {
        festivalId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        operatingStatus: dto.operatingStatus ?? 'open',
        currentWaitingCount: dto.currentWaitingCount ?? 0,
        expectedWaitTime: dto.expectedWaitTime,
        requiredPermission: dto.requiredPermission ?? 'none',
        benefitPolicy: dto.benefitPolicy ?? 'none',
        posterUrl: dto.posterUrl,
      },
    });

    return { booth };
  }

  async importCsv(
    user: JwtUser,
    festivalId: string,
    file: UploadedFile | undefined,
    dto: ImportBoothsCsvDto,
  ) {
    await this.ensureFestivalManager(user, festivalId);

    if (!file) {
      throw new BadRequestException({
        code: 'CSV_FILE_REQUIRED',
        message: 'CSV file is required.',
      });
    }

    if (
      !['text/csv', 'application/vnd.ms-excel', 'text/plain'].includes(
        file.mimetype,
      ) &&
      !file.originalname.toLowerCase().endsWith('.csv')
    ) {
      throw new BadRequestException({
        code: 'INVALID_CSV_FILE',
        message: 'Only CSV files are allowed.',
      });
    }

    const rows = parse(file.buffer.toString('utf8'), {
      columns: true,
      bom: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    if (rows.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_CSV',
        message: 'CSV file does not contain booth rows.',
      });
    }

    const results = [];
    for (const [index, row] of rows.entries()) {
      const boothInput = this.toBoothInput(row, index + 2);
      const existingBooth =
        dto.upsert === false
          ? null
          : await this.prisma.booth.findFirst({
              where: { festivalId, name: boothInput.name },
            });

      if (existingBooth) {
        const booth = await this.prisma.booth.update({
          where: { id: existingBooth.id },
          data: boothInput,
        });
        results.push({ row: index + 2, action: 'updated', booth });
      } else {
        const booth = await this.prisma.booth.create({
          data: { festivalId, ...boothInput },
        });
        results.push({ row: index + 2, action: 'created', booth });
      }
    }

    return {
      imported: results.length,
      results,
    };
  }

  async listBooths(user: JwtUser, festivalId: string) {
    await this.ensureFestivalVisibleToUser(user, festivalId);

    const booths = await this.prisma.booth.findMany({
      where: { festivalId },
      orderBy: [{ operatingStatus: 'asc' }, { createdAt: 'asc' }],
    });

    return { booths };
  }

  async getBooth(user: JwtUser, boothId: string) {
    const booth = await this.findBoothOrThrow(boothId);
    await this.ensureFestivalVisibleToUser(user, booth.festivalId);
    return { booth };
  }

  async updateBooth(user: JwtUser, boothId: string, dto: UpdateBoothDto) {
    const booth = await this.findBoothOrThrow(boothId);
    await this.ensureFestivalManager(user, booth.festivalId);

    const updatedBooth = await this.prisma.booth.update({
      where: { id: boothId },
      data: dto,
    });

    return { booth: updatedBooth };
  }

  async updateBoothStatus(
    user: JwtUser,
    boothId: string,
    dto: UpdateBoothStatusDto,
  ) {
    const booth = await this.findBoothOrThrow(boothId);
    await this.ensureFestivalManager(user, booth.festivalId);

    const updatedBooth = await this.prisma.booth.update({
      where: { id: boothId },
      data: { operatingStatus: dto.operatingStatus },
    });

    return { booth: updatedBooth };
  }

  async deleteBooth(user: JwtUser, boothId: string) {
    const booth = await this.findBoothOrThrow(boothId);
    await this.ensureFestivalManager(user, booth.festivalId);

    await this.prisma.booth.delete({ where: { id: boothId } });
    return { ok: true };
  }

  private async findBoothOrThrow(boothId: string) {
    const booth = await this.prisma.booth.findUnique({
      where: { id: boothId },
    });

    if (!booth) {
      throw new NotFoundException({
        code: 'BOOTH_NOT_FOUND',
        message: 'Booth was not found.',
      });
    }

    return booth;
  }

  private toBoothInput(row: Record<string, string>, rowNumber: number) {
    const name = this.requiredString(row, 'name', rowNumber);
    const category = this.enumValue(
      row.category,
      BOOTH_CATEGORIES,
      'category',
      rowNumber,
    );
    const operatingStatus = this.enumValue(
      row.operating_status || row.operatingStatus || 'open',
      OPERATING_STATUSES,
      'operating_status',
      rowNumber,
    );
    const requiredPermission = this.enumValue(
      row.required_permission || row.requiredPermission || 'none',
      REQUIRED_PERMISSIONS,
      'required_permission',
      rowNumber,
    );
    const benefitPolicy = this.enumValue(
      row.benefit_policy || row.benefitPolicy || 'none',
      BENEFIT_POLICIES,
      'benefit_policy',
      rowNumber,
    );

    return {
      name,
      description: this.optionalString(row.description),
      category,
      location: this.optionalString(row.location),
      operatingStatus,
      currentWaitingCount: this.optionalNumber(
        row.current_waiting_count || row.currentWaitingCount,
        'current_waiting_count',
        rowNumber,
        0,
      ),
      expectedWaitTime: this.optionalNumber(
        row.expected_wait_time || row.expectedWaitTime,
        'expected_wait_time',
        rowNumber,
      ),
      requiredPermission,
      benefitPolicy,
      posterUrl: this.optionalString(row.poster_url || row.posterUrl),
    };
  }

  private requiredString(
    row: Record<string, string>,
    field: string,
    rowNumber: number,
  ) {
    const value = row[field]?.trim();
    if (!value) {
      throw new BadRequestException({
        code: 'INVALID_CSV_ROW',
        message: `CSV row ${rowNumber}: ${field} is required.`,
      });
    }
    return value;
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private optionalNumber(
    value: string | undefined,
    field: string,
    rowNumber: number,
    defaultValue?: number,
  ) {
    const trimmed = value?.trim();
    if (!trimmed) {
      return defaultValue;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException({
        code: 'INVALID_CSV_ROW',
        message: `CSV row ${rowNumber}: ${field} must be a non-negative integer.`,
      });
    }

    return parsed;
  }

  private enumValue<T extends readonly string[]>(
    value: string | undefined,
    allowedValues: T,
    field: string,
    rowNumber: number,
  ): T[number] {
    const normalized = value?.trim();
    if (normalized && allowedValues.includes(normalized)) {
      return normalized;
    }

    throw new BadRequestException({
      code: 'INVALID_CSV_ROW',
      message: `CSV row ${rowNumber}: ${field} must be one of ${allowedValues.join(', ')}.`,
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
      message: 'Only the festival owner or super admin can manage booths.',
    });
  }

  private async ensureFestivalVisibleToUser(user: JwtUser, festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
      select: { status: true, visibility: true },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }

    if (
      (festival.status === 'active' && festival.visibility === 'public') ||
      (await this.adminAccessService.canManageFestival(user, festivalId))
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'FESTIVAL_NOT_VISIBLE',
      message: 'Festival is not visible to this user.',
    });
  }
}
