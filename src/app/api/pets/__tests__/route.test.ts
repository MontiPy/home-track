import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST } from '../route'

describe('GET /api/pets', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns pets for the household', async () => {
    const pets = [
      {
        id: '1',
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        photoUrl: null,
        birthday: null,
        weight: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        householdId: 'household-1',
        _count: { careTasks: 2 },
        careTasks: [
          {
            logs: [
              { completedAt: new Date(), member: { id: 'member-1', name: 'Test' } },
            ],
          },
        ],
      },
    ]
    mockDb.pet.findMany.mockResolvedValue(pets)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Buddy')
  })
})

describe('POST /api/pets', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a pet', async () => {
    const pet = { id: '1', name: 'Whiskers', species: 'Cat', _count: { careTasks: 0 } }
    mockDb.pet.create.mockResolvedValue(pet)

    const request = createMockRequest('http://localhost:3000/api/pets', {
      method: 'POST',
      body: { name: 'Whiskers', species: 'Cat' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when name or species is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/pets', {
      method: 'POST',
      body: { name: 'Buddy' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
