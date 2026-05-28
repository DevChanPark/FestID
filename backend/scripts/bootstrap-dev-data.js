const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

loadLocalEnv();

const prisma = new PrismaClient();

const ownerUserId =
  process.env.DEV_BOOTSTRAP_OWNER_USER_ID ||
  firstCsvValue(process.env.SEED_ADMIN_USER_IDS);
const festivalName =
  process.env.DEV_BOOTSTRAP_FESTIVAL_NAME || 'CamPass Demo Festival';

async function main() {
  if (!ownerUserId) {
    throw new Error(
      'DEV_BOOTSTRAP_OWNER_USER_ID or SEED_ADMIN_USER_IDS must contain an existing real user id.',
    );
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner) {
    throw new Error(`Owner user was not found: ${ownerUserId}`);
  }
  if (!owner.did) {
    throw new Error(`Owner user must have a DID before bootstrapping: ${ownerUserId}`);
  }

  const festival = await upsertFestival(owner.id);
  await upsertPassTemplates(festival.id);
  await upsertBooths(festival.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        festivalId: festival.id,
        ownerUserId: owner.id,
        next: [
          'Set SEED_ADMIN_USER_IDS to this owner user id if it is not already set.',
          'Issue or approve Admin VC before using admin-only APIs through the app.',
          'Use GET /festivals to confirm the active public festival is visible.',
        ],
      },
      null,
      2,
    ),
  );
}

async function upsertFestival(ownerId) {
  const existingFestival = await prisma.festival.findFirst({
    where: { ownerId, name: festivalName },
  });

  const data = {
    ownerId,
    name: festivalName,
    description:
      'Demo campus festival data for CamPass/FestID API integration tests.',
    schoolName: '광운대학교',
    startDate: new Date('2026-05-29T00:00:00.000Z'),
    endDate: new Date('2026-05-31T14:59:59.000Z'),
    location: '광운대학교 캠퍼스',
    operatingTime: '10:00-22:00',
    visibility: 'public',
    status: 'active',
  };

  if (existingFestival) {
    return prisma.festival.update({
      where: { id: existingFestival.id },
      data,
    });
  }

  return prisma.festival.create({ data });
}

async function upsertPassTemplates(festivalId) {
  const templates = [
    {
      type: 'entry',
      name: '축제 입장 패스',
      enabled: true,
      verificationRule: { required: ['mobile_id_verified'] },
    },
    {
      type: 'adult',
      name: '성인 인증 패스',
      enabled: true,
      verificationRule: { required: ['isAdult'] },
    },
    {
      type: 'student',
      name: '재학생 인증 패스',
      enabled: true,
      verificationRule: { approval: 'admin_review' },
    },
    {
      type: 'staff',
      name: '스태프 권한 패스',
      enabled: true,
      verificationRule: { approval: 'staff_invite' },
    },
    {
      type: 'admin',
      name: '관리자 권한 패스',
      enabled: true,
      verificationRule: { approval: 'super_admin_or_seed_admin' },
    },
  ];

  for (const template of templates) {
    await prisma.passTemplate.upsert({
      where: {
        festivalId_type: {
          festivalId,
          type: template.type,
        },
      },
      create: {
        festivalId,
        ...template,
      },
      update: template,
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
    {
      name: '푸드트럭 쿠폰',
      description: 'Entry VC 보유자에게 일 1회 쿠폰을 지급합니다.',
      category: 'food',
      location: '운동장 동편',
      requiredPermission: 'entry',
      benefitPolicy: 'once_per_day',
    },
    {
      name: '스탬프 이벤트',
      description: 'Entry VC 기반 이벤트 참여 처리 부스입니다.',
      category: 'experience',
      location: '중앙광장',
      requiredPermission: 'entry',
      benefitPolicy: 'once_per_user',
    },
  ];

  for (const booth of booths) {
    const existingBooth = await prisma.booth.findFirst({
      where: { festivalId, name: booth.name },
    });

    const data = {
      festivalId,
      operatingStatus: 'open',
      currentWaitingCount: 0,
      ...booth,
    };

    if (existingBooth) {
      await prisma.booth.update({
        where: { id: existingBooth.id },
        data,
      });
    } else {
      await prisma.booth.create({ data });
    }
  }
}

function firstCsvValue(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)[0];
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
