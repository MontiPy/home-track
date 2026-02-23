import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDb } from '@/test/mocks/db'
import { createMockRequest } from '@/test/helpers'

// Mock crypto module for deterministic token hashing
vi.mock(import('crypto'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: {
      ...actual,
      createHash: () => ({
        update: () => ({
          digest: () => 'hashed-test-token',
        }),
      }),
    },
    createHash: () => ({
      update: () => ({
        digest: () => 'hashed-test-token',
      }),
    }),
  }
})

import { POST } from '../action/route'

describe('POST /api/kiosk/action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const request = createMockRequest('http://localhost:3000/api/kiosk/action', {
      method: 'POST',
      body: { type: 'complete-chore', assignmentId: 'assignment-1' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Token is required')
  })

  it('returns 401 with invalid token (household not found)', async () => {
    mockDb.household.findFirst.mockResolvedValue(null)

    const request = createMockRequest(
      'http://localhost:3000/api/kiosk/action?token=invalid-token',
      {
        method: 'POST',
        body: { type: 'complete-chore', assignmentId: 'assignment-1' },
      }
    )

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Invalid kiosk token')
  })

  it('completes a chore assignment successfully', async () => {
    const mockHousehold = { id: 'household-1', name: 'Test Family' }
    mockDb.household.findFirst.mockResolvedValue(mockHousehold)

    const mockAssignment = {
      id: 'assignment-1',
      choreId: 'chore-1',
      memberId: 'member-1',
      dueDate: new Date(),
      completedAt: new Date(),
      chore: { householdId: 'household-1' },
    }
    mockDb.choreAssignment.findFirst.mockResolvedValue(mockAssignment)
    mockDb.choreAssignment.update.mockResolvedValue({
      ...mockAssignment,
      completedAt: new Date(),
    })

    const request = createMockRequest(
      'http://localhost:3000/api/kiosk/action?token=test-token',
      {
        method: 'POST',
        body: { type: 'complete-chore', assignmentId: 'assignment-1' },
      }
    )

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    expect(mockDb.choreAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'assignment-1' },
        data: expect.objectContaining({
          completedAt: expect.any(Date),
        }),
      })
    )
  })

  it('logs pet care successfully', async () => {
    const mockHousehold = { id: 'household-1', name: 'Test Family' }
    mockDb.household.findFirst.mockResolvedValue(mockHousehold)

    const mockTask = {
      id: 'task-1',
      type: 'FEEDING',
      title: 'Feed dog',
      pet: { householdId: 'household-1' },
    }
    mockDb.petCareTask.findFirst.mockResolvedValue(mockTask)

    const mockMember = { id: 'member-1', name: 'Alice' }
    mockDb.member.findFirst.mockResolvedValue(mockMember)

    const mockLog = {
      id: 'log-1',
      taskId: 'task-1',
      memberId: 'member-1',
      completedAt: new Date(),
    }
    mockDb.petCareLog.create.mockResolvedValue(mockLog)

    const request = createMockRequest(
      'http://localhost:3000/api/kiosk/action?token=test-token',
      {
        method: 'POST',
        body: { type: 'log-pet-care', taskId: 'task-1' },
      }
    )

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    expect(mockDb.petCareLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task-1',
          memberId: 'member-1',
        }),
      })
    )
  })

  it('returns 400 for unknown action type', async () => {
    const mockHousehold = { id: 'household-1', name: 'Test Family' }
    mockDb.household.findFirst.mockResolvedValue(mockHousehold)

    const request = createMockRequest(
      'http://localhost:3000/api/kiosk/action?token=test-token',
      {
        method: 'POST',
        body: { type: 'unknown-action' },
      }
    )

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Unknown action type')
  })
})
