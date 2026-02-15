import { describe, it, expect } from 'vitest'
import {
  createHouseholdSchema,
  createChoreSchema,
  createCalendarEventSchema,
  createGroceryItemSchema,
  createMessageSchema,
  createBudgetCategorySchema,
  createExpenseSchema,
  createPetSchema,
  createVaultItemSchema,
  parseBody,
} from '../validations'

describe('Validation Schemas', () => {
  describe('createHouseholdSchema', () => {
    it('validates valid data', () => {
      const result = createHouseholdSchema.safeParse({ name: 'Smith Family' })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = createHouseholdSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('createChoreSchema', () => {
    it('validates valid data', () => {
      const result = createChoreSchema.safeParse({ title: 'Dishes', frequency: 'DAILY' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid frequency', () => {
      const result = createChoreSchema.safeParse({ title: 'Dishes', frequency: 'HOURLY' })
      expect(result.success).toBe(false)
    })
  })

  describe('createCalendarEventSchema', () => {
    it('validates valid event', () => {
      const result = createCalendarEventSchema.safeParse({
        title: 'Meeting',
        startTime: '2025-06-01T10:00:00Z',
        endTime: '2025-06-01T11:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid date', () => {
      const result = createCalendarEventSchema.safeParse({
        title: 'Meeting',
        startTime: 'not-a-date',
        endTime: '2025-06-01T11:00:00Z',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createGroceryItemSchema', () => {
    it('validates valid item', () => {
      const result = createGroceryItemSchema.safeParse({ name: 'Milk' })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = createGroceryItemSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('createMessageSchema', () => {
    it('validates valid message', () => {
      const result = createMessageSchema.safeParse({ content: 'Hello family!' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = createMessageSchema.safeParse({ content: 'Hello', type: 'TWEET' })
      expect(result.success).toBe(false)
    })
  })

  describe('createBudgetCategorySchema', () => {
    it('validates with limit', () => {
      const result = createBudgetCategorySchema.safeParse({ name: 'Food', monthlyLimit: 500 })
      expect(result.success).toBe(true)
    })

    it('rejects invalid hex color', () => {
      const result = createBudgetCategorySchema.safeParse({ name: 'Food', color: 'red' })
      expect(result.success).toBe(false)
    })
  })

  describe('createExpenseSchema', () => {
    it('validates valid expense', () => {
      const result = createExpenseSchema.safeParse({
        amount: 42.50,
        description: 'Groceries',
        date: '2025-06-01',
        categoryId: 'cat-1',
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative amount', () => {
      const result = createExpenseSchema.safeParse({
        amount: -10,
        description: 'Refund',
        date: '2025-06-01',
        categoryId: 'cat-1',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createPetSchema', () => {
    it('validates valid pet', () => {
      const result = createPetSchema.safeParse({ name: 'Buddy', species: 'Dog' })
      expect(result.success).toBe(true)
    })

    it('rejects missing species', () => {
      const result = createPetSchema.safeParse({ name: 'Buddy' })
      expect(result.success).toBe(false)
    })
  })

  describe('createVaultItemSchema', () => {
    it('validates valid item', () => {
      const result = createVaultItemSchema.safeParse({
        title: 'Insurance',
        content: 'Policy #123',
        category: 'Insurance',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty content', () => {
      const result = createVaultItemSchema.safeParse({
        title: 'Insurance',
        content: '',
        category: 'Insurance',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('parseBody', () => {
    it('returns data on success', () => {
      const result = parseBody(createGroceryItemSchema, { name: 'Bread' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Bread')
      }
    })

    it('returns error on failure', () => {
      const result = parseBody(createGroceryItemSchema, { name: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })
  })
})
