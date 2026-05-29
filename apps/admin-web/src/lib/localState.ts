export const SUBMITTED_ADMIN_INFO_KEY = 'festid.submittedAdminInfo'
export const FESTIVAL_INFO_KEY = 'festid.festivalInfo'

export type SubmittedAdminInfo = {
  schoolName: string
  organizationName: string
  department: string
  position: string
  role: string
  proofFileName: string
  proofFilePreviewUrl: string
  submittedAt: string
}

export type FestivalInfo = {
  name: string
  host: string
  startDate: string
  endDate: string
  place: string
  description: string
  imageName: string
  imagePreviewUrl: string
  backendId?: string
  updatedAt: string
}

export const DEFAULT_SUBMITTED_ADMIN_INFO: SubmittedAdminInfo = {
  schoolName: '미입력',
  organizationName: '미입력',
  department: '미입력',
  position: '미입력',
  role: '미입력',
  proofFileName: '미첨부',
  proofFilePreviewUrl: '',
  submittedAt: ''
}

export const DEFAULT_FESTIVAL_INFO: FestivalInfo = {
  name: '캠퍼스 페스티벌 2026',
  host: '캠퍼스 문화위원회',
  startDate: '2026-05-30',
  endDate: '2026-05-31',
  place: '캠퍼스 중앙광장 및 체육관 일대',
  description:
    '학생과 지역사회가 함께 즐기는 캠퍼스 페스티벌입니다.\n다양한 공연, 체험, 푸드 부스가 운영됩니다.\n모두가 안전하고 즐거운 축제가 되도록 협조 부탁드립니다.',
  imageName: '',
  imagePreviewUrl: '',
  updatedAt: ''
}

export function saveSubmittedAdminInfo(info: Omit<SubmittedAdminInfo, 'submittedAt'>) {
  const nextInfo: SubmittedAdminInfo = {
    ...info,
    submittedAt: new Date().toISOString()
  }

  localStorage.setItem(SUBMITTED_ADMIN_INFO_KEY, JSON.stringify(nextInfo))

  return nextInfo
}

export function getSubmittedAdminInfo() {
  return readStoredValue(SUBMITTED_ADMIN_INFO_KEY, DEFAULT_SUBMITTED_ADMIN_INFO)
}

export function saveFestivalInfo(info: Omit<FestivalInfo, 'updatedAt'> & { updatedAt?: string }) {
  const nextInfo: FestivalInfo = {
    ...info,
    updatedAt: info.updatedAt || new Date().toISOString()
  }

  localStorage.setItem(FESTIVAL_INFO_KEY, JSON.stringify(nextInfo))

  return nextInfo
}

export function getFestivalInfo() {
  return readStoredValue(FESTIVAL_INFO_KEY, DEFAULT_FESTIVAL_INFO)
}

function readStoredValue<TValue>(key: string, fallback: TValue) {
  const storedValue = localStorage.getItem(key)

  if (!storedValue) {
    return fallback
  }

  try {
    return {
      ...fallback,
      ...(JSON.parse(storedValue) as Partial<TValue>)
    }
  } catch {
    return fallback
  }
}
