import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminAccessService } from '../access/admin-access.service';
import { JwtUser } from '../common/types/jwt-user.type';
import { PrismaService } from '../database/prisma.service';
import {
  ScanReportQueryDto,
  UsageReportQueryDto,
} from './dto/report-query.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async getSummary(user: JwtUser, festivalId: string) {
    await this.ensureFestivalManager(user, festivalId);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalPassIssuedCount,
      entryProcessedCount,
      studentCredentialCount,
      adultCredentialCount,
      benefitUsageCount,
      eventUsageCount,
      duplicateBlockedCount,
      recentScans,
      boothUsageGroups,
      recentScanTimes,
      scanResultGroups,
      usageTypeGroups,
    ] = await Promise.all([
      this.prisma.credential.count({
        where: { festivalId, type: 'entry', status: 'issued' },
      }),
      this.prisma.usageRecord.count({
        where: { festivalId, usageType: 'entry' },
      }),
      this.prisma.credential.count({
        where: { festivalId, type: 'student', status: 'issued' },
      }),
      this.prisma.credential.count({
        where: { festivalId, type: 'adult', status: 'issued' },
      }),
      this.prisma.usageRecord.count({
        where: { festivalId, usageType: 'benefit' },
      }),
      this.prisma.usageRecord.count({
        where: { festivalId, usageType: 'event' },
      }),
      this.prisma.scanLog.count({
        where: { festivalId, result: 'already_used' },
      }),
      this.prisma.scanLog.findMany({
        where: { festivalId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.usageRecord.groupBy({
        by: ['boothId'],
        where: {
          festivalId,
          boothId: { not: null },
          usageType: { in: ['benefit', 'event', 'adult_check', 'student_check'] },
        },
        _count: { _all: true },
      }),
      this.prisma.scanLog.findMany({
        where: { festivalId, createdAt: { gte: last24Hours } },
        select: { createdAt: true },
      }),
      this.prisma.scanLog.groupBy({
        by: ['result'],
        where: { festivalId },
        _count: { _all: true },
      }),
      this.prisma.usageRecord.groupBy({
        by: ['usageType'],
        where: { festivalId },
        _count: { _all: true },
      }),
    ]);

    const boothIds = boothUsageGroups
      .map((group) => group.boothId)
      .filter((boothId): boothId is string => Boolean(boothId));
    const booths = boothIds.length
      ? await this.prisma.booth.findMany({
          where: { id: { in: boothIds } },
          select: { id: true, name: true, category: true },
        })
      : [];
    const boothMap = new Map(booths.map((booth) => [booth.id, booth]));

    return {
      summary: {
        totalPassIssuedCount,
        entryProcessedCount,
        studentVerifiedCount: studentCredentialCount,
        adultVerifiedCount: adultCredentialCount,
        boothUsageCount: benefitUsageCount,
        eventParticipationCount: eventUsageCount,
        duplicateBlockedCount,
        recentScans,
        boothUsage: boothUsageGroups.map((group) => ({
          boothId: group.boothId,
          booth: group.boothId ? boothMap.get(group.boothId) ?? null : null,
          count: group._count._all,
        })),
        hourlyScanCount: this.groupScanTimesByKstHour(recentScanTimes),
        scanResultCount: scanResultGroups.map((group) => ({
          result: group.result,
          count: group._count._all,
        })),
        usageTypeCount: usageTypeGroups.map((group) => ({
          usageType: group.usageType,
          count: group._count._all,
        })),
      },
    };
  }

  async listScans(
    user: JwtUser,
    festivalId: string,
    query: ScanReportQueryDto,
  ) {
    await this.ensureFestivalManager(user, festivalId);

    const where: Prisma.ScanLogWhereInput = {
      festivalId,
      ...this.dateRangeWhere(query.from, query.to, 'createdAt'),
      scanPurpose: query.scanPurpose,
      result: query.result,
    };

    const [items, total] = await Promise.all([
      this.prisma.scanLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.scanLog.count({ where }),
    ]);

    return {
      scans: items,
      pagination: {
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    };
  }

  async listUsage(
    user: JwtUser,
    festivalId: string,
    query: UsageReportQueryDto,
  ) {
    await this.ensureFestivalManager(user, festivalId);

    const where: Prisma.UsageRecordWhereInput = {
      festivalId,
      ...this.dateRangeWhere(query.from, query.to, 'usedAt'),
      usageType: query.usageType,
    };

    const [items, total] = await Promise.all([
      this.prisma.usageRecord.findMany({
        where,
        orderBy: { usedAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.usageRecord.count({ where }),
    ]);

    return {
      usage: items,
      pagination: {
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    };
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
      message: 'Only the festival owner or super admin can view reports.',
    });
  }

  private dateRangeWhere(
    from: string | undefined,
    to: string | undefined,
    field: 'createdAt' | 'usedAt',
  ) {
    if (!from && !to) {
      return {};
    }

    return {
      [field]: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    };
  }

  private groupScanTimesByKstHour(items: Array<{ createdAt: Date }>) {
    const counts = new Map<string, number>();

    for (const item of items) {
      const key = this.kstHourKey(item.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([hour, count]) => ({ hour, count }));
  }

  private kstHourKey(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '00';

    return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:00`;
  }
}
