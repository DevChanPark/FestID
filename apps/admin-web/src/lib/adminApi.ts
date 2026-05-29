import { apiRequest } from './api'
import type {
  AdminProfile,
  Booth,
  CreateAdminProfileRequest,
  CreateBoothRequest,
  CreateFestivalRequest,
  CreatePassTemplateRequest,
  CreateStaffInviteRequest,
  Festival,
  PassTemplate,
  AdminProfileListResponse,
  ReportListQuery,
  ReportSummary,
  ScanReport,
  StaffInvite,
  StaffRequest,
  UsageReport
} from '../types/api'

export async function createAdminProfile(request: CreateAdminProfileRequest) {
  const response = await apiRequest<{ profile: AdminProfile }>('/admin/profile', {
    method: 'POST',
    body: request
  })

  return response.profile
}

export async function getMyAdminProfile() {
  const response = await apiRequest<{ profile: AdminProfile | null }>('/admin/profile/me')

  return response.profile
}

export async function listAdminProfiles(query: AdminProfileListQuery = {}) {
  const response = await apiRequest<AdminProfileListResponse>(`/admin/profiles${toQueryString(query)}`)

  return response.profiles
}

export function updateAdminProofStatus(
  profileId: string,
  request: {
    proofStatus: 'approved' | 'rejected'
    adminRole?: string
    rejectionReason?: string
  }
) {
  return apiRequest<{ profile: AdminProfile }>(`/admin/profiles/${profileId}/proof-status`, {
    method: 'PATCH',
    body: request
  }).then((response) => response.profile)
}

export async function createFestival(request: CreateFestivalRequest) {
  const response = await apiRequest<{ festival: Festival }>('/festivals', {
    method: 'POST',
    body: request
  })

  return response.festival
}

export async function listFestivals() {
  const response = await apiRequest<{ festivals: Festival[] }>('/festivals')

  return response.festivals
}

export async function listMyFestivals() {
  const response = await apiRequest<{ festivals: Festival[] }>('/festivals/my')

  return response.festivals
}

export async function getFestival(festivalId: string) {
  const response = await apiRequest<{ festival: Festival }>(`/festivals/${festivalId}`)

  return response.festival
}

export async function updateFestival(festivalId: string, request: Partial<CreateFestivalRequest>) {
  const response = await apiRequest<{ festival: Festival }>(`/festivals/${festivalId}`, {
    method: 'PATCH',
    body: request
  })

  return response.festival
}

export async function createPassTemplate(festivalId: string, request: CreatePassTemplateRequest) {
  const response = await apiRequest<{ template: PassTemplate }>(`/festivals/${festivalId}/pass-templates`, {
    method: 'POST',
    body: request
  })

  return response.template
}

export async function listPassTemplates(festivalId: string) {
  const response = await apiRequest<{ templates: PassTemplate[] }>(`/festivals/${festivalId}/pass-templates`)

  return response.templates
}

export async function updatePassTemplate(templateId: string, request: Partial<CreatePassTemplateRequest>) {
  const response = await apiRequest<{ template: PassTemplate }>(`/pass-templates/${templateId}`, {
    method: 'PATCH',
    body: request
  })

  return response.template
}

export async function createBooth(festivalId: string, request: CreateBoothRequest) {
  const response = await apiRequest<{ booth: Booth }>(`/festivals/${festivalId}/booths`, {
    method: 'POST',
    body: request
  })

  return response.booth
}

export function importBoothsCsv(
  festivalId: string,
  file: File,
  options: { upsert?: boolean } = {}
) {
  const formData = new FormData()
  formData.append('file', file)

  if (options.upsert !== undefined) {
    formData.append('upsert', String(options.upsert))
  }

  return apiRequest<unknown>(`/festivals/${festivalId}/booths/import-csv`, {
    method: 'POST',
    body: formData
  })
}

export async function listBooths(festivalId: string) {
  const response = await apiRequest<{ booths: Booth[] }>(`/festivals/${festivalId}/booths`)

  return response.booths
}

export async function getBooth(boothId: string) {
  const response = await apiRequest<{ booth: Booth }>(`/booths/${boothId}`)

  return response.booth
}

export async function updateBooth(boothId: string, request: Partial<CreateBoothRequest>) {
  const response = await apiRequest<{ booth: Booth }>(`/booths/${boothId}`, {
    method: 'PATCH',
    body: request
  })

  return response.booth
}

export async function updateBoothStatus(boothId: string, operatingStatus: string) {
  const response = await apiRequest<{ booth: Booth }>(`/booths/${boothId}/status`, {
    method: 'PATCH',
    body: { operatingStatus }
  })

  return response.booth
}

export function deleteBooth(boothId: string) {
  return apiRequest<void>(`/booths/${boothId}`, {
    method: 'DELETE'
  })
}

export async function createStaffInvite(festivalId: string, request: CreateStaffInviteRequest) {
  const response = await apiRequest<{ invite: StaffInvite }>(`/festivals/${festivalId}/staff-invites`, {
    method: 'POST',
    body: request
  })

  return response.invite
}

export async function listStaffInvites(festivalId: string) {
  const response = await apiRequest<{ invites: StaffInvite[] }>(`/festivals/${festivalId}/staff-invites`)

  return response.invites
}

export async function revokeStaffInvite(inviteCode: string) {
  const response = await apiRequest<{ invite: StaffInvite }>(`/staff-invites/${inviteCode}/revoke`, {
    method: 'POST'
  })

  return response.invite
}

export async function listStaffRequests(festivalId: string) {
  const response = await apiRequest<{ requests: StaffRequest[] }>(`/festivals/${festivalId}/staff-requests`)

  return response.requests
}

export async function approveStaffRequest(requestId: string) {
  const response = await apiRequest<{ request: StaffRequest }>(`/staff-requests/${requestId}/approve`, {
    method: 'POST'
  })

  return response.request
}

export async function rejectStaffRequest(requestId: string, reason?: string) {
  const response = await apiRequest<{ request: StaffRequest }>(`/staff-requests/${requestId}/reject`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })

  return response.request
}

export async function getReportSummary(festivalId: string, query: ReportListQuery = {}) {
  const response = await apiRequest<{ summary: ReportSummary }>(
    `/festivals/${festivalId}/reports/summary${toQueryString(query)}`
  )

  return response.summary
}

export async function listScanReports(festivalId: string, query: ReportListQuery = {}) {
  const response = await apiRequest<{ scans: ScanReport[] }>(
    `/festivals/${festivalId}/reports/scans${toQueryString(query)}`
  )

  return response.scans
}

export async function listUsageReports(festivalId: string, query: ReportListQuery = {}) {
  const response = await apiRequest<{ usage: UsageReport[] }>(
    `/festivals/${festivalId}/reports/usage${toQueryString(query)}`
  )

  return response.usage
}

export function uploadFile(purpose: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest<{ fileUrl: string; path: string; originalName?: string; mimeType?: string; size?: number }>(`/uploads/${purpose}`, {
    method: 'POST',
    body: formData
  })
}

type AdminProfileListQuery = {
  proofStatus?: string
  limit?: number
  offset?: number
}

function toQueryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }

  const serialized = params.toString()

  return serialized ? `?${serialized}` : ''
}
