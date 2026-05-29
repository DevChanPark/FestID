import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveSubmittedAdminInfo } from '../lib/localState'
import { WaitVC } from './WaitVC'

describe('WaitVC', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('renders the VC approval waiting state from the Figma screen', () => {
    render(<WaitVC />)

    expect(screen.getByRole('heading', { name: '관리자 VC 발급 승인 대기' })).toBeInTheDocument()
    expect(screen.getByText('검토 완료 시 적어주신 연락처로 안내 결과 메일이 발송될 예정입니다.')).toBeInTheDocument()
    expect(screen.getByText('제출 완료!')).toBeInTheDocument()
    expect(screen.getByText('제출 정보')).toBeInTheDocument()
    expect(screen.getByText('예상 처리 시간')).toBeInTheDocument()
    expect(screen.getByText('다음 단계')).toBeInTheDocument()
  })

  it('renders the submitted admin information from SubmitInfo', () => {
    saveSubmittedAdminInfo({
      name: '홍길동',
      email: 'admin@example.com',
      role: '운영팀장',
      organization: '광운대학교 총학생회',
      proofFileName: 'admin-proof.pdf',
      proofFilePreviewUrl: ''
    })

    render(<WaitVC />)

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('운영팀장')).toBeInTheDocument()
    expect(screen.getByText('광운대학교 총학생회')).toBeInTheDocument()
    expect(screen.getByText('admin-proof.pdf')).toBeInTheDocument()
  })

  it('moves to createFest automatically after the approval wait delay', () => {
    vi.useFakeTimers()
    const onAutoRedirect = vi.fn()

    render(<WaitVC onAutoRedirect={onAutoRedirect} />)

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(onAutoRedirect).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onAutoRedirect).toHaveBeenCalledWith('/createFest')
  })
})
