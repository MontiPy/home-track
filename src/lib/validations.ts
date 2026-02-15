import { z } from 'zod/v4'

// --- Household ---
export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required').max(100),
  location: z.string().max(200).optional(),
})

export const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(200).nullable().optional(),
  timezone: z.string().max(50).optional(),
})

// --- Invitation ---
export const createInvitationSchema = z.object({
  email: z.email('Valid email is required'),
  role: z.enum(['ADMIN', 'MEMBER', 'CHILD']).default('MEMBER'),
})

// --- Calendar ---
export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time'),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time'),
  allDay: z.boolean().default(false),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  googleEventId: z.string().optional(),
})

// --- Chores ---
export const createChoreSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONE_TIME']),
  rotationOrder: z.array(z.string()).nullable().optional(),
  points: z.coerce.number().int().min(0).max(1000).nullable().optional(),
})

export const createChoreAssignmentSchema = z.object({
  choreId: z.string().min(1, 'Chore ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid due date'),
})

// --- Meals ---
export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  ingredients: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
  instructions: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
})

export const createMealPlanSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  recipeId: z.string().optional(),
  customTitle: z.string().max(200).optional(),
})

// --- Grocery ---
export const createGroceryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  quantity: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
})

export const updateGroceryItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.string().max(50).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  checked: z.boolean().optional(),
})

// --- Messages ---
export const createMessageSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  type: z.enum(['ANNOUNCEMENT', 'NOTE', 'DISCUSSION_TOPIC']).default('NOTE'),
  pinned: z.boolean().default(false),
})

// --- Budget ---
export const createBudgetCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  monthlyLimit: z.coerce.number().positive().max(1_000_000).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#6B7280'),
})

export const updateBudgetCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  monthlyLimit: z.coerce.number().positive().max(1_000_000).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive').max(1_000_000),
  description: z.string().min(1, 'Description is required').max(500),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  categoryId: z.string().min(1, 'Category is required'),
})

export const createAllowanceSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  amount: z.coerce.number().positive('Amount must be positive').max(100_000),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  balance: z.coerce.number().min(0).default(0),
})

// --- Vault ---
export const createVaultItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(50000),
  category: z.string().min(1, 'Category is required').max(100),
  restricted: z.boolean().default(false),
})

export const updateVaultItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  category: z.string().min(1).max(100).optional(),
  restricted: z.boolean().optional(),
})

// --- Pets ---
export const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(100),
  species: z.string().min(1, 'Species is required').max(50),
  breed: z.string().max(100).optional(),
  photoUrl: z.url().optional(),
  birthday: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  weight: z.coerce.number().positive().max(5000).optional(),
})

export const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().min(1).max(50).optional(),
  breed: z.string().max(100).nullable().optional(),
  photoUrl: z.url().nullable().optional(),
  birthday: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').nullable().optional(),
  weight: z.coerce.number().positive().max(5000).nullable().optional(),
})

export const createPetCareTaskSchema = z.object({
  type: z.enum(['FEEDING', 'WALK', 'MEDICATION', 'GROOMING', 'VET']),
  title: z.string().min(1, 'Title is required').max(200),
  schedule: z.record(z.string(), z.unknown()).nullable().optional(),
  dosage: z.string().max(200).optional(),
  defaultMemberId: z.string().optional(),
})

export const createPetCareLogSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  notes: z.string().max(1000).optional(),
  durationMin: z.coerce.number().int().min(0).max(1440).optional(),
})

export const createPetHealthRecordSchema = z.object({
  type: z.enum(['VACCINE', 'VET_VISIT', 'MEDICATION', 'OTHER']),
  title: z.string().min(1, 'Title is required').max(200),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  notes: z.string().max(5000).optional(),
  fileUrl: z.url().optional(),
})

// --- Helper to parse and return structured errors ---
export function parseBody<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstError = result.error.issues[0]
  return { success: false, error: firstError?.message || 'Validation failed' }
}
