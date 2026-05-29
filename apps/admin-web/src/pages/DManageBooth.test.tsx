import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DManageBooth } from './DManageBooth'

describe('DManageBooth', () => {
  it('renders the booth management upload screen from Figma', () => {
    render(<DManageBooth />)

    expect(screen.getByRole('heading', { name: '부스 관리' })).toBeInTheDocument()
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('상태 요약')).toBeInTheDocument()
    expect(screen.getByText('등록 예정 부스 수')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('이미지 매칭 완료')).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('오류 항목')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    expect(screen.getByText('파일 업로드')).toBeInTheDocument()
    expect(screen.getByText('업로드 규칙')).toBeInTheDocument()
    expect(screen.getByText('파일 구조')).toBeInTheDocument()
    expect(screen.getByText('booths.csv')).toBeInTheDocument()
    expect(screen.getByText('CSV 파일 선택')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '업로드' })).toBeInTheDocument()
    expect(screen.getByText('부스 목록')).toBeInTheDocument()
    expect(screen.getAllByText('부스명')).toHaveLength(2)
    expect(screen.getByText('부스 2번')).toBeInTheDocument()
    expect(screen.getByText('BEER HOUSE')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '부스 관리' })).toHaveAttribute('aria-current', 'page')
  })
})
