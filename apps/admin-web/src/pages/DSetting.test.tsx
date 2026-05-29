import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_FESTIVAL_INFO, getFestivalInfo, saveFestivalInfo } from '../lib/localState'
import { DSetting } from './DSetting'

describe('DSetting', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the settings screen with account actions', () => {
    render(<DSetting />)

    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument()
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('축제 정보 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('캠퍼스 페스티벌 2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue('캠퍼스 문화위원회')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-05-30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-05-31')).toBeInTheDocument()
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

  it('shows the created festival information and can save edits', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    saveFestivalInfo({
      ...DEFAULT_FESTIVAL_INFO,
      name: 'FestID 2026',
      host: 'FestID TF',
      startDate: '2026-05-29',
      endDate: '2026-05-30',
      place: '광운대학교 노천극장',
      description: '축제 정보 연결 테스트',
      imageName: 'festival.png',
      imagePreviewUrl: 'data:image/png;base64,festival'
    })

    render(<DSetting />)

    expect(screen.getByDisplayValue('FestID 2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue('FestID TF')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-05-29')).toBeInTheDocument()
    expect(screen.getByDisplayValue('광운대학교 노천극장')).toBeInTheDocument()
    expect(screen.getByText('festival.png')).toBeInTheDocument()
    expect(screen.getByAltText('축제 이미지 미리보기')).toHaveAttribute(
      'src',
      'data:image/png;base64,festival'
    )

    fireEvent.change(screen.getByLabelText('축제명'), { target: { value: 'FestID 수정본' } })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(getFestivalInfo()).toMatchObject({ name: 'FestID 수정본' })
    expect(alertSpy).toHaveBeenCalledWith('축제 정보가 저장되었습니다.')
  })

  it('updates the festival preview when a new image is uploaded', async () => {
    render(<DSetting />)

    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['new image'], 'new-festival.png', { type: 'image/png' })] }
    })

    expect(await screen.findByText('new-festival.png')).toBeInTheDocument()
    expect(await screen.findByAltText('축제 이미지 미리보기')).toHaveAttribute(
      'src',
      expect.stringContaining('data:image/png')
    )
  })
})
