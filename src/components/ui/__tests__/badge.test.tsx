import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-primary')
  })

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>)
    const badge = screen.getByText('Secondary')
    expect(badge.className).toContain('bg-secondary')
  })

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive</Badge>)
    const badge = screen.getByText('Destructive')
    expect(badge.className).toContain('bg-destructive')
  })

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>)
    const badge = screen.getByText('Outline')
    expect(badge.className).toContain('border')
    expect(badge.className).toContain('text-foreground')
  })

  it('renders children', () => {
    render(<Badge>Badge Content</Badge>)
    expect(screen.getByText('Badge Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Styled</Badge>)
    const badge = screen.getByText('Styled')
    expect(badge.className).toContain('custom-badge')
    expect(badge.className).toContain('rounded-full')
  })
})
