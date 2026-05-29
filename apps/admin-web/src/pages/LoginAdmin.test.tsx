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
    expect(screen.getByRole('link', { name: /발급하기/ })).toHaveAttribute('href', '/submitInfo')
  })

  it('starts an OmniOne CX auth request and closes without dev-login side effects', async () => {
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

    expect(await screen.findByRole('dialog', { name: '모바일 신분증 표준인증' })).toBeInTheDocument()
    expect(screen.getByText('auth-1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(getAccessToken()).toBeNull()
    expect(onAuthenticated).not.toHaveBeenCalled()
  })

  it('verifies the mobile ID result and routes users without an admin profile to profile submission', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        authRequestId: 'auth-1',
        provider: 'omnione_cx',
        state: 'state-1',
        payload: { cxId: 'cx-1', requestType: 'WEB2APP' }
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
    fireEvent.click(await screen.findByRole('button', { name: '인증 완료 확인' }))

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
