import { ACCESS_TOKEN_STORAGE_KEY, apiRequest } from './api'
import type {
  AuthProviderType,
  AuthRequestStatus,
  CamPassUser,
  MobileIdAuthFlow,
  StartMobileIdAuthRequest,
  StartMobileIdAuthResponse,
  VerifyMobileIdAuthRequest,
  VerifyMobileIdAuthResponse
} from '../types/api'

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function setAccessToken(accessToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
}

export function clearAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function listMobileIdProviders() {
  return apiRequest<AuthProviderType[]>('/auth/mobile-id/providers')
}

export function startMobileIdAuth(options: StartAdminMobileIdAuthOptions) {
  const request: StartMobileIdAuthRequest = {
    clientType: 'admin_web',
    ...options
  }

  return apiRequest<StartMobileIdAuthResponse>('/auth/mobile-id/start', {
    method: 'POST',
    body: request
  })
}

export function getMobileIdAuthRequest(
  authRequestId: string,
  query: { provider?: AuthProviderType; status?: string } = {}
) {
  return apiRequest<AuthRequestStatus>(
    `/auth/mobile-id/requests/${authRequestId}${toQueryString(query)}`
  )
}

export async function verifyMobileIdAuth(request: VerifyMobileIdAuthRequest) {
  const response = await apiRequest<VerifyMobileIdAuthResponse>('/auth/mobile-id/verify', {
    method: 'POST',
    body: request
  })

  setAccessToken(response.accessToken)

  return response
}

export async function getCurrentUser() {
  const response = await apiRequest<{ user: CamPassUser }>('/auth/me')

  return response.user
}

export async function logout() {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}

type StartAdminMobileIdAuthOptions = {
  provider: AuthProviderType
  redirectUri?: string
  authFlow?: MobileIdAuthFlow
  oacxProvider?: string
  requestType?: 'WEB2APP' | 'APP2APP'
  zkpType?: string
  useConvertor?: boolean
}

function toQueryString(query: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value)
    }
  }

  const serialized = params.toString()

  return serialized ? `?${serialized}` : ''
}
