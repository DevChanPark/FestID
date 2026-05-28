import { Module } from '@nestjs/common';
import { CredentialModule } from '../credential/credential.module';
import { DidModule } from '../did/did.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [CredentialModule, DidModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
