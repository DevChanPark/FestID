import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'
import { clearAccessToken, setAccessToken } from './auth'

describe('apiRequest', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    clearAccessToken()
  })

  it('joins the configured base URL with a relative path and sends JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    const result = await apiRequest<{ ok: boolean }>('/admin/profile', {
      method: 'POST',
      body: { schoolName: 'Kwangwoon University' }
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/admin/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolName: 'Kwangwoon University' })
    })
  })

  it('adds the Bearer token when one is stored', async () => {
    setAccessToken('campass-token')
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'user-1' }))

    await apiRequest('/auth/me')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/auth/me', {
      headers: { Authorization: 'Bearer campass-token' }
    })
  })

  it('does not force a JSON content type for FormData uploads', async () => {
    const formData = new FormData()
    formData.append('file', new File(['csv'], 'booths.csv', { type: 'text/csv' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ uploaded: true }))

    await apiRequest('/festivals/festival-1/booths/import-csv', {
      method: 'POST',
      body: formData
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/festivals/festival-1/booths/import-csv',
      {
        method: 'POST',
        headers: {},
        body: formData
      }
    )
  })

  it('normalizes backend error responses', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          statusCode: 501,
          message: 'PROVIDER_NOT_IMPLEMENTED',
          error: 'Not Implemented'
        },
        501
      )
    )

    await expect(apiRequest('/auth/mobile-id/start', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 501,
      code: 'PROVIDER_NOT_IMPLEMENTED',
      message: 'PROVIDER_NOT_IMPLEMENTED'
    })
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
