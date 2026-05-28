import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SuperAdminGuard } from '../access/guards/super-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { AdminService } from './admin.service';
import { CreateAdminProfileDto } from './dto/create-admin-profile.dto';
import { ListAdminProfilesQueryDto } from './dto/list-admin-profiles-query.dto';
import { UpdateAdminProofStatusDto } from './dto/update-admin-proof-status.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('profile')
  upsertMyProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateAdminProfileDto,
  ) {
    return this.adminService.upsertMyProfile(user.sub, dto);
  }

  @Get('profile/me')
  getMyProfile(@CurrentUser() user: JwtUser) {
    return this.adminService.getMyProfile(user.sub);
  }

  @Get('profiles')
  @UseGuards(SuperAdminGuard)
  listProfiles(@Query() query: ListAdminProfilesQueryDto) {
    return this.adminService.listProfiles(query);
  }

  @Patch('profiles/:profileId/proof-status')
  @UseGuards(SuperAdminGuard)
  updateProofStatus(
    @Param('profileId') profileId: string,
    @Body() dto: UpdateAdminProofStatusDto,
  ) {
    return this.adminService.updateProofStatus(profileId, dto);
  }
}
