import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <svg data-testid="alert-icon" className={className} />
  ),
}))

import ErrorPage from '../error'

describe('Error', () => {
  const mockReset = vi.fn()

  const defaultError = new Error('Test error') as Error & { digest?: string }

  beforeEach(() => {
    mockReset.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders error message', () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText(
        /an unexpected error occurred/i
      )
    ).toBeInTheDocument()
  })

  it('calls reset on button click', () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />)
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(tryAgainButton)
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('shows error digest when provided', () => {
    const errorWithDigest = new Error('Test error') as Error & {
      digest?: string
    }
    errorWithDigest.digest = 'abc123'
    render(<ErrorPage error={errorWithDigest} reset={mockReset} />)
    expect(screen.getByText(/error id: abc123/i)).toBeInTheDocument()
  })

  it('does not show error digest when not provided', () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />)
    expect(screen.queryByText(/error id:/i)).not.toBeInTheDocument()
  })

  it('renders the alert icon', () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />)
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
  })

  it('renders a go home button', () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />)
    const goHomeButton = screen.getByRole('button', { name: /go home/i })
    expect(goHomeButton).toBeInTheDocument()
  })
})
