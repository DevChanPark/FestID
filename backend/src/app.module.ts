import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AccessModule } from './access/access.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BoothModule } from './booth/booth.module';
import { CredentialModule } from './credential/credential.module';
import { DatabaseModule } from './database/database.module';
import { DidModule } from './did/did.module';
import { FestivalModule } from './festival/festival.module';
import { OpenDidModule } from './opendid/opendid.module';
import { PassModule } from './pass/pass.module';
import { PassTemplateModule } from './pass-template/pass-template.module';
import { QrModule } from './qr/qr.module';
import { ReportModule } from './report/report.module';
import { StaffModule } from './staff/staff.module';
import { StudentVerificationModule } from './student-verification/student-verification.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') ?? 'local-development-secret',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') ?? '1h',
        },
      }),
    }),
    DatabaseModule,
    AccessModule,
    DidModule,
    OpenDidModule,
    UsersModule,
    AuthModule,
    CredentialModule,
    AdminModule,
    FestivalModule,
    BoothModule,
    PassModule,
    PassTemplateModule,
    StudentVerificationModule,
    StaffModule,
    QrModule,
    VerificationModule,
    ReportModule,
    UploadModule,
  ],
})
export class AppModule {}
