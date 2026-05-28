import { Global, Module } from '@nestjs/common';
import { AdminAccessService } from './admin-access.service';
import { AdminCredentialGuard } from './guards/admin-credential.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Global()
@Module({
  providers: [AdminAccessService, AdminCredentialGuard, SuperAdminGuard],
  exports: [AdminAccessService, AdminCredentialGuard, SuperAdminGuard],
})
export class AccessModule {}
