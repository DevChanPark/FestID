import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SetPass } from './SetPass'

describe('SetPass', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/setPass')
  })

  it('renders the pass settings screen from Figma', () => {
    render(<SetPass />)

    expect(screen.getByRole('heading', { name: '패스 설정 관리' })).toBeInTheDocument()
    expect(screen.getByText('패스 설정을 수정합니다.')).toBeInTheDocument()
    expect(screen.getByText('재학생 패스')).toBeInTheDocument()
    expect(screen.getByText('발급 조건 :')).toBeInTheDocument()
    expect(screen.getByDisplayValue('휴학 여부')).toBeInTheDocument()
    expect(screen.getByDisplayValue('졸업 여부')).toBeInTheDocument()
    expect(screen.getByDisplayValue('증명 서류 형식 제한')).toBeInTheDocument()
    expect(screen.getByDisplayValue('성인 인증 여부')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '이전' })).toHaveAttribute('href', '/managePass')
    expect(screen.getByRole('button', { name: '패스 수정 완료' })).toBeInTheDocument()
  })

  it('renders guest pass conditions from the selected pass query', () => {
    window.history.pushState({}, '', '/setPass?pass=guest')

    render(<SetPass />)

    expect(screen.getByText('외부인 패스')).toBeInTheDocument()
    expect(screen.getByDisplayValue('성인 인증 여부')).toBeInTheDocument()
    expect(screen.getByDisplayValue('초대 여부')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /활성화하기/ })).toHaveLength(2)
    expect(screen.queryByDisplayValue('휴학 여부')).not.toBeInTheDocument()
  })

  it('renders staff pass conditions from the selected pass query', () => {
    window.history.pushState({}, '', '/setPass?pass=staff')

    render(<SetPass />)

    expect(screen.getByText('스태프 패스')).toBeInTheDocument()
    expect(screen.getByDisplayValue('재학 여부')).toBeInTheDocument()
    expect(screen.getByDisplayValue('증명 서류 형식 제한')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('휴학 여부')).not.toBeInTheDocument()
  })

  it('toggles condition status icons when clicked', () => {
    render(<SetPass />)

    const leaveToggle = screen.getByRole('button', { name: '휴학 여부 비활성화하기' })
    expect(leaveToggle).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(leaveToggle)
    expect(screen.getByRole('button', { name: '휴학 여부 활성화하기' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )

    fireEvent.click(screen.getByRole('button', { name: '휴학 여부 활성화하기' }))
    expect(screen.getByRole('button', { name: '휴학 여부 비활성화하기' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})
