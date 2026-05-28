import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CredentialVerifierService } from './credential-verifier.service';

@ApiTags('credentials')
@Controller('credentials')
export class CredentialController {
  constructor(
    private readonly credentialVerifierService: CredentialVerifierService,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMyCredentials(@CurrentUser() user: JwtUser) {
    return this.credentialVerifierService.getUserCredentials(user.sub);
  }
}
