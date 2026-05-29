import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DManageQR } from './DManageQR'

describe('DManageQR', () => {
  it('renders the field QR management screen from Figma', () => {
    render(<DManageQR />)

    expect(screen.getByRole('heading', { name: '현장 QR 관리' })).toBeInTheDocument()
    expect(screen.queryByText('패스별 현황')).not.toBeInTheDocument()
    expect(screen.getByText('부스 QR 관리')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '부스' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '드롭다운 [관리]' })).not.toBeInTheDocument()

    expect(screen.getByText('총 부스 개수')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('전체 스캔 수')).toBeInTheDocument()
    expect(screen.getByText('214')).toBeInTheDocument()
    expect(screen.getByText('승인')).toBeInTheDocument()
    expect(screen.getByText('182')).toBeInTheDocument()
    expect(screen.getByText('거절')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText('입장 거절 로그')).toBeInTheDocument()
    expect(screen.getAllByText('입장 거절 사유')).toHaveLength(3)
    expect(screen.getAllByText('중복 입장 시도')).toHaveLength(2)
    expect(screen.getByText('유효하지 않은 패스')).toBeInTheDocument()
    expect(screen.getAllByText('이름')).toHaveLength(3)
    expect(screen.getByText('이도윤')).toBeInTheDocument()
    expect(screen.getByText('박서연')).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.queryByText('1건')).not.toBeInTheDocument()
    expect(screen.queryByText('2건')).not.toBeInTheDocument()
    expect(screen.getByText('오늘 12:10').compareDocumentPosition(screen.getByText('오늘 13:45'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
    expect(screen.queryByText('부스 목록')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '축제 현황' })).toHaveAttribute('href', '/dFestCurrent')
    expect(screen.getByRole('link', { name: '현장 QR 관리' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: '부스' }))
    expect(screen.getByRole('listbox', { name: 'QR 관리 유형 선택' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: '공연' }))

    expect(screen.getByRole('button', { name: '공연' })).toBeInTheDocument()
    expect(screen.getByText('공연 QR 관리')).toBeInTheDocument()
    expect(screen.queryByText('총 공연 개수')).not.toBeInTheDocument()
    expect(screen.getByText('전체 스캔 수')).toBeInTheDocument()
    expect(screen.getByText('486')).toBeInTheDocument()
    expect(screen.getByText('대기 명수')).toBeInTheDocument()
    expect(screen.getByText('62')).toBeInTheDocument()
    expect(screen.getByText('공연 입장 제어')).toBeInTheDocument()
    expect(screen.getByText('공연장 총 좌석수')).toBeInTheDocument()
    expect(screen.getByText('남은 좌석수')).toBeInTheDocument()
    expect(screen.getByText('입장 가능 대기 번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '입장' })).toBeInTheDocument()

    const waitNumberInput = screen.getByLabelText('입장 가능 대기 번호')
    const waitNumberSlider = screen.getByLabelText('입장 가능 대기 번호 조절')
    expect(waitNumberInput).toHaveValue(30)
    expect(waitNumberSlider).toHaveValue('30')

    fireEvent.change(waitNumberSlider, { target: { value: '45' } })
    expect(waitNumberInput).toHaveValue(45)

    fireEvent.change(waitNumberInput, { target: { value: '25' } })
    expect(waitNumberSlider).toHaveValue('25')

    vi.useFakeTimers()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: '입장' }))
    expect(alertSpy).toHaveBeenCalledWith(
      '입장을 진행합니다! 입장이 완료되기 전까지 입장 버튼이 비활성화 됩니다.'
    )
    expect(screen.getByRole('button', { name: '입장 진행 중' })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('button', { name: '입장' })).toBeEnabled()
    alertSpy.mockRestore()
    vi.useRealTimers()

    expect(screen.getAllByText('대기 번호')).toHaveLength(3)
    expect(screen.getByText('좌석 정원 초과')).toBeInTheDocument()
    expect(screen.getByText('정하준')).toBeInTheDocument()
    expect(screen.getByText('최지우')).toBeInTheDocument()
    expect(screen.getByText('한서아')).toBeInTheDocument()
  })
})
