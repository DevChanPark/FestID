import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateUserDidInput,
  DidProvider,
  DidRegistrationResult,
} from './did-provider.interface';

@Injectable()
export class CampassDidProvider implements DidProvider {
  readonly type = 'campass' as const;

  createUserDid(_input?: CreateUserDidInput): DidRegistrationResult {
    return {
      did: `did:campass:user:${randomUUID()}`,
      didMethod: 'campass',
    };
  }

  maskDid(did: string): string {
    if (did.length <= 18) {
      return did;
    }

    return `${did.slice(0, 16)}...${did.slice(-8)}`;
  }
}
