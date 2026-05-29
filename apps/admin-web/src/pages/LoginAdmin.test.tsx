import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken } from '../lib/auth'
import { LoginAdmin } from './LoginAdmin'

describe('LoginAdmin', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('renders the Figma login copy and actions', () => {
    render(<LoginAdmin />)

    expect(screen.getByText('CamPass')).toBeInTheDocument()
    expect(screen.getByText(/입장부터 혜택까지/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /모바일 신분증 로그인/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /발급하기/ })).toHaveAttribute('href', '/submitInfo')
  })

  it('opens the OmniOne CX auth window and treats cancel as dev login success', () => {
    const onAuthenticated = vi.fn()
    render(<LoginAdmin onAuthenticated={onAuthenticated} />)

    fireEvent.click(screen.getByRole('button', { name: /모바일 신분증 로그인/ }))

    expect(screen.getByRole('dialog', { name: '모바일 신분증 표준인증' })).toBeInTheDocument()
    expect(screen.getByText('OmniOne CX')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(getAccessToken()).toBe('dev-mobile-id-cancel-login')
    expect(onAuthenticated).toHaveBeenCalledWith('/submitInfo')
  })
})
