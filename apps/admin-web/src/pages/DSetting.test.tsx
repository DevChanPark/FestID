import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DSetting } from './DSetting'

describe('DSetting', () => {
  it('renders the settings screen with account actions', () => {
    render(<DSetting />)

    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument()
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('축제 정보 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('캠퍼스 페스티벌 2025')).toBeInTheDocument()
    expect(screen.getByDisplayValue('캠퍼스 문화위원회')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-05-24')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-05-25')).toBeInTheDocument()
    expect(screen.getByText('축제 이미지')).toBeInTheDocument()
    expect(screen.getByText('이미지 변경')).toBeInTheDocument()
    expect(screen.getByText('미리보기')).toBeInTheDocument()

    expect(screen.getByText('계정 관리')).toBeInTheDocument()
    expect(screen.getAllByText('로그아웃').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '로그아웃' })).toHaveAttribute('href', '/loginAdmin')
    expect(screen.getByText('회원 탈퇴')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeInTheDocument()
    expect(screen.queryByText('계정 및 알림')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('aria-current', 'page')
  })
})
