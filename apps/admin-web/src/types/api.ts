export type AuthProviderType =
  | 'mobile_id_sdk'
  | 'omnione_cx'
  | 'raonsecure'
  | 'opendid'
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
  zkpType?: string
  useConvertor?: boolean
}

export type StartMobileIdAuthResponse = {
  authRequestId: string
  provider: AuthProviderType
  state?: string
  status?: string
  expiresAt?: string
  invocationPayload?: unknown
  qrBase64?: string
}

export type AuthRequestStatus = {
  authRequestId: string
  provider: AuthProviderType
  status: string
  state?: string
  expiresAt?: string
  invocationPayload?: unknown
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
  provider?: AuthProviderType
  createdAt?: string
  updatedAt?: string
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
  organizer?: string
  startsAt?: string
  endsAt?: string
  location?: string
  description?: string
  posterUrl?: string
  createdAt?: string
  updatedAt?: string
}

export type CreateFestivalRequest = {
  name: string
  organizer?: string
  startsAt?: string
  endsAt?: string
  location?: string
  description?: string
  posterUrl?: string
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
  type: 'entry' | 'adult' | 'student' | string
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
  status: 'pending' | 'approved' | 'rejected' | string
  role?: string
  scope?: string[]
  createdAt?: string
}

export type ReportSummary = {
  totalScans?: number
  allowedScans?: number
  deniedScans?: number
  usageCount?: number
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
