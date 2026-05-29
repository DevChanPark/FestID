import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import {
  CompleteOpenDidIssueVcDto,
  ConfirmOpenDidVerifyDto,
  CreateOpenDidIssueOfferDto,
  CreateOpenDidVerifyOfferDto,
  InspectOpenDidIssueProposeDto,
  ListOpenDidWalletTransactionsQueryDto,
  RequestOpenDidIssueVcDto,
  RequestOpenDidIssueProfileDto,
  RequestOpenDidVerifyProfileDto,
  RequestOpenDidVerifyVpDto,
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

  @Post('issue-inspect-propose')
  inspectIssuePropose(
    @CurrentUser() user: JwtUser,
    @Body() dto: InspectOpenDidIssueProposeDto,
  ) {
    return this.openDidWalletFlowService.inspectIssuePropose(user, dto);
  }

  @Post('issue-vc')
  requestIssueVc(
    @CurrentUser() user: JwtUser,
    @Body() dto: RequestOpenDidIssueVcDto,
  ) {
    return this.openDidWalletFlowService.requestIssueVc(user, dto);
  }

  @Post('issue-complete')
  completeIssueVc(
    @CurrentUser() user: JwtUser,
    @Body() dto: CompleteOpenDidIssueVcDto,
  ) {
    return this.openDidWalletFlowService.completeIssueVc(user, dto);
  }

  @Get('issue-result/:transactionId')
  @ApiParam({ name: 'transactionId' })
  getIssueResult(
    @CurrentUser() user: JwtUser,
    @Param('transactionId') transactionId: string,
  ) {
    return this.openDidWalletFlowService.getIssueResult(user, transactionId);
  }

  @Post('verify-offer')
  createVerifyOffer(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateOpenDidVerifyOfferDto,
  ) {
    return this.openDidWalletFlowService.createVerifyOffer(user, dto);
  }

  @Post('verify-profile')
  requestVerifyProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: RequestOpenDidVerifyProfileDto,
  ) {
    return this.openDidWalletFlowService.requestVerifyProfile(user, dto);
  }

  @Post('verify-vp')
  requestVerifyVp(
    @CurrentUser() user: JwtUser,
    @Body() dto: RequestOpenDidVerifyVpDto,
  ) {
    return this.openDidWalletFlowService.requestVerifyVp(user, dto);
  }

  @Post('verify-confirm')
  confirmVerify(
    @CurrentUser() user: JwtUser,
    @Body() dto: ConfirmOpenDidVerifyDto,
  ) {
    return this.openDidWalletFlowService.confirmVerify(user, dto);
  }

  @Get('transactions')
  listTransactions(
    @CurrentUser() user: JwtUser,
    @Query() query: ListOpenDidWalletTransactionsQueryDto,
  ) {
    return this.openDidWalletFlowService.listTransactions(user, query);
  }

  @Get('transactions/:transactionId')
  @ApiParam({ name: 'transactionId' })
  getTransaction(
    @CurrentUser() user: JwtUser,
    @Param('transactionId') transactionId: string,
  ) {
    return this.openDidWalletFlowService.getTransaction(user, transactionId);
  }
}
