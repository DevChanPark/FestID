import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken } from '../lib/auth'
import { LoginAdmin } from './LoginAdmin'

describe('LoginAdmin', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders the Figma login copy and actions', () => {
    render(<LoginAdmin />)

    expect(screen.getByText('CamPass')).toBeInTheDocument()
    expect(screen.getByText(/입장부터 혜택까지/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /모바일 신분증 로그인/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /발급하기/ })).toHaveAttribute(
      'href',
      'https://www.mobileid.go.kr/mip/hps/main.do'
    )
    expect(screen.getByRole('link', { name: /발급하기/ })).toHaveAttribute('target', '_blank')
  })

  it('starts an OmniOne CX auth request without rendering the legacy fallback dialog', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        authRequestId: 'auth-1',
        provider: 'omnione_cx',
        state: 'state-1',
        payload: { cxId: 'cx-1', requestType: 'WEB2APP' }
      })
    )

    const onAuthenticated = vi.fn()
    render(<LoginAdmin onAuthenticated={onAuthenticated} />)

    fireEvent.click(screen.getByRole('button', { name: /모바일 신분증 로그인/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    expect(screen.queryByRole('dialog', { name: '모바일 신분증 표준인증' })).not.toBeInTheDocument()
    expect(screen.queryByText('auth-1')).not.toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
    expect(onAuthenticated).not.toHaveBeenCalled()
  })

  it('verifies the mobile ID callback and routes users without an admin profile to profile submission', async () => {
    vi.stubGlobal('OACX', {
      LOAD_MODULE: vi.fn((_configUrl, _request, callback) => {
        callback({ token: 'sdk-result-token' })
      })
    })
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        authRequestId: 'auth-1',
        provider: 'omnione_cx',
        state: 'state-1',
        payload: {
          cxId: 'cx-1',
          requestType: 'WEB2APP',
          webBaseUrl: 'https://cx.example.test/ent/esign',
          configUrl: 'https://cx.example.test/ent/esign/config/config.mid.json',
          isBirth: true
        }
      })
    )
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accessToken: 'verified-token',
        user: { id: 'user-1', did: 'did:campass:user:1' }
      })
    )
    fetchMock.mockResolvedValueOnce(jsonResponse({ profile: null }))

    const onAuthenticated = vi.fn()
    render(<LoginAdmin onAuthenticated={onAuthenticated} />)

    fireEvent.click(screen.getByRole('button', { name: /모바일 신분증 로그인/ }))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('/submitInfo'))
    expect(getAccessToken()).toBe('verified-token')
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
