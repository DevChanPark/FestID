import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminCredentialGuard } from '../access/guards/admin-credential.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CreateStaffInviteDto } from './dto/create-staff-invite.dto';
import { RejectStaffRequestDto } from './dto/reject-staff-request.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('festivals/:festivalId/staff-invites')
  @UseGuards(AdminCredentialGuard)
  createInvite(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: CreateStaffInviteDto,
  ) {
    return this.staffService.createInvite(user, festivalId, dto);
  }

  @Get('festivals/:festivalId/staff-invites')
  @UseGuards(AdminCredentialGuard)
  listInvites(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.staffService.listInvites(user, festivalId);
  }

  @Post('staff-invites/:inviteCode/revoke')
  @UseGuards(AdminCredentialGuard)
  revokeInvite(
    @CurrentUser() user: JwtUser,
    @Param('inviteCode') inviteCode: string,
  ) {
    return this.staffService.revokeInvite(user, inviteCode);
  }

  @Post('staff-invites/:inviteCode/request')
  requestStaffRole(
    @CurrentUser() user: JwtUser,
    @Param('inviteCode') inviteCode: string,
  ) {
    return this.staffService.requestStaffRole(user, inviteCode);
  }

  @Get('festivals/:festivalId/staff-requests')
  @UseGuards(AdminCredentialGuard)
  listRequests(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.staffService.listRequests(user, festivalId);
  }

  @Post('staff-requests/:requestId/approve')
  @UseGuards(AdminCredentialGuard)
  approveRequest(
    @CurrentUser() user: JwtUser,
    @Param('requestId') requestId: string,
  ) {
    return this.staffService.approveRequest(user, requestId);
  }

  @Post('staff-requests/:requestId/reject')
  @UseGuards(AdminCredentialGuard)
  rejectRequest(
    @CurrentUser() user: JwtUser,
    @Param('requestId') requestId: string,
    @Body() dto: RejectStaffRequestDto,
  ) {
    return this.staffService.rejectRequest(user, requestId, dto);
  }

  @Get('festivals/:festivalId/staff/me')
  getMyStaffMode(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.staffService.getMyStaffMode(user.sub, festivalId);
  }
}
