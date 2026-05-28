import { Module } from '@nestjs/common';
import { CredentialModule } from '../credential/credential.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CredentialModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
