import { describe, expect, it } from 'vitest'
import { isValidBelgianPostalCode, isValidEmail } from '@/lib/validation'

describe('isValidEmail', () => {
  it.each(['info@energylux.be', 'jan.janssens@example.com'])('accepteert %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each(['', 'foo', 'foo@', '@bar.be'])('weigert %s', (email) => {
    expect(isValidEmail(email)).toBe(false)
  })
})

describe('isValidBelgianPostalCode', () => {
  it('accepteert 4 cijfers', () => {
    expect(isValidBelgianPostalCode('3000')).toBe(true)
    expect(isValidBelgianPostalCode('9000')).toBe(true)
  })

  it('weigert andere formaten', () => {
    expect(isValidBelgianPostalCode('300')).toBe(false)
    expect(isValidBelgianPostalCode('30000')).toBe(false)
    expect(isValidBelgianPostalCode('AB12')).toBe(false)
  })
})
