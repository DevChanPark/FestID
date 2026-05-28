import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CompleteVerificationDto } from './dto/complete-verification.dto';
import { VerifyQrDto } from './dto/verify-qr.dto';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('qr')
  verifyQr(@CurrentUser() user: JwtUser, @Body() dto: VerifyQrDto) {
    return this.verificationService.verifyQr(user, dto);
  }

  @Post('entry/complete')
  completeEntry(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteVerificationDto,
  ) {
    return this.verificationService.complete(user, 'entry', dto);
  }

  @Post('benefit/complete')
  completeBenefit(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteVerificationDto,
  ) {
    return this.verificationService.complete(user, 'benefit', dto);
  }

  @Post('event/complete')
  completeEvent(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteVerificationDto,
  ) {
    return this.verificationService.complete(user, 'event', dto);
  }

  @Post('adult-check/complete')
  completeAdultCheck(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteVerificationDto,
  ) {
    return this.verificationService.complete(user, 'adult_check', dto);
  }

  @Post('student-check/complete')
  completeStudentCheck(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteVerificationDto,
  ) {
    return this.verificationService.complete(user, 'student_check', dto);
  }
}
