export type AuthProviderType =
  | 'mobile_id_sdk'
  | 'omnione_cx'
  | 'raonsecure_sdk'
  | (string & {})

export type ClientType = 'admin_web' | 'mobile_app'

export type MobileIdAuthFlow = 'app' | 'qr'

export type StartMobileIdAuthRequest = {
  provider: AuthProviderType
  clientType: ClientType
  redirectUri?: string
  authFlow?: MobileIdAuthFlow
  oacxProvider?: string
  requestType?: 'WEB2APP' | 'APP2APP'
  isBirth?: boolean
  zkpType?: string
  useConvertor?: boolean
}

export type StartMobileIdAuthResponse = {
  authRequestId: string
  provider: AuthProviderType
  nonce?: string
  state?: string
  status?: string
  expiresAt?: string
  payload?: MobileIdStartPayload
  invocationPayload?: unknown
  qrBase64?: string
}

export type AuthRequestStatus = {
  authRequest: {
    authRequestId: string
    provider: AuthProviderType
    status: string
    state?: string
    expiresAt?: string
    invocationPayload?: unknown
  }
}

export type VerifyMobileIdAuthRequest = {
  provider: AuthProviderType
  authRequestId: string
  state?: string
  result: Record<string, unknown>
}

export type VerifyMobileIdAuthResponse = {
  accessToken: string
  user: CamPassUser
}

export type CamPassUser = {
  id: string
  did?: string
  name?: string
  phone?: string
  isAdult?: boolean
  provider?: AuthProviderType
  createdAt?: string
  updatedAt?: string
}

export type MobileIdStartPayload = {
  authRequestId?: string
  authFlow?: MobileIdAuthFlow
  requestType?: 'WEB2APP' | 'APP2APP'
  oacxProvider?: string
  webBaseUrl?: string
  configUrl?: string
  cxId?: string
  txId?: string
  token?: string
  signType?: string
  isBirth?: boolean
  qrBase64?: string
  deepLink?: string
  appLink?: string
  [key: string]: unknown
}

export type AdminProfile = {
  id: string
  userId?: string
  schoolName: string
  organizationName: string
  department?: string
  position?: string
  role: string
  proofFileUrl?: string
  proofStatus?: 'pending' | 'approved' | 'rejected'
  adminRole?: 'festival_admin' | 'super_admin' | string
  rejectionReason?: string
  createdAt?: string
  updatedAt?: string
}

export type AdminProfileListResponse = {
  profiles: AdminProfile[]
  pagination?: {
    limit?: number
    offset?: number
    total?: number
  }
}

export type CreateAdminProfileRequest = {
  schoolName: string
  organizationName: string
  department?: string
  position?: string
  role: string
  proofFileUrl?: string
}

export type Festival = {
  id: string
  name: string
  ownerId?: string
  schoolName?: string
  startDate?: string
  endDate?: string
  location?: string
  operatingTime?: string
  description?: string
  imageUrl?: string
  visibility?: 'public' | 'private' | string
  status?: 'draft' | 'active' | 'ended' | string
  createdAt?: string
  updatedAt?: string
}

export type CreateFestivalRequest = {
  name: string
  schoolName?: string
  startDate?: string
  endDate?: string
  location?: string
  operatingTime?: string
  description?: string
  imageUrl?: string
  visibility?: 'public' | 'private'
  status?: 'draft' | 'active' | 'ended'
}

export type Booth = {
  id: string
  festivalId: string
  name: string
  description?: string
  category: string
  location?: string
  operatingStatus?: string
  currentWaitingCount?: number
  expectedWaitTime?: number
  requiredPermission?: string
  benefitPolicy?: string
  posterUrl?: string
}

export type CreateBoothRequest = Omit<Booth, 'id' | 'festivalId'>

export type PassTemplate = {
  id: string
  festivalId: string
  type: 'entry' | 'student' | 'adult' | 'staff' | 'admin' | string
  name: string
  enabled?: boolean
  verificationRule?: Record<string, unknown>
  expiresAt?: string
}

export type CreatePassTemplateRequest = Omit<PassTemplate, 'id' | 'festivalId'>

export type StaffInvite = {
  id: string
  festivalId: string
  inviteCode: string
  role: string
  scope: string[]
  expiresAt?: string
  status?: string
  createdAt?: string
}

export type CreateStaffInviteRequest = {
  role: string
  scope: string[]
  expiresAt?: string
}

export type StaffRequest = {
  id: string
  festivalId: string
  userId: string
  inviteId?: string
  status: 'requested' | 'approved' | 'rejected' | string
  requestedRole?: string
  maskedDid?: string
  scope?: string[]
  approvedAt?: string
  createdAt?: string
}

export type ReportSummary = {
  totalScans?: number
  allowedScans?: number
  deniedScans?: number
  usageCount?: number
  totalPassIssuedCount?: number
  entryProcessedCount?: number
  studentVerifiedCount?: number
  adultVerifiedCount?: number
  boothUsageCount?: number
  eventParticipationCount?: number
  duplicateBlockedCount?: number
  recentScans?: ScanReport[]
  boothUsage?: Array<{
    boothId?: string | null
    booth?: Pick<Booth, 'id' | 'name' | 'category'> | null
    count: number
  }>
  hourlyScanCount?: Array<{ hour: string; count: number }>
  scanResultCount?: Array<{ result: string; count: number }>
  usageTypeCount?: Array<{ usageType: string; count: number }>
  [key: string]: unknown
}

export type ReportListQuery = {
  limit?: number
  offset?: number
  from?: string
  to?: string
  scanPurpose?: string
  result?: string
  usageType?: string
}

export type ScanReport = {
  id: string
  festivalId: string
  staffId?: string | null
  userId?: string | null
  boothId?: string | null
  scanPurpose?: string
  result?: string
  reason?: string | null
  createdAt?: string
}

export type UsageReport = {
  id: string
  festivalId: string
  boothId?: string | null
  userId?: string
  benefitType?: string | null
  usageType?: string
  usedAt?: string
}
