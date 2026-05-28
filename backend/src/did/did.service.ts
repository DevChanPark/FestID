import { Injectable } from '@nestjs/common';
import { CampassDidProvider } from './campass-did.provider';

@Injectable()
export class DidService {
  constructor(private readonly campassDidProvider: CampassDidProvider) {}

  createUserDid(): string {
    return this.campassDidProvider.createUserDid().did;
  }

  maskDid(did: string): string {
    return this.campassDidProvider.maskDid(did);
  }
}
