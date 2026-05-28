import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { AuthService } from './auth.service';
import { AuthRequestStatusQueryDto } from './dto/auth-request-status-query.dto';
import { StartMobileIdAuthDto } from './dto/start-mobile-id-auth.dto';
import { VerifyMobileIdAuthDto } from './dto/verify-mobile-id-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('mobile-id/start')
  startMobileIdAuth(@Body() dto: StartMobileIdAuthDto) {
    return this.authService.startMobileIdAuth(dto);
  }

  @Get('mobile-id/providers')
  listMobileIdProviders() {
    return this.authService.listMobileIdProviders();
  }

  @Get('mobile-id/requests/:authRequestId')
  getAuthRequestStatus(
    @Param('authRequestId') authRequestId: string,
    @Query() query: AuthRequestStatusQueryDto,
  ) {
    return this.authService.getAuthRequestStatus(authRequestId, query);
  }

  @Post('mobile-id/requests/expire-stale')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  expireStaleAuthRequests() {
    return this.authService.expireStaleAuthRequests();
  }

  @Post('mobile-id/verify')
  verifyMobileIdAuth(@Body() dto: VerifyMobileIdAuthDto) {
    return this.authService.verifyMobileIdAuth(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: JwtUser) {
    return this.authService.getMe(user.sub);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout() {
    return { ok: true };
  }
}
