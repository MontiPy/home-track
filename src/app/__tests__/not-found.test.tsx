import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => (
    <svg data-testid="home-icon" className={className} />
  ),
}))

import NotFound from '../not-found'

describe('NotFound', () => {
  it('renders 404 text', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('renders descriptive message', () => {
    render(<NotFound />)
    expect(
      screen.getByText(
        /the page you're looking for doesn't exist or has been moved/i
      )
    ).toBeInTheDocument()
  })

  it('has a link back to dashboard', () => {
    render(<NotFound />)
    const link = screen.getByRole('link', { name: /back to dashboard/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })
})
