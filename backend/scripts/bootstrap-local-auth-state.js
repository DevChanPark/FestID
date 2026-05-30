const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

loadLocalEnv();

const prisma = new PrismaClient();

const jwtSecret = process.env.JWT_SECRET || 'local-development-secret';
const tokenTtlSeconds = Number(process.env.DEV_LOCAL_TOKEN_TTL_SECONDS || 7 * 24 * 60 * 60);
const festivalName = process.env.DEV_LOCAL_FESTIVAL_NAME || 'CamPass Local Festival';

async function main() {
  const admin = await upsertUser({
    providerUserId: process.env.DEV_LOCAL_ADMIN_PROVIDER_USER_ID || 'local-admin-mobile-id',
    name: process.env.DEV_LOCAL_ADMIN_NAME || '로컬 관리자',
    phone: process.env.DEV_LOCAL_ADMIN_PHONE || '01000000000',
    birthDate: process.env.DEV_LOCAL_ADMIN_BIRTH_DATE || '19900101',
    isAdult: true,
    did: process.env.DEV_LOCAL_ADMIN_DID || 'did:campass:user:local-admin',
  });

  const attendee = await upsertUser({
    providerUserId: process.env.DEV_LOCAL_ATTENDEE_PROVIDER_USER_ID || 'local-attendee-mobile-id',
    name: process.env.DEV_LOCAL_ATTENDEE_NAME || '로컬 참가자',
    phone: process.env.DEV_LOCAL_ATTENDEE_PHONE || '01011112222',
    birthDate: process.env.DEV_LOCAL_ATTENDEE_BIRTH_DATE || '19990101',
    isAdult: true,
    did: process.env.DEV_LOCAL_ATTENDEE_DID || 'did:campass:user:local-attendee',
  });

  const staff = await upsertUser({
    providerUserId: process.env.DEV_LOCAL_STAFF_PROVIDER_USER_ID || 'local-staff-mobile-id',
    name: process.env.DEV_LOCAL_STAFF_NAME || '로컬 스태프',
    phone: process.env.DEV_LOCAL_STAFF_PHONE || '01033334444',
    birthDate: process.env.DEV_LOCAL_STAFF_BIRTH_DATE || '19980101',
    isAdult: true,
    did: process.env.DEV_LOCAL_STAFF_DID || 'did:campass:user:local-staff',
  });

  await upsertApprovedAdminProfile(admin.id);
  await upsertCredential({
    userId: admin.id,
    subjectDid: requireDid(admin.did),
    issuerDid: 'did:campass:issuer:admin',
    type: 'admin',
    claimsJson: {
      permission: 'admin',
      role: 'super_admin',
      schoolName: '광운대학교',
      organizationName: 'CamPass Local',
      verified: true,
      source: 'local_bootstrap_after_mobile_id',
    },
  });

  const festival = await upsertFestival(admin.id);
  const booths = await upsertBooths(festival.id);
  await upsertPassTemplates(festival.id);

  await upsertCredential({
    userId: attendee.id,
    subjectDid: requireDid(attendee.did),
    issuerDid: `did:campass:issuer:${festival.id}`,
    festivalId: festival.id,
    type: 'entry',
    claimsJson: {
      permission: 'entry',
      festivalId: festival.id,
      verified: true,
      source: 'local_bootstrap_after_mobile_id',
    },
  });
  await upsertCredential({
    userId: attendee.id,
    subjectDid: requireDid(attendee.did),
    issuerDid: `did:campass:issuer:${festival.id}`,
    festivalId: festival.id,
    type: 'adult',
    claimsJson: {
      permission: 'adult',
      isAdult: true,
      verified: true,
      source: 'local_bootstrap_after_mobile_id',
    },
  });
  await upsertCredential({
    userId: attendee.id,
    subjectDid: requireDid(attendee.did),
    issuerDid: `did:campass:issuer:${festival.id}`,
    festivalId: festival.id,
    type: 'student',
    claimsJson: {
      permission: 'student',
      schoolName: '광운대학교',
      verified: true,
      source: 'local_bootstrap_after_mobile_id',
    },
  });

  const staffInvite = await upsertStaffInvite(festival.id, admin.id);
  await upsertStaffRequest({
    inviteId: staffInvite.id,
    festivalId: festival.id,
    userId: staff.id,
    requestedRole: 'gate_staff',
    maskedDid: maskDid(requireDid(staff.did)),
  });
  await upsertCredential({
    userId: staff.id,
    subjectDid: requireDid(staff.did),
    issuerDid: `did:campass:issuer:${festival.id}`,
    festivalId: festival.id,
    type: 'staff',
    claimsJson: {
      role: 'gate_staff',
      scope: ['entry_scan', 'benefit_check', 'adult_check', 'student_check', 'event_check'],
      canScanQr: true,
      verified: true,
      source: 'local_bootstrap_after_mobile_id',
    },
  });

  const qrToken = await upsertQrToken(attendee.id, festival.id);
  const tokens = {
    admin: signAccessToken(admin),
    attendee: signAccessToken(attendee),
    staff: signAccessToken(staff),
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        note:
          'Local-only post-mobile-ID state. This does not add a mock auth API and should not be used for production.',
        festival: {
          id: festival.id,
          name: festival.name,
        },
        booths: booths.map((booth) => ({
          id: booth.id,
          name: booth.name,
          requiredPermission: booth.requiredPermission,
          benefitPolicy: booth.benefitPolicy,
        })),
        users: {
          admin: publicUser(admin),
          attendee: publicUser(attendee),
          staff: publicUser(staff),
        },
        staffInvite: {
          inviteCode: staffInvite.inviteCode,
          role: staffInvite.role,
        },
        qrToken: {
          token: qrToken.token,
          purpose: qrToken.purpose,
          expiresAt: qrToken.expiresAt.toISOString(),
        },
        accessTokens: tokens,
        adminWebSnippet:
          `sessionStorage.setItem('campass.accessToken', '${tokens.admin}'); location.href = '/createFest';`,
        staffApiToken: tokens.staff,
        attendeeApiToken: tokens.attendee,
      },
      null,
      2,
    ),
  );
}

async function upsertUser(input) {
  return prisma.user.upsert({
    where: {
      provider_providerUserId: {
        provider: 'omnione_cx',
        providerUserId: input.providerUserId,
      },
    },
    create: {
      provider: 'omnione_cx',
      providerUserId: input.providerUserId,
      name: input.name,
      phone: input.phone,
      birthDate: input.birthDate,
      isAdult: input.isAdult,
      did: input.did,
      didMethod: 'campass',
    },
    update: {
      name: input.name,
      phone: input.phone,
      birthDate: input.birthDate,
      isAdult: input.isAdult,
      did: input.did,
      didMethod: 'campass',
    },
  });
}

async function upsertApprovedAdminProfile(userId) {
  return prisma.adminProfile.upsert({
    where: { userId },
    create: {
      userId,
      schoolName: '광운대학교',
      organizationName: 'CamPass Local',
      department: '해커톤팀',
      position: '운영 관리자',
      role: '서비스 테스트 관리자',
      proofStatus: 'approved',
      proofFileUrl: 'local://admin-proof',
    },
    update: {
      schoolName: '광운대학교',
      organizationName: 'CamPass Local',
      department: '해커톤팀',
      position: '운영 관리자',
      role: '서비스 테스트 관리자',
      proofStatus: 'approved',
      proofFileUrl: 'local://admin-proof',
    },
  });
}

async function upsertFestival(ownerId) {
  const data = {
    ownerId,
    name: festivalName,
    description: '로컬 웹/백엔드 연결 검증용 축제 데이터입니다.',
    schoolName: '광운대학교',
    startDate: new Date('2026-05-29T00:00:00.000Z'),
    endDate: new Date('2026-05-31T14:59:59.000Z'),
    location: '광운대학교 캠퍼스',
    operatingTime: '10:00-22:00',
    visibility: 'public',
    status: 'active',
  };
  const existing = await prisma.festival.findFirst({ where: { ownerId, name: festivalName } });
  if (existing) {
    return prisma.festival.update({ where: { id: existing.id }, data });
  }
  return prisma.festival.create({ data });
}

async function upsertPassTemplates(festivalId) {
  const templates = [
    ['entry', '축제 입장 패스', { required: ['mobile_id_verified'] }],
    ['adult', '성인 인증 패스', { required: ['isAdult'] }],
    ['student', '재학생 인증 패스', { approval: 'admin_review' }],
    ['staff', '스태프 권한 패스', { approval: 'staff_invite' }],
    ['admin', '관리자 권한 패스', { approval: 'super_admin_or_seed_admin' }],
  ];

  for (const [type, name, verificationRule] of templates) {
    await prisma.passTemplate.upsert({
      where: { festivalId_type: { festivalId, type } },
      create: { festivalId, type, name, enabled: true, verificationRule },
      update: { name, enabled: true, verificationRule },
    });
  }
}

async function upsertBooths(festivalId) {
  const booths = [
    {
      name: '정문 입장 게이트',
      description: 'Entry VC 기반 입장 처리 게이트입니다.',
      category: 'event',
      location: '정문',
      requiredPermission: 'entry',
      benefitPolicy: 'none',
    },
    {
      name: '재학생 굿즈 부스',
      description: 'Student VC 보유자에게 굿즈를 1회 지급합니다.',
      category: 'goods',
      location: '학생회관 앞',
      requiredPermission: 'student',
      benefitPolicy: 'student_once',
    },
    {
      name: '성인 인증 주류존',
      description: 'Adult VC 확인이 필요한 부스입니다.',
      category: 'alcohol',
      location: '운동장 서편',
      requiredPermission: 'adult',
      benefitPolicy: 'adult_once',
    },
  ];
  const results = [];

  for (const booth of booths) {
    const existing = await prisma.booth.findFirst({ where: { festivalId, name: booth.name } });
    const data = {
      festivalId,
      operatingStatus: 'open',
      currentWaitingCount: 0,
      ...booth,
    };
    results.push(
      existing
        ? await prisma.booth.update({ where: { id: existing.id }, data })
        : await prisma.booth.create({ data }),
    );
  }

  return results;
}

async function upsertCredential(input) {
  const existing = await prisma.credential.findFirst({
    where: {
      userId: input.userId,
      festivalId: input.festivalId ?? null,
      type: input.type,
      status: 'issued',
    },
    orderBy: { issuedAt: 'desc' },
  });
  const data = {
    userId: input.userId,
    subjectDid: input.subjectDid,
    issuerDid: input.issuerDid,
    festivalId: input.festivalId,
    type: input.type,
    status: 'issued',
    claimsJson: input.claimsJson,
    credentialProvider: 'internal',
    expiresAt: input.expiresAt,
  };

  if (existing) {
    return prisma.credential.update({ where: { id: existing.id }, data });
  }

  return prisma.credential.create({ data });
}

async function upsertStaffInvite(festivalId, createdBy) {
  const inviteCode = process.env.DEV_LOCAL_STAFF_INVITE_CODE || 'LOCAL-STAFF';
  return prisma.staffInvite.upsert({
    where: { inviteCode },
    create: {
      festivalId,
      createdBy,
      inviteCode,
      role: 'gate_staff',
      scopeJson: ['entry_scan', 'benefit_check', 'adult_check', 'student_check', 'event_check'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
    update: {
      festivalId,
      createdBy,
      role: 'gate_staff',
      scopeJson: ['entry_scan', 'benefit_check', 'adult_check', 'student_check', 'event_check'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
  });
}

async function upsertStaffRequest(input) {
  return prisma.staffRequest.upsert({
    where: {
      userId_festivalId: {
        userId: input.userId,
        festivalId: input.festivalId,
      },
    },
    create: {
      inviteId: input.inviteId,
      festivalId: input.festivalId,
      userId: input.userId,
      requestedRole: input.requestedRole,
      maskedDid: input.maskedDid,
      status: 'approved',
      approvedAt: new Date(),
    },
    update: {
      inviteId: input.inviteId,
      requestedRole: input.requestedRole,
      maskedDid: input.maskedDid,
      status: 'approved',
      approvedAt: new Date(),
    },
  });
}

async function upsertQrToken(userId, festivalId) {
  const token = process.env.DEV_LOCAL_QR_TOKEN || 'local-demo-qr-token';
  return prisma.qrToken.upsert({
    where: { token },
    create: {
      userId,
      festivalId,
      token,
      purpose: 'entry',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    update: {
      userId,
      festivalId,
      purpose: 'entry',
      usedAt: null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
}

function signAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: user.id,
    did: user.did,
    provider: user.provider,
    iat: now,
    exp: now + tokenTtlSeconds,
  });
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlJson(header);
  const encodedPayload = base64UrlJson(payload);
  const signature = crypto
    .createHmac('sha256', jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function publicUser(user) {
  return {
    id: user.id,
    did: user.did,
    name: user.name,
    provider: user.provider,
    isAdult: user.isAdult,
  };
}

function requireDid(did) {
  if (!did) {
    throw new Error('Local bootstrap user must have a DID.');
  }
  return did;
}

function maskDid(did) {
  if (did.length <= 18) {
    return did;
  }
  return `${did.slice(0, 14)}...${did.slice(-8)}`;
}

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^"|"$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
