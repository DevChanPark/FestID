import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';
import { QrService } from './qr.service';

@ApiTags('qr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('festivals/:festivalId/qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post()
  createQrToken(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: CreateQrTokenDto,
  ) {
    return this.qrService.createQrToken(user.sub, festivalId, dto);
  }
}
