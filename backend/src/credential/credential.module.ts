import { Module } from '@nestjs/common';
import { OpenDidModule } from '../opendid/opendid.module';
import { CredentialAdminController } from './credential-admin.controller';
import { CredentialAdminService } from './credential-admin.service';
import { CredentialController } from './credential.controller';
import { CredentialIssuerService } from './credential-issuer.service';
import { CredentialVerifierService } from './credential-verifier.service';

@Module({
  imports: [OpenDidModule],
  controllers: [CredentialAdminController, CredentialController],
  providers: [
    CredentialAdminService,
    CredentialIssuerService,
    CredentialVerifierService,
  ],
  exports: [CredentialIssuerService, CredentialVerifierService],
})
export class CredentialModule {}
