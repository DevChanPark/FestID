import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginAdmin } from './LoginAdmin'

describe('LoginAdmin', () => {
  it('renders the Figma login copy and actions', () => {
    render(<LoginAdmin />)

    expect(screen.getByText('CamPass')).toBeInTheDocument()
    expect(screen.getByText(/입장부터 혜택까지/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /모바일 신분증 로그인/ })).toHaveAttribute(
      'href',
      '/submitInfo'
    )
    expect(screen.getByRole('link', { name: /발급하기/ })).toHaveAttribute('href', '/submitInfo')
  })
})
