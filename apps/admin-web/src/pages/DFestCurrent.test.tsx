import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DFestCurrent } from './DFestCurrent'

describe('DFestCurrent', () => {
  it('renders the current festival dashboard from Figma', () => {
    render(<DFestCurrent />)

    expect(screen.getByRole('heading', { name: '축제현황' })).toBeInTheDocument()
    expect(screen.getByText('진행중')).toBeInTheDocument()
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('검색창')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '축제 1' })).toBeInTheDocument()

    expect(screen.getByText('전체 부스 방문수')).toBeInTheDocument()
    expect(screen.getByText('52')).toBeInTheDocument()
    expect(screen.getByText('총 현장 입장 수')).toBeInTheDocument()
    expect(screen.getByText('214')).toBeInTheDocument()
    expect(screen.getByText('전체 참여자 수')).toBeInTheDocument()
    expect(screen.getByText('1009')).toBeInTheDocument()
    expect(screen.getByText('체험자 완료 수')).toBeInTheDocument()
    expect(screen.getByText('58')).toBeInTheDocument()

    expect(screen.getByText('시간대별 QR 인증 추이')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'QR Time' })).toBeInTheDocument()
    expect(screen.queryByText('드롭다운')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '현장 QR 관리' })).toHaveAttribute('href', '/dmanageQR')
    expect(screen.getByRole('link', { name: '부스 관리' })).toHaveAttribute('href', '/dmanageBooth')
  })
})
