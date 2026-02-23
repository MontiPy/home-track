import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST, PUT } from '../route'

describe('GET /api/household', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns household with members', async () => {
    const household = {
      id: 'household-1',
      name: 'Test Family',
      members: [{ id: 'member-1', name: 'Test', email: 'test@example.com', role: 'ADMIN' }],
    }
    mockDb.household.findUnique.mockResolvedValue(household)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Test Family')
  })

  it('returns 404 when no household', async () => {
    mockAuthFn.mockResolvedValue({ user: { email: 'test@example.com' } })
    const response = await GET()
    expect(response.status).toBe(404)
  })
})

describe('POST /api/household', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue({
      user: {
        email: 'new@example.com',
        name: 'New User',
        image: null,
        googleId: '987654321',
      },
    })
  })

  it('creates a household', async () => {
    const household = { id: 'household-new', name: 'New Family', members: [] }
    mockDb.household.create.mockResolvedValue(household)

    const request = createMockRequest('http://localhost:3000/api/household', {
      method: 'POST',
      body: { name: 'New Family', location: 'NYC' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/household', {
      method: 'POST',
      body: { location: 'NYC' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when user already has household', async () => {
    mockAuthFn.mockResolvedValue(mockSession) // has householdId

    const request = createMockRequest('http://localhost:3000/api/household', {
      method: 'POST',
      body: { name: 'Another Family' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/household', () => {
  it('updates household for admin', async () => {
    mockAuthFn.mockResolvedValue(mockSession) // role: ADMIN

    const updated = { id: 'household-1', name: 'Updated Family' }
    mockDb.household.update.mockResolvedValue(updated)

    const request = createMockRequest('http://localhost:3000/api/household', {
      method: 'PUT',
      body: { name: 'Updated Family' },
    })

    const response = await PUT(request)
    expect(response.status).toBe(200)
  })

  it('returns 403 for non-admin', async () => {
    mockAuthFn.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: 'MEMBER' },
    })

    const request = createMockRequest('http://localhost:3000/api/household', {
      method: 'PUT',
      body: { name: 'Updated' },
    })

    const response = await PUT(request)
    expect(response.status).toBe(403)
  })
})
