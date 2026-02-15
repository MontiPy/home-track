import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST, DELETE } from '../route'

describe('GET /api/grocery', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns grocery items for the household', async () => {
    const items = [
      { id: '1', name: 'Milk', checked: false, addedBy: { id: 'member-1', name: 'Test' } },
    ]
    mockDb.groceryItem.findMany.mockResolvedValue(items)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(items)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthFn.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })
})

describe('POST /api/grocery', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a grocery item', async () => {
    const newItem = { id: '1', name: 'Bread', addedBy: { id: 'member-1', name: 'Test' } }
    mockDb.groceryItem.create.mockResolvedValue(newItem)

    const request = createMockRequest('http://localhost:3000/api/grocery', {
      method: 'POST',
      body: { name: 'Bread', category: 'Bakery' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/grocery', {
      method: 'POST',
      body: { category: 'Dairy' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/grocery', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('deletes checked items when ?checked=true', async () => {
    mockDb.groceryItem.deleteMany.mockResolvedValue({ count: 3 })

    const request = createMockRequest('http://localhost:3000/api/grocery?checked=true', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.deleted).toBe(3)
  })

  it('returns 400 without ?checked=true', async () => {
    const request = createMockRequest('http://localhost:3000/api/grocery', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    expect(response.status).toBe(400)
  })
})
