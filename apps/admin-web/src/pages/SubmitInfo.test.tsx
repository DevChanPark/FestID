import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSubmittedAdminInfo } from '../lib/localState'
import { SubmitInfo } from './SubmitInfo'

describe('SubmitInfo', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('renders the administrator information form from the Figma screen', () => {
    render(<SubmitInfo />)

    expect(screen.getByRole('heading', { name: '관리자 정보 입력 및 자료 제출' })).toBeInTheDocument()
    expect(screen.getByText('관리자임을 증명할 수 있는 정보와 자료를 제출해주세요.')).toBeInTheDocument()
    expect(screen.getByText('증명 자료를 업로드 해주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toHaveAttribute('placeholder', '이름을 입력하세요 ...')
    expect(screen.getByLabelText('이메일')).toHaveAttribute('placeholder', '이메일을 입력하세요 ...')
    expect(screen.getByLabelText('직책')).toHaveAttribute('placeholder', '직책을 입력하세요 ...')
    expect(screen.getByLabelText('소속 기관')).toHaveAttribute('placeholder', '소속 기관을 입력하세요 ...')
    expect(screen.queryByText('연락처')).not.toBeInTheDocument()
    expect(screen.queryByText('관리자 정보 입력 및 자료 제출', { selector: 'button *' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '관리자 VC 발급 요청' })).toHaveAttribute('type', 'submit')
  })

  it('accepts only PDF, JPG, and PNG proof files', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const { container } = render(<SubmitInfo />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['proof'], 'admin-proof.png', { type: 'image/png' })]
      }
    })

    expect(screen.getByText('admin-proof.png')).toBeInTheDocument()
    expect(await screen.findByAltText('증명 자료 미리보기')).toHaveAttribute(
      'src',
      expect.stringContaining('data:image/png')
    )

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['bad'], 'memo.txt', { type: 'text/plain' })]
      }
    })

    expect(alertSpy).toHaveBeenCalledWith('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
    expect(screen.getByText('증명 자료를 업로드 해주세요.')).toBeInTheDocument()

    alertSpy.mockRestore()
  })

  it('stores submitted information for the VC waiting screen', () => {
    const onSubmitted = vi.fn()
    const { container } = render(<SubmitInfo onSubmitted={onSubmitted} />)

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('직책'), { target: { value: '운영팀장' } })
    fireEvent.change(screen.getByLabelText('소속 기관'), { target: { value: '광운대학교 총학생회' } })

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['proof'], 'admin-proof.pdf', { type: 'application/pdf' })]
      }
    })
    fireEvent.submit(screen.getByTestId('submit-info-form'))

    expect(getSubmittedAdminInfo()).toMatchObject({
      name: '홍길동',
      email: 'admin@example.com',
      role: '운영팀장',
      organization: '광운대학교 총학생회',
      proofFileName: 'admin-proof.pdf'
    })
    expect(onSubmitted).toHaveBeenCalledWith('/waitVC')
  })
})
