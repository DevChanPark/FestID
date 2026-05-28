import { Module } from '@nestjs/common';
import { CampassDidProvider } from './campass-did.provider';
import { DidService } from './did.service';

@Module({
  providers: [CampassDidProvider, DidService],
  exports: [DidService],
})
export class DidModule {}
