import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdminDashboardLayout, DashboardContent } from './components/AdminDashboardLayout'
import { LoginAdmin } from './pages/LoginAdmin'

describe('responsive layout', () => {
  it('keeps dashboard content fluid instead of subtracting a fixed sidebar width', () => {
    render(
      <AdminDashboardLayout activeSection="current">
        <DashboardContent>
          <div data-testid="dashboard-child" />
        </DashboardContent>
      </AdminDashboardLayout>
    )

    const content = screen.getByTestId('dashboard-child').parentElement

    expect(content).toHaveClass('w-full', 'max-w-full', 'min-w-0')
    expect(content).not.toHaveClass('lg:w-[calc(100%-287px)]')
  })

  it('uses the shared fluid login card instead of a fixed laptop-height card', () => {
    render(<LoginAdmin />)

    const loginCard = screen.getByText('CamPass').closest('section')

    expect(loginCard).toHaveClass('admin-login-card')
    expect(loginCard).not.toHaveClass('lg:h-[765px]')
  })
})
