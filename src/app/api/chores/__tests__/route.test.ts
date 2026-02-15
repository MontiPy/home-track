import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST } from '../route'

describe('GET /api/chores', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns chores for the household', async () => {
    const mockChores = [
      { id: '1', title: 'Dishes', frequency: 'DAILY', _count: { assignments: 2 } },
    ]
    mockDb.chore.findMany.mockResolvedValue(mockChores)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockChores)
    expect(mockDb.chore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId: 'household-1' },
      })
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthFn.mockResolvedValue(null)

    const response = await GET()
    expect(response.status).toBe(401)
  })
})

describe('POST /api/chores', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a chore with valid data', async () => {
    const newChore = {
      id: '1',
      title: 'Vacuum',
      frequency: 'WEEKLY',
      householdId: 'household-1',
      _count: { assignments: 0 },
    }
    mockDb.chore.create.mockResolvedValue(newChore)

    const request = createMockRequest('http://localhost:3000/api/chores', {
      method: 'POST',
      body: { title: 'Vacuum', frequency: 'WEEKLY' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.title).toBe('Vacuum')
  })

  it('returns 400 when title is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/chores', {
      method: 'POST',
      body: { frequency: 'WEEKLY' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when frequency is invalid', async () => {
    const request = createMockRequest('http://localhost:3000/api/chores', {
      method: 'POST',
      body: { title: 'Test', frequency: 'INVALID' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
