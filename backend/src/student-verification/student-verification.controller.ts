import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminCredentialGuard } from '../access/guards/admin-credential.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CreateStudentVerificationDto } from './dto/create-student-verification.dto';
import { UpdateStudentVerificationStatusDto } from './dto/update-student-verification-status.dto';
import { StudentVerificationService } from './student-verification.service';

@ApiTags('student-verifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StudentVerificationController {
  constructor(
    private readonly studentVerificationService: StudentVerificationService,
  ) {}

  @Post('festivals/:festivalId/student-verifications')
  requestVerification(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: CreateStudentVerificationDto,
  ) {
    return this.studentVerificationService.requestVerification(
      user.sub,
      festivalId,
      dto,
    );
  }

  @Get('festivals/:festivalId/student-verifications/me')
  getMyVerification(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.studentVerificationService.getMyVerification(
      user.sub,
      festivalId,
    );
  }

  @Get('festivals/:festivalId/student-verifications')
  @UseGuards(AdminCredentialGuard)
  listFestivalVerifications(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.studentVerificationService.listFestivalVerifications(
      user,
      festivalId,
    );
  }

  @Patch('student-verifications/:verificationId/status')
  @UseGuards(AdminCredentialGuard)
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('verificationId') verificationId: string,
    @Body() dto: UpdateStudentVerificationStatusDto,
  ) {
    return this.studentVerificationService.updateStatus(
      user,
      verificationId,
      dto,
    );
  }
}
