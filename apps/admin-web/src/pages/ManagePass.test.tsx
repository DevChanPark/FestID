import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ManagePass } from './ManagePass'

describe('ManagePass', () => {
  it('renders the pass template setup screen from Figma', () => {
    render(<ManagePass />)

    expect(screen.getByRole('heading', { name: '새 축제 생성' })).toBeInTheDocument()
    expect(screen.getAllByText('패스 템플릿 설정')).toHaveLength(2)
    expect(screen.getByText('패스 발급 조건들을 설정해주세요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /재학생 패스/ })).toHaveAttribute(
      'href',
      '/setPass?pass=student'
    )
    expect(screen.getByRole('link', { name: /외부인 패스/ })).toHaveAttribute(
      'href',
      '/setPass?pass=entry'
    )
    expect(screen.getByRole('link', { name: /스태프 패스/ })).toHaveAttribute(
      'href',
      '/setPass?pass=staff'
    )
    expect(screen.getByRole('link', { name: '축제 정보 수정하기' })).toHaveAttribute(
      'href',
      '/createFest'
    )
    expect(screen.getByRole('link', { name: '축제 생성하기' })).toHaveAttribute(
      'href',
      '/dFestCurrent'
    )
  })
})
