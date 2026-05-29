import { describe, expect, it } from 'vitest'
import { parseLocaleNumber } from '@/lib/parse'

describe('parseLocaleNumber', () => {
  it('parseert Belgisch formaat met komma als decimaal', () => {
    expect(parseLocaleNumber('3,5')).toBe(3.5)
    expect(parseLocaleNumber('120,75')).toBe(120.75)
  })

  it('parseert internationaal formaat met punt als decimaal', () => {
    expect(parseLocaleNumber('3.5')).toBe(3.5)
    expect(parseLocaleNumber('120.75')).toBe(120.75)
  })

  it('parseert Belgisch duizendtal-formaat (punt-duizend, komma-decimaal)', () => {
    expect(parseLocaleNumber('1.250,75')).toBe(1250.75)
    expect(parseLocaleNumber('12.500,00')).toBe(12500)
  })

  it('parseert US-formaat (komma-duizend, punt-decimaal)', () => {
    expect(parseLocaleNumber('1,250.75')).toBe(1250.75)
  })

  it('verwijdert spaties (duizendtal met spatie)', () => {
    expect(parseLocaleNumber('1 250,75')).toBe(1250.75)
  })

  it('parseert hele getallen', () => {
    expect(parseLocaleNumber('120')).toBe(120)
    expect(parseLocaleNumber('0')).toBe(0)
  })

  it('parseert negatieve getallen', () => {
    expect(parseLocaleNumber('-5,5')).toBe(-5.5)
  })

  it('geeft null bij lege of ongeldige input', () => {
    expect(parseLocaleNumber('')).toBeNull()
    expect(parseLocaleNumber('   ')).toBeNull()
    expect(parseLocaleNumber('abc')).toBeNull()
  })
})
