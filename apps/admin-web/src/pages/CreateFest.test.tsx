import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, setAccessToken } from '../lib/auth'
import { getFestivalInfo } from '../lib/localState'
import { CreateFest } from './CreateFest'

describe('CreateFest', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    clearAccessToken()
    localStorage.clear()
  })

  it('renders the festival creation form from the Figma screen', () => {
    render(<CreateFest />)

    expect(screen.getByRole('heading', { name: '새 축제 생성' })).toBeInTheDocument()
    expect(screen.getByText('관리할 축제를 생성합니다.')).toBeInTheDocument()
    expect(screen.getAllByText('기본 정보 입력').length).toBeGreaterThan(0)
    expect(screen.getByText('패스 템플릿 설정')).toBeInTheDocument()
    expect(screen.getByLabelText('축제명')).toHaveAttribute('placeholder', '축제명을 입력하세요 ...')
    expect(screen.getByLabelText('학교명')).toHaveAttribute('placeholder', '학교명을 입력하세요 ...')
    expect(screen.getByLabelText('운영 시작일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('운영 종료일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('운영 장소')).toHaveAttribute('placeholder', '운영 장소를 입력하세요 ...')
    expect(screen.getByLabelText('축제 설명')).toHaveAttribute('placeholder', '축제 설명을 입력하세요 ...')
    expect(screen.getByLabelText('축제 설명')).toHaveClass('py-3')
    expect(screen.getByText('축제 이미지를 추가해주세요 ...')).toBeInTheDocument()
    expect(screen.getByText('PDF, JPG, PNG 파일 업로드')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toHaveAttribute('type', 'submit')
  })

  it('shows the selected festival image file name and preview', async () => {
    render(<CreateFest />)

    const file = new File(['image'], 'festival.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('축제 이미지'), { target: { files: [file] } })

    expect(screen.getByText('festival.png')).toBeInTheDocument()
    expect(await screen.findByAltText('축제 이미지 미리보기')).toHaveAttribute(
      'src',
      expect.stringContaining('data:image/png')
    )
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

  it('stores created festival information for dashboard settings', async () => {
    setAccessToken('admin-token')
    fetchMock.mockResolvedValueOnce(jsonResponse({ fileUrl: '/uploads/festival.png', path: 'festival.png' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ festival: { id: 'festival-1' } }))

    const onCreated = vi.fn()
    render(<CreateFest onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText('축제명'), { target: { value: 'FestID 2026' } })
    fireEvent.change(screen.getByLabelText('학교명'), { target: { value: 'FestID TF' } })
    fireEvent.change(screen.getByLabelText('운영 시작일'), { target: { value: '2026-05-29' } })
    fireEvent.change(screen.getByLabelText('운영 종료일'), { target: { value: '2026-05-30' } })
    fireEvent.change(screen.getByLabelText('운영 장소'), { target: { value: '광운대학교 노천극장' } })
    fireEvent.change(screen.getByLabelText('축제 설명'), { target: { value: '축제 정보 연결 테스트' } })
    fireEvent.change(screen.getByLabelText('축제 이미지'), {
      target: { files: [new File(['image'], 'festival.png', { type: 'image/png' })] }
    })
    fireEvent.submit(document.querySelector('#create-fest-form') as HTMLFormElement)

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('/managePass'))
    expect(getFestivalInfo()).toMatchObject({
      name: 'FestID 2026',
      host: 'FestID TF',
      startDate: '2026-05-29',
      endDate: '2026-05-30',
      place: '광운대학교 노천극장',
      description: '축제 정보 연결 테스트',
      imageName: 'festival.png',
      backendId: 'festival-1'
    })
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
