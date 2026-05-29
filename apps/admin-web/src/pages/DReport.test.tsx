import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DReport } from './DReport'

describe('DReport', () => {
  it('renders the operating report screen from Figma', () => {
    render(<DReport />)

    expect(screen.getByRole('heading', { name: '운영 리포트' })).toBeInTheDocument()
    expect(screen.getAllByText('Day 1').length).toBeGreaterThan(0)
    expect(screen.getByText('총 방문자 수')).toBeInTheDocument()
    expect(screen.getAllByText('1,009').length).toBeGreaterThan(0)
    expect(screen.getByText('현장 입장 수')).toBeInTheDocument()
    expect(screen.getByText('QR 인증 수')).toBeInTheDocument()
    expect(screen.getByText('부스 참여율')).toBeInTheDocument()

    expect(screen.getByText('시간대별 방문 추이')).toBeInTheDocument()
    expect(screen.getByLabelText('시간대별 방문 추이 차트')).toBeInTheDocument()
    expect(screen.getByText('운영 요약')).toBeInTheDocument()
    expect(screen.getByText('오전 대비 오후 방문 28% 증가')).toBeInTheDocument()
    expect(screen.getByText('인기 부스 TOP 5')).toBeInTheDocument()
    expect(screen.getByText('푸드트럭 존')).toBeInTheDocument()
    expect(screen.getByText('참여 유형 분포')).toBeInTheDocument()
    expect(screen.getByLabelText('참여 유형 분포 차트')).toBeInTheDocument()

    expect(screen.getByText('이상 징후 목록')).toBeInTheDocument()
    expect(screen.getByText('QR 중복 인증')).toBeInTheDocument()
    expect(screen.queryByText('상태')).not.toBeInTheDocument()
    expect(screen.getByText('리포트 내보내기')).toBeInTheDocument()
    expect(screen.getByText('Day 선택')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Day/ })[1])
    expect(screen.getByRole('listbox', { name: '리포트 Day 선택' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: /Day 2/ }))
    expect(screen.getByText('Day 1, Day 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /다운로드/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '운영 리포트' })).toHaveAttribute('aria-current', 'page')
  })
})
