import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SuperAdminGuard } from '../access/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OpenDidStatusQueryDto } from './dto/opendid-status-query.dto';
import { OpenDidStatusService } from './opendid-status.service';

@ApiTags('opendid')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('opendid')
export class OpenDidController {
  constructor(private readonly openDidStatusService: OpenDidStatusService) {}

  @Get('status')
  getStatus(@Query() query: OpenDidStatusQueryDto) {
    return this.openDidStatusService.getStatus({ probe: query.probe });
  }
}
