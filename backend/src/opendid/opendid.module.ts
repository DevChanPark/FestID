import { Module } from '@nestjs/common';
import { OpenDidConfigService } from './opendid.config';
import { OpenDidCredentialProvider } from './opendid-credential.provider';
import { OpenDidDidProvider } from './opendid-did.provider';
import { OpenDidHttpService } from './opendid-http.service';

@Module({
  providers: [
    OpenDidConfigService,
    OpenDidCredentialProvider,
    OpenDidDidProvider,
    OpenDidHttpService,
  ],
  exports: [
    OpenDidConfigService,
    OpenDidCredentialProvider,
    OpenDidDidProvider,
  ],
})
export class OpenDidModule {}
