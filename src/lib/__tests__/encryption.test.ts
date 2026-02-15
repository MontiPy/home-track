import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the env variable before importing encryption module
const MOCK_KEY = Buffer.from('a'.repeat(32)).toString('base64')

describe('encryption', () => {
  beforeEach(() => {
    vi.stubEnv('VAULT_ENCRYPTION_KEY', MOCK_KEY)
  })

  it('encrypts and decrypts a string', async () => {
    const { encrypt, decrypt } = await import('../encryption')
    const plaintext = 'Hello, World! This is sensitive data.'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertexts for the same input', async () => {
    const { encrypt } = await import('../encryption')
    const plaintext = 'Same input'
    const encrypted1 = encrypt(plaintext)
    const encrypted2 = encrypt(plaintext)
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('detects encrypted format', async () => {
    const { encrypt, isEncrypted } = await import('../encryption')
    const encrypted = encrypt('test')
    expect(isEncrypted(encrypted)).toBe(true)
    expect(isEncrypted('not encrypted')).toBe(false)
    expect(isEncrypted('only:two')).toBe(false)
  })

  it('throws on invalid encrypted data', async () => {
    const { decrypt } = await import('../encryption')
    expect(() => decrypt('invalid')).toThrow()
  })
})
