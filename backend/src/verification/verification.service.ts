import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtUser } from '../common/types/jwt-user.type';
import { PrismaService } from '../database/prisma.service';
import { OpenDidCredentialProvider } from '../opendid/opendid-credential.provider';
import { STAFF_SCOPES, StaffScope } from '../staff/dto/create-staff-invite.dto';
import { CompleteVerificationDto } from './dto/complete-verification.dto';
import { ScanPurposeValue, VerifyQrDto } from './dto/verify-qr.dto';

type VerificationResultValue =
  | 'allowed'
  | 'denied'
  | 'expired'
  | 'already_used'
  | 'missing_credential'
  | 'invalid_qr'
  | 'missing_staff_scope';

type CredentialTypeValue = 'entry' | 'student' | 'adult' | 'staff';
type RequiredPermissionValue = 'none' | CredentialTypeValue;
type UsageTypeValue =
  | 'entry'
  | 'benefit'
  | 'event'
  | 'adult_check'
  | 'student_check';

type StaffCredentialClaims = {
  role?: unknown;
  scope?: unknown;
  canScanQr?: unknown;
};

type BoothForVerification = {
  id: string;
  festivalId: string;
  requiredPermission: RequiredPermissionValue;
  benefitPolicy:
    | 'none'
    | 'once_per_user'
    | 'once_per_day'
    | 'student_once'
    | 'adult_once';
};

type VerificationContext = {
  qrTokenId: string;
  targetUserId: string;
  booth: BoothForVerification | null;
  verifiedClaims: {
    entry: boolean;
    student: boolean;
    adult: boolean;
    staff: boolean;
  };
};

const SCAN_PURPOSE_TO_SCOPE: Record<ScanPurposeValue, StaffScope> = {
  entry: 'entry_scan',
  benefit: 'benefit_check',
  event: 'event_check',
  adult_check: 'adult_check',
  student_check: 'student_check',
};

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openDidCredentialProvider: OpenDidCredentialProvider,
  ) {}

  async verifyQr(staff: JwtUser, dto: VerifyQrDto) {
    await this.ensureFestivalExists(dto.festivalId);

    const staffCredential = await this.findStaffCredential(staff.sub, dto.festivalId);
    if (!staffCredential) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        boothId: dto.boothId,
        scanPurpose: dto.scanPurpose,
        result: 'denied',
        reason: 'STAFF_CREDENTIAL_REQUIRED',
      });
      return this.toVerificationResponse(scanLog.id, 'denied', {
        displayMessage: '스태프 권한이 없습니다.',
      });
    }

    const staffScopeResult = this.hasRequiredStaffScope(
      staffCredential.claimsJson,
      dto.scanPurpose,
    );
    if (!staffScopeResult.allowed) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        boothId: dto.boothId,
        scanPurpose: dto.scanPurpose,
        result: 'missing_staff_scope',
        reason: `REQUIRED_SCOPE:${staffScopeResult.requiredScope}`,
      });
      return this.toVerificationResponse(scanLog.id, 'missing_staff_scope', {
        displayMessage: '스태프 권한 범위에 없는 작업입니다.',
      });
    }

    const qrToken = await this.prisma.qrToken.findUnique({
      where: { token: dto.token },
    });

    if (!qrToken || qrToken.festivalId !== dto.festivalId) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        boothId: dto.boothId,
        scanPurpose: dto.scanPurpose,
        result: 'invalid_qr',
        reason: 'QR_TOKEN_NOT_FOUND',
      });
      return this.toVerificationResponse(scanLog.id, 'invalid_qr', {
        displayMessage: '유효하지 않은 QR입니다.',
      });
    }

    if (qrToken.purpose !== dto.scanPurpose) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        userId: qrToken.userId,
        boothId: dto.boothId,
        qrTokenId: qrToken.id,
        scanPurpose: dto.scanPurpose,
        result: 'invalid_qr',
        reason: 'QR_PURPOSE_MISMATCH',
      });
      return this.toVerificationResponse(scanLog.id, 'invalid_qr', {
        displayMessage: 'QR 목적과 스캔 목적이 일치하지 않습니다.',
      });
    }

    if (qrToken.usedAt) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        userId: qrToken.userId,
        boothId: dto.boothId,
        qrTokenId: qrToken.id,
        scanPurpose: dto.scanPurpose,
        result: 'already_used',
        reason: 'QR_TOKEN_ALREADY_USED',
      });
      return this.toVerificationResponse(scanLog.id, 'already_used', {
        displayMessage: '이미 사용된 QR입니다.',
      });
    }

    if (qrToken.expiresAt.getTime() <= Date.now()) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        userId: qrToken.userId,
        boothId: dto.boothId,
        qrTokenId: qrToken.id,
        scanPurpose: dto.scanPurpose,
        result: 'expired',
        reason: 'QR_TOKEN_EXPIRED',
      });
      return this.toVerificationResponse(scanLog.id, 'expired', {
        displayMessage: '만료된 QR입니다.',
      });
    }

    const context = await this.buildVerificationContext(dto, qrToken);
    const credentialResult = await this.checkTargetCredentials(
      qrToken.userId,
      dto.festivalId,
      dto.scanPurpose,
      context.booth,
    );

    if (!credentialResult.allowed) {
      const scanLog = await this.createScanLog({
        festivalId: dto.festivalId,
        staffId: staff.sub,
        userId: qrToken.userId,
        boothId: context.booth?.id,
        qrTokenId: qrToken.id,
        scanPurpose: dto.scanPurpose,
        result: 'missing_credential',
        reason: `MISSING_CREDENTIAL:${credentialResult.missing.join(',')}`,
      });
      return this.toVerificationResponse(scanLog.id, 'missing_credential', {
        displayMessage: '필요한 인증 정보가 없습니다.',
        verifiedClaims: context.verifiedClaims,
      });
    }

    const usagePlan = this.buildUsagePlan({
      festivalId: dto.festivalId,
      booth: context.booth,
      scanPurpose: dto.scanPurpose,
    });

    if (usagePlan.enforceDuplicate) {
      const alreadyUsed = await this.hasUsageRecord({
        festivalId: dto.festivalId,
        userId: qrToken.userId,
        usageType: usagePlan.usageType,
        usageKey: usagePlan.usageKey,
      });

      if (alreadyUsed) {
        const scanLog = await this.createScanLog({
          festivalId: dto.festivalId,
          staffId: staff.sub,
          userId: qrToken.userId,
          boothId: context.booth?.id,
          qrTokenId: qrToken.id,
          scanPurpose: dto.scanPurpose,
          result: 'already_used',
          reason: 'USAGE_ALREADY_RECORDED',
        });
        return this.toVerificationResponse(scanLog.id, 'already_used', {
          displayMessage: '이미 사용 처리된 항목입니다.',
          verifiedClaims: context.verifiedClaims,
        });
      }
    }

    const scanLog = await this.createScanLog({
      festivalId: dto.festivalId,
      staffId: staff.sub,
      userId: qrToken.userId,
      boothId: context.booth?.id,
      qrTokenId: qrToken.id,
      scanPurpose: dto.scanPurpose,
      result: 'allowed',
      reason: null,
    });

    return this.toVerificationResponse(scanLog.id, 'allowed', {
      displayMessage: this.allowedMessage(dto.scanPurpose),
      verifiedClaims: context.verifiedClaims,
      actionRequired: this.actionRequired(dto.scanPurpose),
    });
  }

  async complete(
    staff: JwtUser,
    scanPurpose: ScanPurposeValue,
    dto: CompleteVerificationDto,
  ) {
    const scanLog = await this.prisma.scanLog.findUnique({
      where: { id: dto.scanLogId },
      include: { qrToken: true },
    });

    if (!scanLog) {
      throw new NotFoundException({
        code: 'SCAN_LOG_NOT_FOUND',
        message: 'Scan log was not found.',
      });
    }

    if (scanLog.staffId !== staff.sub) {
      throw new BadRequestException({
        code: 'SCAN_LOG_STAFF_MISMATCH',
        message: 'Scan log does not belong to the authenticated staff.',
      });
    }

    if (scanLog.scanPurpose !== scanPurpose) {
      throw new BadRequestException({
        code: 'SCAN_PURPOSE_MISMATCH',
        message: 'Complete endpoint does not match scan purpose.',
      });
    }

    if (scanLog.result !== 'allowed' || !scanLog.userId || !scanLog.qrToken) {
      return this.toCompleteResponse('denied', {
        displayMessage: '허용된 QR 검증 기록이 아닙니다.',
      });
    }

    if (scanLog.createdAt.getTime() < Date.now() - 10 * 60 * 1000) {
      return this.toCompleteResponse('expired', {
        displayMessage: '검증 기록이 만료되었습니다. QR을 다시 스캔해 주세요.',
      });
    }

    const staffCredential = await this.findStaffCredential(
      staff.sub,
      scanLog.festivalId,
    );
    if (
      !staffCredential ||
      !this.hasRequiredStaffScope(staffCredential.claimsJson, scanPurpose).allowed
    ) {
      return this.toCompleteResponse('missing_staff_scope', {
        displayMessage: '스태프 권한 범위에 없는 작업입니다.',
      });
    }

    if (scanLog.qrToken.expiresAt.getTime() <= Date.now()) {
      return this.toCompleteResponse('expired', {
        displayMessage: 'QR이 만료되었습니다. 다시 스캔해 주세요.',
      });
    }

    if (scanLog.qrToken.usedAt) {
      return this.toCompleteResponse('already_used', {
        displayMessage: '이미 사용된 QR입니다.',
      });
    }

    const booth = scanLog.boothId
      ? await this.findBoothForVerification(scanLog.festivalId, scanLog.boothId)
      : null;

    const credentialResult = await this.checkTargetCredentials(
      scanLog.userId,
      scanLog.festivalId,
      scanPurpose,
      booth,
    );

    if (!credentialResult.allowed) {
      return this.toCompleteResponse('missing_credential', {
        displayMessage: '필요한 인증 정보가 없습니다.',
      });
    }

    const usagePlan = this.buildUsagePlan({
      festivalId: scanLog.festivalId,
      booth,
      scanPurpose,
      scanLogId: scanLog.id,
    });

    if (usagePlan.enforceDuplicate) {
      const alreadyUsed = await this.hasUsageRecord({
        festivalId: scanLog.festivalId,
        userId: scanLog.userId,
        usageType: usagePlan.usageType,
        usageKey: usagePlan.usageKey,
      });

      if (alreadyUsed) {
        return this.toCompleteResponse('already_used', {
          displayMessage: '이미 사용 처리된 항목입니다.',
        });
      }
    }

    try {
      const usageRecord = await this.prisma.usageRecord.create({
        data: {
          festivalId: scanLog.festivalId,
          boothId: booth?.id,
          userId: scanLog.userId,
          staffId: staff.sub,
          usageType: usagePlan.usageType,
          usageKey: usagePlan.usageKey,
        },
      });

      return {
        result: 'allowed',
        displayMessage: this.completeMessage(scanPurpose),
        usageRecord,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.toCompleteResponse('already_used', {
          displayMessage: '이미 사용 처리된 항목입니다.',
        });
      }

      throw error;
    }
  }

  private async buildVerificationContext(
    dto: VerifyQrDto,
    qrToken: { id: string; userId: string; festivalId: string },
  ): Promise<VerificationContext> {
    const booth = dto.boothId
      ? await this.findBoothForVerification(dto.festivalId, dto.boothId)
      : null;

    if (this.requiresBooth(dto.scanPurpose) && !booth) {
      throw new BadRequestException({
        code: 'BOOTH_ID_REQUIRED',
        message: `${dto.scanPurpose} scan requires boothId.`,
      });
    }

    const credentials = await this.getCredentialSet(qrToken.userId, qrToken.festivalId);

    return {
      qrTokenId: qrToken.id,
      targetUserId: qrToken.userId,
      booth,
      verifiedClaims: {
        entry: credentials.has('entry'),
        student: credentials.has('student'),
        adult: credentials.has('adult'),
        staff: credentials.has('staff'),
      },
    };
  }

  private async checkTargetCredentials(
    userId: string,
    festivalId: string,
    scanPurpose: ScanPurposeValue,
    booth: BoothForVerification | null,
  ): Promise<{ allowed: boolean; missing: CredentialTypeValue[] }> {
    const credentials = await this.getCredentialSet(userId, festivalId);
    const required = new Set<CredentialTypeValue>();

    this.baseRequiredCredentials(scanPurpose).forEach((credential) =>
      required.add(credential),
    );

    if (booth && booth.requiredPermission !== 'none') {
      required.add(booth.requiredPermission);
    }

    const missing = [...required].filter((credential) => !credentials.has(credential));
    return { allowed: missing.length === 0, missing };
  }

  private async getCredentialSet(userId: string, festivalId: string) {
    const credentials = await this.prisma.credential.findMany({
      where: {
        userId,
        festivalId,
        type: { in: ['entry', 'student', 'adult', 'staff'] },
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        type: true,
        credentialProvider: true,
        externalCredentialId: true,
        credentialStatusId: true,
        vcJwt: true,
      },
    });

    const validCredentials = await Promise.all(
      credentials.map(async (credential) => {
        if (credential.credentialProvider !== 'opendid') {
          return credential.type;
        }

        const status =
          await this.openDidCredentialProvider.verifyCredentialStatus({
            credentialId: credential.externalCredentialId,
            credentialStatusId: credential.credentialStatusId,
            vcJwt: credential.vcJwt,
          });
        if (!status || status.valid) {
          return credential.type;
        }

        return null;
      }),
    );

    return new Set(validCredentials.filter(this.isCredentialType));
  }

  private async findStaffCredential(staffId: string, festivalId: string) {
    return this.prisma.credential.findFirst({
      where: {
        userId: staffId,
        festivalId,
        type: 'staff',
        status: 'issued',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private hasRequiredStaffScope(
    claimsJson: Prisma.JsonValue,
    scanPurpose: ScanPurposeValue,
  ) {
    const requiredScope = SCAN_PURPOSE_TO_SCOPE[scanPurpose];
    const claims = claimsJson as Prisma.JsonObject;
    const parsedClaims = claims as StaffCredentialClaims;
    const scope = Array.isArray(parsedClaims.scope)
      ? parsedClaims.scope.filter(this.isStaffScope)
      : [];

    return {
      allowed:
        parsedClaims.canScanQr === true && scope.includes(requiredScope),
      requiredScope,
    };
  }

  private async findBoothForVerification(festivalId: string, boothId: string) {
    const booth = await this.prisma.booth.findUnique({
      where: { id: boothId },
      select: {
        id: true,
        festivalId: true,
        requiredPermission: true,
        benefitPolicy: true,
      },
    });

    if (!booth || booth.festivalId !== festivalId) {
      throw new NotFoundException({
        code: 'BOOTH_NOT_FOUND',
        message: 'Booth was not found in this festival.',
      });
    }

    return booth;
  }

  private async ensureFestivalExists(festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: { id: festivalId },
      select: { id: true },
    });

    if (!festival) {
      throw new NotFoundException({
        code: 'FESTIVAL_NOT_FOUND',
        message: 'Festival was not found.',
      });
    }
  }

  private async hasUsageRecord(input: {
    festivalId: string;
    userId: string;
    usageType: UsageTypeValue;
    usageKey: string;
  }) {
    const usageRecord = await this.prisma.usageRecord.findUnique({
      where: {
        festivalId_userId_usageType_usageKey: {
          festivalId: input.festivalId,
          userId: input.userId,
          usageType: input.usageType,
          usageKey: input.usageKey,
        },
      },
    });

    return Boolean(usageRecord);
  }

  private buildUsagePlan(input: {
    festivalId: string;
    booth: BoothForVerification | null;
    scanPurpose: ScanPurposeValue;
    scanLogId?: string;
  }) {
    const usageType = input.scanPurpose;
    const boothId = input.booth?.id;

    if (usageType === 'entry') {
      return {
        usageType,
        usageKey: `${input.festivalId}:entry`,
        enforceDuplicate: true,
      };
    }

    if (!boothId) {
      throw new BadRequestException({
        code: 'BOOTH_ID_REQUIRED',
        message: `${usageType} usage requires boothId.`,
      });
    }

    if (usageType === 'benefit') {
      const policy = input.booth?.benefitPolicy ?? 'none';
      if (policy === 'none') {
        return {
          usageType,
          usageKey: `${input.festivalId}:booth:${boothId}:benefit:scan:${this.requireScanLogId(input.scanLogId)}`,
          enforceDuplicate: false,
        };
      }

      const dateSuffix =
        policy === 'once_per_day' ? `:${this.todayKstDateKey()}` : '';
      return {
        usageType,
        usageKey: `${input.festivalId}:booth:${boothId}:benefit${dateSuffix}`,
        enforceDuplicate: true,
      };
    }

    if (usageType === 'event') {
      return {
        usageType,
        usageKey: `${input.festivalId}:booth:${boothId}:event`,
        enforceDuplicate: true,
      };
    }

    return {
      usageType,
      usageKey: `${input.festivalId}:booth:${boothId}:${usageType}:scan:${this.requireScanLogId(input.scanLogId)}`,
      enforceDuplicate: false,
    };
  }

  private baseRequiredCredentials(
    scanPurpose: ScanPurposeValue,
  ): CredentialTypeValue[] {
    switch (scanPurpose) {
      case 'adult_check':
        return ['adult'];
      case 'student_check':
        return ['student'];
      case 'entry':
      case 'benefit':
      case 'event':
        return ['entry'];
    }
  }

  private requiresBooth(scanPurpose: ScanPurposeValue) {
    return scanPurpose !== 'entry';
  }

  private createScanLog(input: {
    festivalId: string;
    staffId?: string;
    userId?: string;
    boothId?: string | null;
    qrTokenId?: string;
    scanPurpose: ScanPurposeValue;
    result: VerificationResultValue;
    reason?: string | null;
  }) {
    return this.prisma.scanLog.create({
      data: {
        festivalId: input.festivalId,
        staffId: input.staffId,
        userId: input.userId,
        boothId: input.boothId,
        qrTokenId: input.qrTokenId,
        scanPurpose: input.scanPurpose,
        result: input.result,
        reason: input.reason,
      },
    });
  }

  private toVerificationResponse(
    scanLogId: string,
    result: VerificationResultValue,
    input?: {
      displayMessage?: string;
      verifiedClaims?: {
        entry: boolean;
        student: boolean;
        adult: boolean;
        staff: boolean;
      };
      actionRequired?: string;
    },
  ) {
    return {
      scanLogId,
      result,
      displayMessage: input?.displayMessage ?? this.defaultMessage(result),
      verifiedClaims: input?.verifiedClaims,
      actionRequired: input?.actionRequired ?? 'none',
    };
  }

  private toCompleteResponse(
    result: VerificationResultValue,
    input?: { displayMessage?: string },
  ) {
    return {
      result,
      displayMessage: input?.displayMessage ?? this.defaultMessage(result),
    };
  }

  private actionRequired(scanPurpose: ScanPurposeValue) {
    switch (scanPurpose) {
      case 'entry':
        return 'complete_entry';
      case 'benefit':
        return 'complete_benefit';
      case 'event':
        return 'complete_event';
      case 'adult_check':
        return 'complete_adult_check';
      case 'student_check':
        return 'complete_student_check';
    }
  }

  private allowedMessage(scanPurpose: ScanPurposeValue) {
    switch (scanPurpose) {
      case 'entry':
        return '입장 가능';
      case 'benefit':
        return '혜택 지급 가능';
      case 'event':
        return '이벤트 참여 가능';
      case 'adult_check':
        return '성인 인증 완료';
      case 'student_check':
        return '재학생 인증 완료';
    }
  }

  private completeMessage(scanPurpose: ScanPurposeValue) {
    switch (scanPurpose) {
      case 'entry':
        return '입장 완료 처리되었습니다.';
      case 'benefit':
        return '혜택 지급 완료 처리되었습니다.';
      case 'event':
        return '이벤트 참여 완료 처리되었습니다.';
      case 'adult_check':
        return '성인 확인 기록이 저장되었습니다.';
      case 'student_check':
        return '재학생 확인 기록이 저장되었습니다.';
    }
  }

  private defaultMessage(result: VerificationResultValue) {
    switch (result) {
      case 'allowed':
        return '검증되었습니다.';
      case 'denied':
        return '검증이 거부되었습니다.';
      case 'expired':
        return '만료되었습니다.';
      case 'already_used':
        return '이미 사용되었습니다.';
      case 'missing_credential':
        return '필요한 인증 정보가 없습니다.';
      case 'invalid_qr':
        return '유효하지 않은 QR입니다.';
      case 'missing_staff_scope':
        return '스태프 권한 범위에 없는 작업입니다.';
    }
  }

  private isStaffScope(value: unknown): value is StaffScope {
    return typeof value === 'string' && STAFF_SCOPES.includes(value as StaffScope);
  }

  private isCredentialType(value: unknown): value is CredentialTypeValue {
    return (
      value === 'entry' ||
      value === 'student' ||
      value === 'adult' ||
      value === 'staff'
    );
  }

  private requireScanLogId(scanLogId?: string) {
    if (!scanLogId) {
      return 'pending';
    }

    return scanLogId;
  }

  private todayKstDateKey() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
}
