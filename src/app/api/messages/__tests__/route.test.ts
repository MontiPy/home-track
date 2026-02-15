import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST } from '../route'

describe('GET /api/messages', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns messages for the household', async () => {
    const messages = [
      { id: '1', content: 'Hello', type: 'NOTE', author: { id: 'member-1', name: 'Test', color: '#000', avatarUrl: null } },
    ]
    mockDb.message.findMany.mockResolvedValue(messages)

    const request = createMockRequest('http://localhost:3000/api/messages')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
  })
})

describe('POST /api/messages', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a message', async () => {
    const msg = { id: '1', content: 'Test message', type: 'NOTE', author: { id: 'member-1', name: 'Test', color: '#000', avatarUrl: null } }
    mockDb.message.create.mockResolvedValue(msg)

    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: { content: 'Test message', type: 'NOTE' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when content is empty', async () => {
    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: { content: '', type: 'NOTE' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when type is invalid', async () => {
    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: { content: 'Test', type: 'INVALID_TYPE' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
