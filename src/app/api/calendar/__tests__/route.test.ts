import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { mockSession, mockAuthFn } from '@/test/mocks/auth'
import { createMockRequest } from '@/test/helpers'
import { GET, POST } from '../route'

describe('GET /api/calendar', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('returns calendar events', async () => {
    const events = [
      { id: '1', title: 'Meeting', startTime: new Date(), member: { id: 'member-1', name: 'Test', color: '#000' } },
    ]
    mockDb.calendarEvent.findMany.mockResolvedValue(events)

    const request = createMockRequest('http://localhost:3000/api/calendar')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthFn.mockResolvedValue(null)
    const request = createMockRequest('http://localhost:3000/api/calendar')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/calendar', () => {
  beforeEach(() => {
    mockAuthFn.mockResolvedValue(mockSession)
  })

  it('creates a calendar event', async () => {
    const event = {
      id: '1',
      title: 'New Event',
      startTime: '2025-06-01T10:00:00Z',
      endTime: '2025-06-01T11:00:00Z',
      member: { id: 'member-1', name: 'Test', color: '#000' },
    }
    mockDb.calendarEvent.create.mockResolvedValue(event)

    const request = createMockRequest('http://localhost:3000/api/calendar', {
      method: 'POST',
      body: {
        title: 'New Event',
        startTime: '2025-06-01T10:00:00Z',
        endTime: '2025-06-01T11:00:00Z',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/calendar', {
      method: 'POST',
      body: { title: 'No times' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when end time is before start time', async () => {
    const request = createMockRequest('http://localhost:3000/api/calendar', {
      method: 'POST',
      body: {
        title: 'Bad Event',
        startTime: '2025-06-01T12:00:00Z',
        endTime: '2025-06-01T10:00:00Z',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
