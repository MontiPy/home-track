import { vi } from 'vitest'

// Create a deep mock of PrismaClient
function createMockModel() {
  return {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  }
}

export const mockDb = {
  household: createMockModel(),
  member: createMockModel(),
  invitation: createMockModel(),
  calendarEvent: createMockModel(),
  chore: createMockModel(),
  choreAssignment: createMockModel(),
  recipe: createMockModel(),
  mealPlan: createMockModel(),
  groceryItem: createMockModel(),
  message: createMockModel(),
  budgetCategory: createMockModel(),
  expense: createMockModel(),
  allowance: createMockModel(),
  vaultItem: createMockModel(),
  vaultDocument: createMockModel(),
  pet: createMockModel(),
  petCareTask: createMockModel(),
  petCareLog: createMockModel(),
  petHealthRecord: createMockModel(),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))
