import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import {
  AuthResult,
  MobileIdAuthProvider,
  MobileIdProviderState,
  StartMobileIdAuthInput,
  StartMobileIdAuthOutput,
  VerifyMobileIdAuthInput,
} from './mobile-id-auth-provider.interface';

type OmniOneAuthFlow = 'app' | 'qr';
type OmniOneRequestType = 'WEB2APP' | 'APP2APP';

type OacxTransResponse = {
  token?: string;
  txId?: string;
  oacxCode?: string;
  resultCode?: string | number;
  clientMessage?: string;
};

type OacxRequestResponse = {
  token?: string;
  cxId?: string;
  oacxStatus?: string;
  oacxCode?: string;
  resultCode?: string | number;
  clientMessage?: string;
  provider?: string;
  data?: unknown;
};

type OacxResultResponse = {
  token?: string;
  txId?: string;
  cxId?: string;
  oacxStatus?: string;
  oacxCode?: string;
  resultCode?: string | number;
  clientMessage?: string;
  provider?: string;
  data?: {
    verified?: boolean;
    zkp?: boolean;
  };
};

type OacxTokenParseResponse = {
  data?: Record<string, unknown>;
  oacxCode?: string;
  resultCode?: string | number;
  clientMessage?: string;
};

@Injectable()
export class OmniOneCxProvider implements MobileIdAuthProvider {
  constructor(private readonly configService: ConfigService) {}

  async startAuth(input: StartMobileIdAuthInput): Promise<StartMobileIdAuthOutput> {
    const authFlow = this.optionString(input.options?.authFlow, 'app') as
      | OmniOneAuthFlow
      | string;
    if (authFlow !== 'app' && authFlow !== 'qr') {
      throw new BadRequestException({
        code: 'INVALID_OMNIONE_AUTH_FLOW',
        message: 'OmniOne authFlow must be app or qr.',
      });
    }

    const oacxProvider = this.optionString(
      input.options?.oacxProvider,
      this.getRequiredConfig('OMNIONE_CX_PROVIDER_ID'),
    );
    const requestType = this.optionString(
      input.options?.requestType,
      this.configService.get<string>('OMNIONE_CX_REQUEST_TYPE') ?? 'WEB2APP',
    ) as OmniOneRequestType;
    const signType =
      this.configService.get<string>('OMNIONE_CX_SIGN_TYPE') ?? 'ENT_MID';
    const zkpType = this.optionString(
      input.options?.zkpType,
      this.configService.get<string>('OMNIONE_CX_ZKP_TYPE') ?? '',
    );
    const useConvertor =
      this.optionBoolean(input.options?.useConvertor) ??
      this.configService.get<string>('OMNIONE_CX_USE_CONVERTOR') === 'true';

    const trans = await this.postOacx<OacxTransResponse>('/oacx/api/v1.0/trans', {});
    this.assertOacxSuccess(trans, 'OMNIONE_TRANS_FAILED');
    if (!trans.token || !trans.txId) {
      throw new BadGatewayException({
        code: 'OMNIONE_TRANS_INVALID_RESPONSE',
        message: 'OmniOne /trans response did not include token and txId.',
      });
    }

    const requestBody: Record<string, unknown> = {
      provider: oacxProvider,
      token: trans.token,
      txId: trans.txId,
      contentInfo: { signType },
    };

    if (authFlow === 'app') {
      requestBody.requestType = requestType;
    }

    if (zkpType) {
      requestBody.extraParams = { zkpType };
    }

    const requestPath =
      authFlow === 'qr'
        ? '/oacx/api/v1.0/authen/qr/request'
        : '/oacx/api/v1.0/authen/app/request';
    const authRequest = await this.postOacx<OacxRequestResponse>(
      requestPath,
      requestBody,
    );
    this.assertOacxSuccess(authRequest, 'OMNIONE_AUTH_REQUEST_FAILED');

    if (!authRequest.token || !authRequest.cxId) {
      throw new BadGatewayException({
        code: 'OMNIONE_AUTH_REQUEST_INVALID_RESPONSE',
        message: 'OmniOne auth request response did not include token and cxId.',
      });
    }

    const providerState: MobileIdProviderState = {
      oacxToken: authRequest.token,
      oacxTxId: trans.txId,
      oacxCxId: authRequest.cxId,
      oacxProvider,
      oacxRequestType: authFlow === 'app' ? requestType : undefined,
      oacxAuthFlow: authFlow,
      oacxUseConvertor: useConvertor,
      oacxStatus: authRequest.oacxStatus,
      oacxResultCode: String(authRequest.resultCode ?? ''),
    };

    return {
      authRequestId: input.authRequestId,
      provider: 'omnione_cx',
      nonce: input.nonce,
      state: input.state,
      expiresAt: input.expiresAt,
      payload: {
        authFlow,
        requestType: authFlow === 'app' ? requestType : undefined,
        oacxProvider,
        webBaseUrl: this.configService.get<string>('OMNIONE_CX_WEB_BASE_URL'),
        configUrl: this.configService.get<string>('OMNIONE_CX_CONFIG_URL'),
        cxId: authRequest.cxId,
        signType,
        oacxStatus: authRequest.oacxStatus,
        clientMessage: authRequest.clientMessage,
        data: authRequest.data,
      },
      providerState,
    };
  }

  async verify(input: VerifyMobileIdAuthInput): Promise<AuthResult> {
    const state = this.requireProviderState(input.providerState);
    const authFlow = state.oacxAuthFlow;

    const resultBody: Record<string, unknown> = {
      provider: state.oacxProvider,
      token: state.oacxToken,
      txId: state.oacxTxId,
      cxId: state.oacxCxId,
      useConvertor: state.oacxUseConvertor ?? false,
    };

    if (authFlow === 'app') {
      resultBody.requestType = state.oacxRequestType ?? 'WEB2APP';
    }

    const resultPath =
      authFlow === 'qr'
        ? '/oacx/api/v1.0/authen/qr/result'
        : '/oacx/api/v1.0/authen/app/result';
    const result = await this.postOacx<OacxResultResponse>(resultPath, resultBody);
    this.assertOacxSuccess(result, 'OMNIONE_AUTH_RESULT_FAILED');

    if (result.data?.verified === false) {
      throw new BadRequestException({
        code: 'OMNIONE_VC_NOT_VERIFIED',
        message: 'OmniOne result indicates VC verification failed.',
      });
    }

    if (!result.token) {
      throw new BadGatewayException({
        code: 'OMNIONE_AUTH_RESULT_INVALID_RESPONSE',
        message: 'OmniOne auth result response did not include result token.',
      });
    }

    const parsed = await this.postOacx<OacxTokenParseResponse>(
      '/oacx/api/v1.0/trans/token',
      { token: result.token },
    );
    this.assertOacxSuccess(parsed, 'OMNIONE_TOKEN_PARSE_FAILED');

    if (!parsed.data) {
      throw new BadGatewayException({
        code: 'OMNIONE_TOKEN_PARSE_INVALID_RESPONSE',
        message: 'OmniOne token parse response did not include data.',
      });
    }

    return this.toAuthResult(parsed.data, {
      result,
      parsed,
      authRequestId: input.authRequestId,
    });
  }

  private toAuthResult(
    data: Record<string, unknown>,
    raw: Record<string, unknown>,
  ): AuthResult {
    const providerUserId = this.stringValue(data.ci) ||
      this.stringValue(data.userDid) ||
      this.stringValue(data.vcId) ||
      this.stringValue(data.cxid) ||
      this.stringValue(data.txid);

    if (!providerUserId) {
      throw new BadGatewayException({
        code: 'OMNIONE_PROVIDER_USER_ID_MISSING',
        message:
          'Parsed OmniOne token did not include ci, userDid, vcId, cxid, or txid.',
      });
    }

    const birthDate = this.normalizeBirthDate(this.stringValue(data.birth));

    return {
      provider: 'omnione_cx',
      providerUserId,
      name: this.stringValue(data.name),
      phone: this.stringValue(data.telno),
      birthDate,
      isAdult: this.resolveIsAdult(data, birthDate),
      verifiedAt: new Date().toISOString(),
      raw,
    };
  }

  private requireProviderState(
    providerState: MobileIdProviderState | undefined,
  ): Required<
    Pick<
      MobileIdProviderState,
      'oacxToken' | 'oacxTxId' | 'oacxCxId' | 'oacxProvider' | 'oacxAuthFlow'
    >
  > &
    MobileIdProviderState {
    if (
      !providerState?.oacxToken ||
      !providerState.oacxTxId ||
      !providerState.oacxCxId ||
      !providerState.oacxProvider ||
      !providerState.oacxAuthFlow
    ) {
      throw new BadRequestException({
        code: 'OMNIONE_AUTH_STATE_REQUIRED',
        message: 'OmniOne auth request state is missing.',
      });
    }

    if (
      providerState.oacxAuthFlow !== 'app' &&
      providerState.oacxAuthFlow !== 'qr'
    ) {
      throw new BadRequestException({
        code: 'INVALID_OMNIONE_AUTH_FLOW',
        message: 'Stored OmniOne auth flow must be app or qr.',
      });
    }

    return providerState as Required<
      Pick<
        MobileIdProviderState,
        'oacxToken' | 'oacxTxId' | 'oacxCxId' | 'oacxProvider' | 'oacxAuthFlow'
      >
    > &
      MobileIdProviderState;
  }

  private async postOacx<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.requestOacx<T>('POST', path, body);
  }

  private async requestOacx<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const baseUrl = this.getRequiredConfig('OMNIONE_CX_BASE_URL');
    const url = new URL(path, this.withTrailingSlash(baseUrl));
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;

    return new Promise<T>((resolve, reject) => {
      const request = transport(
        url,
        {
          method,
          headers: {
            Accept: 'application/json',
            ...(payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload).toString(),
                }
              : {}),
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            let parsed: unknown;
            try {
              parsed = text ? JSON.parse(text) : {};
            } catch {
              reject(
                new BadGatewayException({
                  code: 'OMNIONE_INVALID_JSON_RESPONSE',
                  message: 'OmniOne response was not valid JSON.',
                  statusCode: response.statusCode,
                }),
              );
              return;
            }

            if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
              reject(
                new BadGatewayException({
                  code: 'OMNIONE_HTTP_ERROR',
                  message: 'OmniOne server returned an HTTP error.',
                  statusCode: response.statusCode,
                  response: parsed,
                }),
              );
              return;
            }

            resolve(parsed as T);
          });
        },
      );

      request.on('error', (error) => {
        reject(
          new BadGatewayException({
            code: 'OMNIONE_REQUEST_FAILED',
            message: error.message,
          }),
        );
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(
          new ServiceUnavailableException({
            code: 'OMNIONE_REQUEST_TIMEOUT',
            message: 'OmniOne request timed out.',
          }),
        );
      });

      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }

  private assertOacxSuccess(
    response: {
      oacxCode?: string;
      resultCode?: string | number;
      clientMessage?: string;
    },
    code: string,
  ) {
    const resultCode = String(response.resultCode ?? '');
    if (
      response.oacxCode &&
      response.oacxCode !== 'OACX_SUCCESS' &&
      resultCode !== '200'
    ) {
      throw new BadGatewayException({
        code,
        oacxCode: response.oacxCode,
        resultCode: response.resultCode,
        message: response.clientMessage ?? 'OmniOne OACX request failed.',
      });
    }

    if (resultCode && resultCode !== '200') {
      throw new BadGatewayException({
        code,
        oacxCode: response.oacxCode,
        resultCode: response.resultCode,
        message: response.clientMessage ?? 'OmniOne OACX request failed.',
      });
    }
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException({
        code: 'OMNIONE_CONFIG_REQUIRED',
        message: `${key} is required to use OmniOne CX provider.`,
      });
    }
    return value;
  }

  private optionString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private optionBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private normalizeBirthDate(birth: string | undefined): string | undefined {
    if (!birth) {
      return undefined;
    }

    const digits = birth.replace(/\D/g, '');
    if (digits.length !== 8) {
      return birth;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  private resolveIsAdult(
    data: Record<string, unknown>,
    birthDate: string | undefined,
  ): boolean | undefined {
    const directAdultValue =
      data.isAdult ?? data.adult ?? data.AdultVerify ?? data.adultVerify;

    if (typeof directAdultValue === 'boolean') {
      return directAdultValue;
    }

    if (typeof directAdultValue === 'string') {
      const normalized = directAdultValue.toLowerCase();
      if (['true', 'y', 'yes', '1', 'adult'].includes(normalized)) {
        return true;
      }
      if (['false', 'n', 'no', '0'].includes(normalized)) {
        return false;
      }
    }

    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return undefined;
    }

    const [year, month, day] = birthDate.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hasHadBirthday) {
      age -= 1;
    }

    return age >= 19;
  }

  private withTrailingSlash(value: string): string {
    return value.endsWith('/') ? value : `${value}/`;
  }
}
