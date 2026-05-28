import { Module } from '@nestjs/common';
import { BoothController } from './booth.controller';
import { BoothService } from './booth.service';

@Module({
  controllers: [BoothController],
  providers: [BoothService],
})
export class BoothModule {}
