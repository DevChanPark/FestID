import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtUser } from '../../common/types/jwt-user.type';
import { AdminAccessService } from '../admin-access.service';

type RequestWithUser = Request & { user?: JwtUser };

@Injectable()
export class AdminCredentialGuard implements CanActivate {
  constructor(private readonly adminAccessService: AdminAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'AUTH_REQUIRED',
        message: 'Admin credential check requires an authenticated user.',
      });
    }

    if (
      (await this.adminAccessService.isSeedAdmin(user)) ||
      (await this.adminAccessService.hasAdminCredential(user.sub))
    ) {
      return true;
    }

    throw new ForbiddenException({
      code: 'ADMIN_CREDENTIAL_REQUIRED',
      message: 'Issued Admin VC is required.',
    });
  }
}
