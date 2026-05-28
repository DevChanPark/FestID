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
import { AdminCredentialGuard } from '../access/guards/admin-credential.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CredentialAdminService } from './credential-admin.service';
import { ListFestivalCredentialsQueryDto } from './dto/list-festival-credentials-query.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';

@ApiTags('credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminCredentialGuard)
@Controller()
export class CredentialAdminController {
  constructor(private readonly credentialAdminService: CredentialAdminService) {}

  @Get('festivals/:festivalId/credentials')
  listFestivalCredentials(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Query() query: ListFestivalCredentialsQueryDto,
  ) {
    return this.credentialAdminService.listFestivalCredentials(
      user,
      festivalId,
      query,
    );
  }

  @Post('credentials/:credentialId/revoke')
  revokeCredential(
    @CurrentUser() user: JwtUser,
    @Param('credentialId') credentialId: string,
    @Body() dto: RevokeCredentialDto,
  ) {
    return this.credentialAdminService.revokeCredential(
      user,
      credentialId,
      dto,
    );
  }
}
