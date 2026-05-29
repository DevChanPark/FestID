import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import {
  CreateOpenDidIssueOfferDto,
  CreateOpenDidVerifyOfferDto,
  RequestOpenDidIssueProfileDto,
  RequestOpenDidVerifyProfileDto,
} from './dto/open-did-wallet-offer.dto';
import { OpenDidWalletFlowService } from './opendid-wallet-flow.service';

@ApiTags('opendid-wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('opendid/wallet')
export class OpenDidWalletController {
  constructor(
    private readonly openDidWalletFlowService: OpenDidWalletFlowService,
  ) {}

  @Post('issue-offer')
  createIssueOffer(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateOpenDidIssueOfferDto,
  ) {
    return this.openDidWalletFlowService.createIssueOffer(user, dto);
  }

  @Post('issue-profile')
  requestIssueProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: RequestOpenDidIssueProfileDto,
  ) {
    return this.openDidWalletFlowService.requestIssueProfile(user, dto);
  }

  @Post('verify-offer')
  createVerifyOffer(@Body() dto: CreateOpenDidVerifyOfferDto) {
    return this.openDidWalletFlowService.createVerifyOffer(dto);
  }

  @Post('verify-profile')
  requestVerifyProfile(@Body() dto: RequestOpenDidVerifyProfileDto) {
    return this.openDidWalletFlowService.requestVerifyProfile(dto);
  }
}
