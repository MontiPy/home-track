import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../card'

describe('Card', () => {
  it('renders Card with all subcomponents', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
      </Card>
    )

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card.className).toContain('custom-class')
    expect(card.className).toContain('rounded-lg')
  })

  it('applies custom className to CardHeader', () => {
    render(
      <CardHeader className="header-class" data-testid="header">
        Header
      </CardHeader>
    )
    const header = screen.getByTestId('header')
    expect(header.className).toContain('header-class')
  })

  it('applies custom className to CardTitle', () => {
    render(<CardTitle className="title-class">Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.className).toContain('title-class')
    expect(title.className).toContain('font-semibold')
  })

  it('applies custom className to CardDescription', () => {
    render(
      <CardDescription className="desc-class">Description</CardDescription>
    )
    const desc = screen.getByText('Description')
    expect(desc.className).toContain('desc-class')
    expect(desc.className).toContain('text-muted-foreground')
  })

  it('applies custom className to CardContent', () => {
    render(
      <CardContent className="content-class" data-testid="content">
        Content
      </CardContent>
    )
    const content = screen.getByTestId('content')
    expect(content.className).toContain('content-class')
  })

  it('renders children correctly', () => {
    render(
      <Card>
        <CardContent>
          <span>Child Element</span>
        </CardContent>
      </Card>
    )
    expect(screen.getByText('Child Element')).toBeInTheDocument()
  })

  it('renders CardTitle as an h3 element', () => {
    render(<CardTitle>Heading</CardTitle>)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Heading')
  })

  it('renders CardDescription as a p element', () => {
    render(<CardDescription>Paragraph text</CardDescription>)
    const paragraph = screen.getByText('Paragraph text')
    expect(paragraph.tagName).toBe('P')
  })
})
