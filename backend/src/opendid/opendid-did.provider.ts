import { BadRequestException, Injectable } from '@nestjs/common';
import { DidRegistrationResult } from '../did/did-provider.interface';
import { OpenDidConfigService } from './opendid.config';
import { OpenDidHttpService } from './opendid-http.service';

@Injectable()
export class OpenDidDidProvider {
  constructor(
    private readonly openDidConfigService: OpenDidConfigService,
    private readonly openDidHttpService: OpenDidHttpService,
  ) {}

  async registerUserDid(input: {
    localDid: string;
    userId: string;
  }): Promise<DidRegistrationResult | null> {
    const apiBaseUrl = this.openDidConfigService.issuerBaseUrl;
    if (!apiBaseUrl) {
      return null;
    }

    const response = await this.openDidHttpService.post<Record<string, unknown>>(
      apiBaseUrl,
      '/did/register',
      {
        localDid: input.localDid,
        userId: input.userId,
      },
    );

    const data = this.recordValue(response.data) ?? response;
    const externalDid = this.stringValue(data.did) ?? this.stringValue(data.externalDid);
    if (!externalDid) {
      throw new BadRequestException({
        code: 'OPENDID_DID_RESPONSE_INVALID',
        message: 'OpenDID DID registration response did not include a DID.',
      });
    }

    return {
      did: input.localDid,
      didMethod: 'opendid',
      externalDid,
      didDocument: this.recordValue(data.didDocument),
      registrationTxId:
        this.stringValue(data.txId) ??
        this.stringValue(data.transactionId) ??
        this.stringValue(data.txHash),
      registeredAt: new Date().toISOString(),
    };
  }

  private recordValue(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() !== ''
      ? value
      : undefined;
  }
}
