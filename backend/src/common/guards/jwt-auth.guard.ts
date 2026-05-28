import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtUser } from '../types/jwt-user.type';

type RequestWithUser = Request & { user?: JwtUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Bearer access token is required.',
      });
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: this.configService.get('JWT_SECRET') ?? 'local-development-secret',
      });
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Access token is invalid or expired.',
      });
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }
    const [scheme, token] = authorization.split(' ');
    return scheme === 'Bearer' ? token : undefined;
  }
}
