import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SubmitInfo } from './SubmitInfo'

describe('SubmitInfo', () => {
  it('renders the administrator information form from the Figma screen', () => {
    render(<SubmitInfo />)

    expect(screen.getByRole('heading', { name: '관리자 정보 입력 및 자료 제출' })).toBeInTheDocument()
    expect(screen.getByText('관리자임을 증명할 수 있는 정보와 자료를 제출해주세요.')).toBeInTheDocument()
    expect(screen.getByText('이미지를 업로드 해주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toHaveAttribute('placeholder', '이름을 입력하세요 ...')
    expect(screen.getByLabelText('이메일')).toHaveAttribute('placeholder', '이메일을 입력하세요 ...')
    expect(screen.getByLabelText('직책')).toHaveAttribute('placeholder', '직책을 입력하세요 ...')
    expect(screen.getByLabelText('소속 기관')).toHaveAttribute('placeholder', '소속 기관을 입력하세요 ...')
    expect(screen.queryByText('연락처')).not.toBeInTheDocument()
    expect(screen.queryByText('관리자 정보 입력 및 자료 제출', { selector: 'button *' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '관리자 VC 발급 요청' })).toHaveAttribute('type', 'submit')
  })

  it('accepts only PDF, JPG, and PNG proof files', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const { container } = render(<SubmitInfo />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['proof'], 'admin-proof.png', { type: 'image/png' })]
      }
    })

    expect(screen.getByText('admin-proof.png')).toBeInTheDocument()

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['bad'], 'memo.txt', { type: 'text/plain' })]
      }
    })

    expect(alertSpy).toHaveBeenCalledWith('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
    expect(screen.getByText('이미지를 업로드 해주세요.')).toBeInTheDocument()

    alertSpy.mockRestore()
  })
})
