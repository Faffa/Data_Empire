import { describe, it, expect } from 'vitest'

// Sample test to verify Vitest is working
describe('Setup Verification', () => {
  it('vitest is working', () => {
    expect(true).toBe(true)
  })

  it('can perform calculations', () => {
    const result = 2 + 2
    expect(result).toBe(4)
  })
})
