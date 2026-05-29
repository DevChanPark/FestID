import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  logout,
  setAccessToken,
  startMobileIdAuth,
  verifyMobileIdAuth
} from './auth'

describe('auth helpers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('stores only the CamPass access token in sessionStorage', () => {
    setAccessToken('access-token')

    expect(getAccessToken()).toBe('access-token')

    clearAccessToken()

    expect(getAccessToken()).toBeNull()
  })

  it('wraps the mobile ID start endpoint with admin web defaults', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ authRequestId: 'auth-1', state: 'state-1' }))

    await startMobileIdAuth({
      provider: 'omnione_cx',
      authFlow: 'qr',
      zkpType: 'AdultVerify'
    })

    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/auth/mobile-id/start')
    expect(request).toMatchObject({
      provider: 'omnione_cx',
      clientType: 'admin_web',
      authFlow: 'qr',
      zkpType: 'AdultVerify'
    })
  })

  it('stores the returned access token after mobile ID verification', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accessToken: 'verified-token',
        user: { id: 'user-1', did: 'did:example:user-1' }
      })
    )

    const result = await verifyMobileIdAuth({
      provider: 'omnione_cx',
      authRequestId: 'auth-1',
      result: { token: 'provider-token' }
    })

    expect(result.accessToken).toBe('verified-token')
    expect(getAccessToken()).toBe('verified-token')
  })

  it('uses the stored token for /auth/me and clears it after logout', async () => {
    setAccessToken('access-token')
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: 'user-1', did: 'did:example:user-1' } }))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(getCurrentUser()).resolves.toEqual({ id: 'user-1', did: 'did:example:user-1' })
    await logout()

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer access-token' })
    expect(getAccessToken()).toBeNull()
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
