import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST } from '../route'

describe('GET /api/vault', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns vault items', async () => {
    const items = [
      {
        id: '1',
        title: 'Insurance',
        content: 'Policy details',
        category: 'Insurance',
        restricted: false,
        householdId: 'household-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { documents: 2 },
      },
    ]
    mockDb.vaultItem.findMany.mockResolvedValue(items)

    const request = createMockRequest('http://localhost:3000/api/vault')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data[0].documentCount).toBe(2)
  })

  it('filters restricted items for CHILD role', async () => {
    mockAuthFn.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: 'CHILD' },
    })

    mockDb.vaultItem.findMany.mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/vault')
    await GET(request)

    expect(mockDb.vaultItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ restricted: false }),
      })
    )
  })
})

describe('POST /api/vault', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a vault item', async () => {
    const item = {
      id: '1',
      title: 'New Item',
      content: 'Content',
      category: 'Home',
      restricted: false,
      _count: { documents: 0 },
    }
    mockDb.vaultItem.create.mockResolvedValue(item)

    const request = createMockRequest('http://localhost:3000/api/vault', {
      method: 'POST',
      body: { title: 'New Item', content: 'Content', category: 'Home' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 403 for CHILD role', async () => {
    mockAuthFn.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: 'CHILD' },
    })

    const request = createMockRequest('http://localhost:3000/api/vault', {
      method: 'POST',
      body: { title: 'Item', content: 'Content', category: 'Home' },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/vault', {
      method: 'POST',
      body: { title: 'Only title' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
