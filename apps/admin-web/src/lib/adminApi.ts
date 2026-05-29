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
  ReportListQuery,
  ReportSummary,
  StaffInvite,
  StaffRequest
} from '../types/api'

export function createAdminProfile(request: CreateAdminProfileRequest) {
  return apiRequest<AdminProfile>('/admin/profile', {
    method: 'POST',
    body: request
  })
}

export function getMyAdminProfile() {
  return apiRequest<AdminProfile>('/admin/profile/me')
}

export function listAdminProfiles(query: AdminProfileListQuery = {}) {
  return apiRequest<AdminProfile[]>(`/admin/profiles${toQueryString(query)}`)
}

export function updateAdminProofStatus(
  profileId: string,
  request: {
    proofStatus: 'approved' | 'rejected'
    adminRole?: string
    rejectionReason?: string
  }
) {
  return apiRequest<AdminProfile>(`/admin/profiles/${profileId}/proof-status`, {
    method: 'PATCH',
    body: request
  })
}

export function createFestival(request: CreateFestivalRequest) {
  return apiRequest<Festival>('/festivals', {
    method: 'POST',
    body: request
  })
}

export function listFestivals() {
  return apiRequest<Festival[]>('/festivals')
}

export function listMyFestivals() {
  return apiRequest<Festival[]>('/festivals/my')
}

export function getFestival(festivalId: string) {
  return apiRequest<Festival>(`/festivals/${festivalId}`)
}

export function updateFestival(festivalId: string, request: Partial<CreateFestivalRequest>) {
  return apiRequest<Festival>(`/festivals/${festivalId}`, {
    method: 'PATCH',
    body: request
  })
}

export function createPassTemplate(festivalId: string, request: CreatePassTemplateRequest) {
  return apiRequest<PassTemplate>(`/festivals/${festivalId}/pass-templates`, {
    method: 'POST',
    body: request
  })
}

export function listPassTemplates(festivalId: string) {
  return apiRequest<PassTemplate[]>(`/festivals/${festivalId}/pass-templates`)
}

export function updatePassTemplate(templateId: string, request: Partial<CreatePassTemplateRequest>) {
  return apiRequest<PassTemplate>(`/pass-templates/${templateId}`, {
    method: 'PATCH',
    body: request
  })
}

export function createBooth(festivalId: string, request: CreateBoothRequest) {
  return apiRequest<Booth>(`/festivals/${festivalId}/booths`, {
    method: 'POST',
    body: request
  })
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

export function listBooths(festivalId: string) {
  return apiRequest<Booth[]>(`/festivals/${festivalId}/booths`)
}

export function getBooth(boothId: string) {
  return apiRequest<Booth>(`/booths/${boothId}`)
}

export function updateBooth(boothId: string, request: Partial<CreateBoothRequest>) {
  return apiRequest<Booth>(`/booths/${boothId}`, {
    method: 'PATCH',
    body: request
  })
}

export function updateBoothStatus(boothId: string, operatingStatus: string) {
  return apiRequest<Booth>(`/booths/${boothId}/status`, {
    method: 'PATCH',
    body: { operatingStatus }
  })
}

export function deleteBooth(boothId: string) {
  return apiRequest<void>(`/booths/${boothId}`, {
    method: 'DELETE'
  })
}

export function createStaffInvite(festivalId: string, request: CreateStaffInviteRequest) {
  return apiRequest<StaffInvite>(`/festivals/${festivalId}/staff-invites`, {
    method: 'POST',
    body: request
  })
}

export function listStaffInvites(festivalId: string) {
  return apiRequest<StaffInvite[]>(`/festivals/${festivalId}/staff-invites`)
}

export function revokeStaffInvite(inviteCode: string) {
  return apiRequest<StaffInvite>(`/staff-invites/${inviteCode}/revoke`, {
    method: 'POST'
  })
}

export function listStaffRequests(festivalId: string) {
  return apiRequest<StaffRequest[]>(`/festivals/${festivalId}/staff-requests`)
}

export function approveStaffRequest(requestId: string) {
  return apiRequest<StaffRequest>(`/staff-requests/${requestId}/approve`, {
    method: 'POST'
  })
}

export function rejectStaffRequest(requestId: string, reason?: string) {
  return apiRequest<StaffRequest>(`/staff-requests/${requestId}/reject`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })
}

export function getReportSummary(festivalId: string, query: ReportListQuery = {}) {
  return apiRequest<ReportSummary>(`/festivals/${festivalId}/reports/summary${toQueryString(query)}`)
}

export function listScanReports(festivalId: string, query: ReportListQuery = {}) {
  return apiRequest<unknown[]>(`/festivals/${festivalId}/reports/scans${toQueryString(query)}`)
}

export function listUsageReports(festivalId: string, query: ReportListQuery = {}) {
  return apiRequest<unknown[]>(`/festivals/${festivalId}/reports/usage${toQueryString(query)}`)
}

export function uploadFile(purpose: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest<{ url: string }>(`/uploads/${purpose}`, {
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
