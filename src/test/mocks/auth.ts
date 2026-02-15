import { vi } from 'vitest'

export const mockSession = {
  user: {
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    memberId: 'member-1',
    householdId: 'household-1',
    role: 'ADMIN',
    memberName: 'Test User',
    memberColor: '#4F46E5',
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export const mockAuthFn = vi.fn().mockResolvedValue(mockSession)

vi.mock('@/lib/auth', () => ({
  auth: mockAuthFn,
}))
