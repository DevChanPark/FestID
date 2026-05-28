import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminCredentialGuard } from '../access/guards/admin-credential.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import {
  ScanReportQueryDto,
  UsageReportQueryDto,
} from './dto/report-query.dto';
import { ReportService } from './report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminCredentialGuard)
@Controller('festivals/:festivalId/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.reportService.getSummary(user, festivalId);
  }

  @Get('scans')
  listScans(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Query() query: ScanReportQueryDto,
  ) {
    return this.reportService.listScans(user, festivalId, query);
  }

  @Get('usage')
  listUsage(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Query() query: UsageReportQueryDto,
  ) {
    return this.reportService.listUsage(user, festivalId, query);
  }
}
