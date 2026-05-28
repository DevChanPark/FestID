import { Module } from '@nestjs/common';
import { CredentialModule } from '../credential/credential.module';
import { PassController } from './pass.controller';
import { PassService } from './pass.service';

@Module({
  imports: [CredentialModule],
  controllers: [PassController],
  providers: [PassService],
  exports: [PassService],
})
export class PassModule {}
