import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { OpenDidController } from './opendid.controller';
import { OpenDidConfigService } from './opendid.config';
import { OpenDidCredentialProvider } from './opendid-credential.provider';
import { OpenDidDidProvider } from './opendid-did.provider';
import { OpenDidHttpService } from './opendid-http.service';
import { OpenDidStatusService } from './opendid-status.service';
import { OpenDidWalletController } from './opendid-wallet.controller';
import { OpenDidWalletFlowService } from './opendid-wallet-flow.service';

@Module({
  imports: [AccessModule],
  controllers: [OpenDidController, OpenDidWalletController],
  providers: [
    OpenDidConfigService,
    OpenDidCredentialProvider,
    OpenDidDidProvider,
    OpenDidHttpService,
    OpenDidStatusService,
    OpenDidWalletFlowService,
  ],
  exports: [
    OpenDidConfigService,
    OpenDidCredentialProvider,
    OpenDidDidProvider,
  ],
})
export class OpenDidModule {}
