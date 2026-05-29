import { Module } from '@nestjs/common';
import { OpenDidModule } from '../opendid/opendid.module';
import { CredentialAdminController } from './credential-admin.controller';
import { CredentialAdminService } from './credential-admin.service';
import { CredentialController } from './credential.controller';
import { CredentialIssuerService } from './credential-issuer.service';
import { CredentialStatusService } from './credential-status.service';
import { CredentialVerifierService } from './credential-verifier.service';

@Module({
  imports: [OpenDidModule],
  controllers: [CredentialAdminController, CredentialController],
  providers: [
    CredentialAdminService,
    CredentialIssuerService,
    CredentialStatusService,
    CredentialVerifierService,
  ],
  exports: [
    CredentialIssuerService,
    CredentialStatusService,
    CredentialVerifierService,
  ],
})
export class CredentialModule {}
