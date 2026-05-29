import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WaitVC } from './WaitVC'

describe('WaitVC', () => {
  afterEach(() => {
    vi.useRealTimers()
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

  it('moves to createFest automatically after the approval wait delay', () => {
    vi.useFakeTimers()
    const onAutoRedirect = vi.fn()

    render(<WaitVC onAutoRedirect={onAutoRedirect} />)

    act(() => {
      vi.advanceTimersByTime(99999)
    })
    expect(onAutoRedirect).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onAutoRedirect).toHaveBeenCalledWith('/createFest')
  })
})
