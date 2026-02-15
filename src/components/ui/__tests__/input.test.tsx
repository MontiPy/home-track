import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '../input'

describe('Input', () => {
  it('renders with type text', () => {
    render(<Input type="text" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('handles value changes', () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'hello world' } })
    expect(input.value).toBe('hello world')
  })

  it('supports placeholder', () => {
    render(<Input placeholder="Enter text..." />)
    const input = screen.getByPlaceholderText('Enter text...')
    expect(input).toBeInTheDocument()
  })

  it('supports disabled state', () => {
    render(<Input disabled data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input.className).toContain('custom-input')
  })

  it('renders with a label when provided', () => {
    render(<Input label="Email" id="email" />)
    const label = screen.getByText('Email')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'email')
  })

  it('renders error message when provided', () => {
    render(<Input error="This field is required" data-testid="input" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    const input = screen.getByTestId('input')
    expect(input.className).toContain('border-destructive')
  })
})
