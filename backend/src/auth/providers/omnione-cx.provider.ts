import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
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
  private readonly logger = new Logger(OmniOneCxProvider.name);

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
    const isBirth =
      this.optionBoolean(input.options?.isBirth) ??
      this.configService.get<string>('OMNIONE_CX_IS_BIRTH') !== 'false';
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
      contentInfo: { signType, isBirth },
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
        isBirth,
        oacxStatus: authRequest.oacxStatus,
        clientMessage: authRequest.clientMessage,
        data: authRequest.data,
      },
      providerState,
    };
  }

  async verify(input: VerifyMobileIdAuthInput): Promise<AuthResult> {
    const callbackTokens = this.extractCallbackTokens(input.result);
    if (callbackTokens.length > 0) {
      this.logger.log(
        `OmniOne callback token candidates: ${JSON.stringify(
          this.summarizeCallbackResult(input.result),
        )}`,
      );

      let lastError: unknown;
      for (const callbackToken of callbackTokens) {
        try {
          return await this.parseResultToken(callbackToken, {
            callbackResult: input.result,
            authRequestId: input.authRequestId,
            source: 'oacx_module_callback',
          });
        } catch (error) {
          lastError = error;
          this.logger.warn(
            `OmniOne callback token candidate failed: ${this.toErrorSummary(error)}`,
          );
        }
      }

      this.logger.warn(
        `No OmniOne callback token candidate could be parsed. Last error: ${this.toErrorSummary(
          lastError,
        )}`,
      );
    }

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

    return this.parseResultToken(result.token, {
      result,
      authRequestId: input.authRequestId,
    });
  }

  private async parseResultToken(
    token: string,
    raw: Record<string, unknown>,
  ): Promise<AuthResult> {
    let parsed: OacxTokenParseResponse;
    try {
      parsed = await this.parseOacxToken(token);
    } catch (error) {
      const fallbackResult = this.tryCreateAuthResultFromCallbackJwt(token, raw, error);
      if (fallbackResult) {
        return fallbackResult;
      }

      throw error;
    }

    if (!parsed.data) {
      throw new BadGatewayException({
        code: 'OMNIONE_TOKEN_PARSE_INVALID_RESPONSE',
        message: 'OmniOne token parse response did not include data.',
      });
    }

    return this.toAuthResult(parsed.data, {
      ...raw,
      parsed,
    });
  }

  private async parseOacxToken(token: string): Promise<OacxTokenParseResponse> {
    const attempts = [() => this.postOacxToken(token), () => this.getOacxToken(token)];
    let firstError: unknown;

    for (const attempt of attempts) {
      try {
        const parsed = await attempt();
        this.assertOacxSuccess(parsed, 'OMNIONE_TOKEN_PARSE_FAILED');
        return parsed;
      } catch (error) {
        firstError ??= error;
      }
    }

    throw firstError;
  }

  private postOacxToken(token: string): Promise<OacxTokenParseResponse> {
    return this.postOacx<OacxTokenParseResponse>('/oacx/api/v1.0/trans/token', {
      token,
    });
  }

  private getOacxToken(token: string): Promise<OacxTokenParseResponse> {
    return this.getOacx<OacxTokenParseResponse>(
      `/oacx/api/v1.0/trans?token=${encodeURIComponent(token)}`,
    );
  }

  private toAuthResult(
    data: Record<string, unknown>,
    raw: Record<string, unknown>,
  ): AuthResult {
    const providerUserId =
      this.findString(data, [
        'ci',
        'CI',
        'userDid',
        'holderDid',
        'subjectDid',
        'did',
        'vcId',
        'vcid',
        'cxid',
        'cxId',
        'txid',
        'txId',
        'sub',
        'id',
      ]) || this.stringValue(raw.providerUserIdFallback);

    if (!providerUserId) {
      throw new BadGatewayException({
        code: 'OMNIONE_PROVIDER_USER_ID_MISSING',
        message:
          'Parsed OmniOne token did not include ci, userDid, vcId, cxid, or txid.',
      });
    }

    const birthDate = this.normalizeBirthDate(
      this.findString(data, [
        'birth',
        'birthDate',
        'birthday',
        'dateOfBirth',
        'birthDay',
        '생년월일',
      ]),
    );

    return {
      provider: 'omnione_cx',
      providerUserId,
      name: this.findString(data, ['name', 'userName', 'username', '성명', '이름']),
      phone: this.findString(data, [
        'telno',
        'phone',
        'phoneNumber',
        'mobile',
        'mobileNo',
        '휴대폰번호',
      ]),
      birthDate,
      isAdult: this.resolveIsAdult(data, birthDate),
      verifiedAt: new Date().toISOString(),
      raw,
    };
  }

  private tryCreateAuthResultFromCallbackJwt(
    token: string,
    raw: Record<string, unknown>,
    parseError: unknown,
  ): AuthResult | undefined {
    if (
      raw.source !== 'oacx_module_callback' ||
      !this.isCallbackJwtFallbackAllowed()
    ) {
      return undefined;
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return undefined;
    }

    const tokenHash = this.sha256(token);
    this.logger.warn(
      `Using local OmniOne callback JWT payload fallback. tokenHash=${tokenHash}, tokenParseError=${this.toErrorSummary(
        parseError,
      )}, payloadSummary=${JSON.stringify(this.summarizeCallbackResult(payload))}`,
    );

    return this.toAuthResult(payload, {
      authRequestId: raw.authRequestId,
      source: 'oacx_module_callback_jwt_payload_fallback',
      providerUserIdFallback: `callback-jwt:${tokenHash}`,
      tokenHash,
      tokenParseError: this.toErrorSummary(parseError),
      payloadSummary: this.summarizeCallbackResult(payload),
    });
  }

  private isCallbackJwtFallbackAllowed(): boolean {
    const configured = this.configService.get<string>(
      'OMNIONE_CX_CALLBACK_JWT_FALLBACK_ENABLED',
    );
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (configured) {
      return configured === 'true' && nodeEnv !== 'production';
    }

    return nodeEnv !== 'production';
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | undefined {
    const [, payload] = token.split('.');
    if (!payload || token.split('.').length !== 3) {
      return undefined;
    }

    try {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
        '=',
      );
      const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf8'));
      return this.isRecord(decoded) ? decoded : undefined;
    } catch (error) {
      this.logger.warn(`Failed to decode OmniOne callback JWT: ${this.toErrorSummary(error)}`);
      return undefined;
    }
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

  private async getOacx<T>(path: string): Promise<T> {
    return this.requestOacx<T>('GET', path);
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

  private extractCallbackTokens(result: unknown): string[] {
    const candidates: string[] = [];
    this.collectCallbackTokens(result, candidates);

    const uniqueCandidates = Array.from(new Set(candidates));
    return uniqueCandidates.sort((left, right) => {
      const leftScore = this.tokenScore(left);
      const rightScore = this.tokenScore(right);
      return rightScore - leftScore;
    });
  }

  private collectCallbackTokens(value: unknown, candidates: string[], depth = 0) {
    if (depth > 4) {
      return;
    }

    if (typeof value === 'string' && value.trim()) {
      candidates.push(value.trim());
      return;
    }

    if (!this.isRecord(value)) {
      return;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      if (this.isTokenCandidateKey(key) && typeof nestedValue === 'string') {
        candidates.push(nestedValue.trim());
        continue;
      }

      if (this.isRecord(nestedValue)) {
        this.collectCallbackTokens(nestedValue, candidates, depth + 1);
      }
    }
  }

  private isTokenCandidateKey(key: string): boolean {
    return [
      'token',
      'resultToken',
      'authToken',
      'jwt',
      'vp',
      'eVP',
      'evp',
      'jws',
      'idToken',
      'accessToken',
    ].includes(key);
  }

  private tokenScore(token: string): number {
    const periodCount = (token.match(/\./g) ?? []).length;
    if (periodCount === 2) {
      return 100;
    }
    if (token.length > 100) {
      return 50;
    }
    return token.length > 0 ? 1 : 0;
  }

  private summarizeCallbackResult(value: unknown, depth = 0): unknown {
    if (depth > 3) {
      return '[max-depth]';
    }

    if (typeof value === 'string') {
      return {
        type: 'string',
        length: value.length,
        jwtLike: this.tokenScore(value) >= 100,
      };
    }

    if (Array.isArray(value)) {
      return {
        type: 'array',
        length: value.length,
      };
    }

    if (!this.isRecord(value)) {
      return { type: typeof value };
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        this.summarizeCallbackResult(nestedValue, depth + 1),
      ]),
    );
  }

  private toErrorSummary(error: unknown): string {
    if (error instanceof HttpException) {
      try {
        return JSON.stringify(error.getResponse());
      } catch {
        return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    const directAdultValue = this.findValue(data, [
      'isAdult',
      'adult',
      'AdultVerify',
      'adultVerify',
      '성인여부',
    ]);

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

  private findString(
    value: unknown,
    targetKeys: string[],
    depth = 0,
  ): string | undefined {
    const found = this.findValue(value, targetKeys, depth);
    return this.stringValue(found);
  }

  private findValue(
    value: unknown,
    targetKeys: string[],
    depth = 0,
  ): unknown {
    if (depth > 8) {
      return undefined;
    }

    if (!this.isRecord(value)) {
      return undefined;
    }

    for (const key of targetKeys) {
      if (value[key] !== undefined && value[key] !== null) {
        return value[key];
      }
    }

    for (const nestedValue of Object.values(value)) {
      if (this.isRecord(nestedValue)) {
        const found = this.findValue(nestedValue, targetKeys, depth + 1);
        if (found !== undefined && found !== null) {
          return found;
        }
      }

      if (Array.isArray(nestedValue)) {
        for (const item of nestedValue) {
          const found = this.findValue(item, targetKeys, depth + 1);
          if (found !== undefined && found !== null) {
            return found;
          }
        }
      }
    }

    return undefined;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
