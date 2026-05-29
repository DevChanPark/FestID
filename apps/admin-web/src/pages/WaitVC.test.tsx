import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSubmittedAdminInfo } from '../lib/localState'
import { WaitVC } from './WaitVC'

describe('WaitVC', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the VC approval waiting state from the Figma screen', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        profile: {
          id: 'profile-1',
          schoolName: '광운대학교',
          organizationName: '총학생회',
          proofStatus: 'pending'
        }
      })
    )

    render(<WaitVC />)

    expect(screen.getByRole('heading', { name: '관리자 VC 발급 승인 대기' })).toBeInTheDocument()
    expect(screen.getByText('승인 완료 시 관리자 VC가 발급되고 축제 생성 화면으로 이동합니다.')).toBeInTheDocument()
    expect(screen.getByText('제출 완료!')).toBeInTheDocument()
    expect(screen.getByText('제출 정보')).toBeInTheDocument()
    expect(screen.getByText('예상 처리 시간')).toBeInTheDocument()
    expect(screen.getByText('다음 단계')).toBeInTheDocument()
    expect(await screen.findByText('광운대학교')).toBeInTheDocument()
  })

  it('renders the submitted admin information from SubmitInfo', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ profile: null }))
    saveSubmittedAdminInfo({
      schoolName: '광운대학교',
      organizationName: '광운대학교 총학생회',
      department: '축제기획국',
      position: '운영팀장',
      role: '행사 운영',
      proofFileName: 'admin-proof.pdf',
      proofFilePreviewUrl: ''
    })

    render(<WaitVC />)

    expect(screen.getByText('광운대학교')).toBeInTheDocument()
    expect(screen.getByText('광운대학교 총학생회')).toBeInTheDocument()
    expect(screen.getByText('축제기획국')).toBeInTheDocument()
    expect(screen.getByText('운영팀장')).toBeInTheDocument()
    expect(screen.getByText('행사 운영')).toBeInTheDocument()
    expect(screen.getByText('admin-proof.pdf')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })

  it('moves to createFest when the backend reports approved proof status', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        profile: {
          id: 'profile-1',
          schoolName: '광운대학교',
          organizationName: '총학생회',
          proofStatus: 'approved'
        }
      })
    )
    const onAutoRedirect = vi.fn()

    render(<WaitVC onAutoRedirect={onAutoRedirect} />)

    await waitFor(() => expect(onAutoRedirect).toHaveBeenCalledWith('/createFest'))
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
