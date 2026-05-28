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
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly adminAccessService: AdminAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'AUTH_REQUIRED',
        message: 'Super admin check requires an authenticated user.',
      });
    }

    if (await this.adminAccessService.isSuperAdmin(user)) {
      return true;
    }

    throw new ForbiddenException({
      code: 'SUPER_ADMIN_REQUIRED',
      message: 'Seed admin or super_admin Admin VC is required.',
    });
  }
}
