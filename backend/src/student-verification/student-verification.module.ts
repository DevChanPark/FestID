import { Module } from '@nestjs/common';
import { CredentialModule } from '../credential/credential.module';
import { StudentVerificationController } from './student-verification.controller';
import { StudentVerificationService } from './student-verification.service';

@Module({
  imports: [CredentialModule],
  controllers: [StudentVerificationController],
  providers: [StudentVerificationService],
})
export class StudentVerificationModule {}
