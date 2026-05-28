import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { IssuePassDto } from './dto/issue-pass.dto';
import { PassService } from './pass.service';

@ApiTags('passes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('festivals/:festivalId/passes')
export class PassController {
  constructor(private readonly passService: PassService) {}

  @Post('issue')
  issuePass(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: IssuePassDto,
  ) {
    return this.passService.issuePass(user.sub, festivalId, dto);
  }

  @Get('me')
  getMyPass(@CurrentUser() user: JwtUser, @Param('festivalId') festivalId: string) {
    return this.passService.getMyPass(user.sub, festivalId);
  }
}
