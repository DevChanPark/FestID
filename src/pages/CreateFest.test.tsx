import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreateFest } from './CreateFest'

describe('CreateFest', () => {
  it('renders the festival creation form from the Figma screen', () => {
    render(<CreateFest />)

    expect(screen.getByRole('heading', { name: '새 축제 생성' })).toBeInTheDocument()
    expect(screen.getByText('관리할 축제를 생성합니다.')).toBeInTheDocument()
    expect(screen.getAllByText('기본 정보 입력').length).toBeGreaterThan(0)
    expect(screen.getByText('패스 템플릿 설정')).toBeInTheDocument()
    expect(screen.getByLabelText('축제명')).toHaveAttribute('placeholder', '축제명을 입력하세요 ...')
    expect(screen.getByLabelText('주최사')).toHaveAttribute('placeholder', '주최사를 입력하세요 ...')
    expect(screen.getByLabelText('운영 시작일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('운영 종료일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('운영 장소')).toHaveAttribute('placeholder', '운영 장소를 입력하세요 ...')
    expect(screen.getByLabelText('축제 설명')).toHaveAttribute('placeholder', '축제 설명을 입력하세요 ...')
    expect(screen.getByLabelText('축제 설명')).toHaveClass('py-3')
    expect(screen.getByText('축제 이미지를 추가해주세요 ...')).toBeInTheDocument()
    expect(screen.getByText('PDF, JPG, PNG 파일 업로드')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다음' })).toHaveAttribute('href', '/managePass')
  })

  it('shows the selected festival image file name', () => {
    render(<CreateFest />)

    const file = new File(['image'], 'festival.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('축제 이미지'), { target: { files: [file] } })

    expect(screen.getByText('festival.png')).toBeInTheDocument()
  })

  it('rejects unsupported festival image file types', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    render(<CreateFest />)

    const file = new File(['bad'], 'festival.webp', { type: 'image/webp' })
    fireEvent.change(screen.getByLabelText('축제 이미지'), { target: { files: [file] } })

    expect(alertSpy).toHaveBeenCalledWith('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
    expect(screen.getByText('축제 이미지를 추가해주세요 ...')).toBeInTheDocument()

    alertSpy.mockRestore()
  })
})
