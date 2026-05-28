import { Module } from '@nestjs/common';
import { OpenDidModule } from '../opendid/opendid.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [OpenDidModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
