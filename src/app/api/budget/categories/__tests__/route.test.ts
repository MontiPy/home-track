import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST } from '../route'

describe('GET /api/budget/categories', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns categories with spent amounts', async () => {
    const categories = [
      {
        id: '1',
        name: 'Groceries',
        monthlyLimit: { toString: () => '800' },
        color: '#059669',
        householdId: 'household-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        expenses: [{ amount: { toString: () => '150' } }, { amount: { toString: () => '50' } }],
      },
    ]
    mockDb.budgetCategory.findMany.mockResolvedValue(categories)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].spent).toBe(200)
  })

  it('returns 403 for CHILD role', async () => {
    mockAuthFn.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: 'CHILD' },
    })

    const response = await GET()
    expect(response.status).toBe(403)
  })
})

describe('POST /api/budget/categories', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a category', async () => {
    const category = {
      id: '1',
      name: 'Transport',
      monthlyLimit: null,
      color: '#6B7280',
    }
    mockDb.budgetCategory.create.mockResolvedValue(category)

    const request = createMockRequest('http://localhost:3000/api/budget/categories', {
      method: 'POST',
      body: { name: 'Transport' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/budget/categories', {
      method: 'POST',
      body: { color: '#000000' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
