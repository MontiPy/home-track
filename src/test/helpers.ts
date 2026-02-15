import { NextRequest } from 'next/server'

export function createMockRequest(
  url: string,
  options?: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  }
): NextRequest {
  const { method = 'GET', body, headers = {} } = options || {}

  const init: {
    method: string
    headers: Record<string, string>
    body?: string
  } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}
