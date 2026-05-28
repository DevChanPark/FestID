import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { OpenDidCredentialProvider } from '../opendid/opendid-credential.provider';

type CredentialType = 'entry' | 'student' | 'adult' | 'staff' | 'admin';

interface IssueCredentialInput {
  userId: string;
  subjectDid: string;
  issuerDid: string;
  festivalId?: string;
  type: CredentialType;
  claims: Prisma.InputJsonObject;
  expiresAt?: Date;
}

@Injectable()
export class CredentialIssuerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openDidCredentialProvider: OpenDidCredentialProvider,
  ) {}

  issueEntryCredential(input: Omit<IssueCredentialInput, 'type'>) {
    return this.issueCredential({ ...input, type: 'entry' });
  }

  issueAdultCredential(input: Omit<IssueCredentialInput, 'type'>) {
    if (input.claims.isAdult !== true) {
      throw new BadRequestException({
        code: 'ADULT_CLAIM_REQUIRED',
        message: 'Adult credential requires isAdult=true claim.',
      });
    }
    return this.issueCredential({ ...input, type: 'adult' });
  }

  issueStudentCredential(input: Omit<IssueCredentialInput, 'type'>) {
    return this.issueCredential({ ...input, type: 'student' });
  }

  issueStaffCredential(input: Omit<IssueCredentialInput, 'type'>) {
    return this.issueCredential({ ...input, type: 'staff' });
  }

  issueAdminCredential(input: Omit<IssueCredentialInput, 'type'>) {
    return this.issueCredential({ ...input, type: 'admin' });
  }

  private async issueCredential(input: IssueCredentialInput) {
    const openDidCredential =
      await this.openDidCredentialProvider.issueCredential({
        ...input,
        claims: input.claims as Record<string, unknown>,
      });

    return this.prisma.credential.create({
      data: {
        userId: input.userId,
        subjectDid: input.subjectDid,
        issuerDid: openDidCredential?.issuerDid ?? input.issuerDid,
        festivalId: input.festivalId,
        type: input.type,
        claimsJson: input.claims,
        credentialProvider:
          openDidCredential?.credentialProvider ?? 'internal',
        externalCredentialId: openDidCredential?.externalCredentialId,
        vcJwt: openDidCredential?.vcJwt,
        vcDocumentJson: this.toJsonObject(openDidCredential?.vcDocument),
        proofJson: this.toJsonObject(openDidCredential?.proof),
        schemaId: openDidCredential?.schemaId,
        issuerServiceId: openDidCredential?.issuerServiceId,
        credentialStatusId: openDidCredential?.credentialStatusId,
        externalStatus: openDidCredential?.externalStatus,
        issuedTxId: openDidCredential?.issuedTxId,
        expiresAt: input.expiresAt,
      },
    });
  }

  private toJsonObject(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonObject | undefined {
    return value as Prisma.InputJsonObject | undefined;
  }
}
