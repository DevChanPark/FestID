import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { OpenDidConfigService } from './opendid.config';

@Injectable()
export class OpenDidHttpService {
  constructor(private readonly openDidConfigService: OpenDidConfigService) {}

  post<T>(
    baseUrl: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>('POST', baseUrl, path, body);
  }

  get<T>(
    baseUrl: string,
    path: string,
    query?: Record<string, string | undefined>,
  ): Promise<T> {
    return this.request<T>('GET', baseUrl, path, undefined, query);
  }

  private request<T>(
    method: 'GET' | 'POST',
    baseUrl: string,
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | undefined>,
  ): Promise<T> {
    const url = new URL(path, this.withTrailingSlash(baseUrl));
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
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
            ...(this.openDidConfigService.apiToken
              ? { Authorization: `Bearer ${this.openDidConfigService.apiToken}` }
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
                  code: 'OPENDID_INVALID_JSON_RESPONSE',
                  message: 'OpenDID response was not valid JSON.',
                  statusCode: response.statusCode,
                }),
              );
              return;
            }

            if (
              !response.statusCode ||
              response.statusCode < 200 ||
              response.statusCode >= 300
            ) {
              reject(
                new BadGatewayException({
                  code: 'OPENDID_HTTP_ERROR',
                  message: 'OpenDID server returned an HTTP error.',
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
            code: 'OPENDID_REQUEST_FAILED',
            message: error.message,
          }),
        );
      });

      request.setTimeout(this.openDidConfigService.requestTimeoutMs, () => {
        request.destroy();
        reject(
          new ServiceUnavailableException({
            code: 'OPENDID_REQUEST_TIMEOUT',
            message: 'OpenDID request timed out.',
          }),
        );
      });

      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }

  private withTrailingSlash(value: string): string {
    return value.endsWith('/') ? value : `${value}/`;
  }
}
