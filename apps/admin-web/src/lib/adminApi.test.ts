import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  approveStaffRequest,
  createAdminProfile,
  createBooth,
  createFestival,
  createPassTemplate,
  getReportSummary,
  importBoothsCsv,
  listMyFestivals,
  rejectStaffRequest
} from './adminApi'
import { clearAccessToken, setAccessToken } from './auth'

describe('admin API wrappers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken('admin-token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    clearAccessToken()
  })

  it('submits the admin profile payload to /admin/profile', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'profile-1' }))

    await createAdminProfile({
      schoolName: 'Kwangwoon University',
      organizationName: 'Festival Team',
      role: 'Manager'
    })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/admin/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer admin-token'
      },
      body: JSON.stringify({
        schoolName: 'Kwangwoon University',
        organizationName: 'Festival Team',
        role: 'Manager'
      })
    })
  })

  it('maps festival and pass-template creation endpoints', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'festival-1' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'template-1' }))

    await createFestival({ name: 'FestID Demo', location: 'Seoul' })
    await createPassTemplate('festival-1', { type: 'entry', name: 'Entry Pass' })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/festivals')
    expect(fetchMock.mock.calls[1][0]).toBe(
      'http://localhost:3000/festivals/festival-1/pass-templates'
    )
  })

  it('maps booth CSV import without overriding FormData headers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ imported: 2 }))
    const file = new File(['name,category'], 'booths.csv', { type: 'text/csv' })

    await importBoothsCsv('festival-1', file, { upsert: false })

    const [, init] = fetchMock.mock.calls[0]
    const body = init.body as FormData

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3000/festivals/festival-1/booths/import-csv'
    )
    expect(init.headers).toEqual({ Authorization: 'Bearer admin-token' })
    expect(body.get('file')).toBe(file)
    expect(body.get('upsert')).toBe('false')
  })

  it('maps dashboard list and report query endpoints', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 'festival-1' }]))
    fetchMock.mockResolvedValueOnce(jsonResponse({ totalScans: 10 }))

    await listMyFestivals()
    await getReportSummary('festival-1', { from: '2026-05-29', result: 'allowed' })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/festivals/my')
    expect(fetchMock.mock.calls[1][0]).toBe(
      'http://localhost:3000/festivals/festival-1/reports/summary?from=2026-05-29&result=allowed'
    )
  })

  it('maps booth creation and staff approval endpoints', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'booth-1' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'request-1', status: 'approved' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'request-2', status: 'rejected' }))

    await createBooth('festival-1', { name: 'Beer House', category: 'food' })
    await approveStaffRequest('request-1')
    await rejectStaffRequest('request-2', 'scope mismatch')

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/festivals/festival-1/booths')
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3000/staff-requests/request-1/approve')
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:3000/staff-requests/request-2/reject')
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ reason: 'scope mismatch' })
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
