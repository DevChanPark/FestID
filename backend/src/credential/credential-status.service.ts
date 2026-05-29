import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { OpenDidCredentialProvider } from '../opendid/opendid-credential.provider';

type SyncableCredential = {
  id: string;
  credentialProvider: string;
  externalCredentialId: string | null;
  credentialStatusId: string | null;
  vcJwt: string | null;
  status: string;
  claimsJson: Prisma.JsonValue;
};

@Injectable()
export class CredentialStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openDidCredentialProvider: OpenDidCredentialProvider,
  ) {}

  async syncCredentialStatus(credential: SyncableCredential) {
    if (credential.credentialProvider !== 'opendid') {
      return { credential, externalStatus: null, synced: false };
    }

    const externalStatus =
      await this.openDidCredentialProvider.verifyCredentialStatus({
        credentialId: credential.externalCredentialId,
        credentialStatusId: credential.credentialStatusId,
        vcJwt: credential.vcJwt,
      });

    if (!externalStatus) {
      return { credential, externalStatus: null, synced: false };
    }

    const nextData: Prisma.CredentialUpdateInput = {
      externalStatus: externalStatus.externalStatus,
    };

    if (externalStatus.revoked) {
      nextData.status = 'revoked';
      nextData.revokedAt = new Date();
    } else if (externalStatus.expired) {
      nextData.status = 'expired';
    }

    const updatedCredential = await this.prisma.credential.update({
      where: { id: credential.id },
      data: nextData,
    });

    return {
      credential: updatedCredential,
      externalStatus,
      synced: true,
    };
  }
}
