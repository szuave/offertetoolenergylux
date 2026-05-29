import { describe, expect, it } from 'vitest'
import { buildChecklist, hasBlockingErrors, countBySeverity } from '@/lib/checklist'
import type { QuoteState } from '@/types/quote'

function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: {
      number: 'T',
      issueDate: '2026-05-27',
      validUntilDate: '2026-06-26',
      salesperson: 'Tom Peeters',
      projectReference: '',
      roofAreaM2: 120,
    },
    customer: {
      firstName: 'Jan',
      lastName: 'Janssens',
      email: 'jan@example.be',
      phone: '0470000000',
      street: 'Teststraat 1',
      postalCode: '3000',
      city: 'Leuven',
      projectAddress: 'Werfstraat 5, 3000 Leuven',
    },
    quantities: {
      'verwijderen-dakpannen': 100,
      'afvoeren-werfafval': 1,
    },
    groupSelections: {
      'verwijderen-dakbekleding': 'verwijderen-dakpannen',
      'afvoeren-afval': 'afvoeren-werfpuin',
    },
    flags: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06,
    notes: '',
    ...overrides,
  }
}

describe('buildChecklist — happy path', () => {
  it('geeft geen errors voor een volledig ingevulde offerte', () => {
    const items = buildChecklist(baseState())
    const errors = items.filter((i) => i.severity === 'error')
    expect(errors).toEqual([])
  })

  it('genereert wel een waarschuwing voor leeg werfadres (verschilt van factuur)', () => {
    const items = buildChecklist(baseState({ customer: { ...baseState().customer, projectAddress: '' } }))
    const warnings = items.filter((i) => i.severity === 'warning')
    expect(warnings.some((i) => i.id === 'project-address')).toBe(true)
  })
})

describe('buildChecklist — error gevallen', () => {
  it('blokkeert bij ontbrekende klantnaam', () => {
    const items = buildChecklist(
      baseState({ customer: { ...baseState().customer, firstName: '', lastName: '' } }),
    )
    expect(hasBlockingErrors(items)).toBe(true)
    expect(items.some((i) => i.id === 'customer-name' && i.severity === 'error')).toBe(true)
  })

  it('blokkeert bij ongeldige e-mail', () => {
    const items = buildChecklist(
      baseState({ customer: { ...baseState().customer, email: 'not-an-email' } }),
    )
    expect(items.some((i) => i.id === 'customer-email' && i.severity === 'error')).toBe(true)
  })

  it('blokkeert bij ongeldige postcode (niet 4 cijfers)', () => {
    const items = buildChecklist(
      baseState({ customer: { ...baseState().customer, postalCode: '30' } }),
    )
    expect(items.some((i) => i.id === 'customer-address' && i.severity === 'error')).toBe(true)
  })

  it('blokkeert bij ontbrekende salesperson', () => {
    const items = buildChecklist(baseState({ meta: { ...baseState().meta, salesperson: '' } }))
    expect(items.some((i) => i.id === 'meta-salesperson' && i.severity === 'error')).toBe(true)
  })

  it('blokkeert NIET op een niet-gekozen optionele groep (groepen zijn v1 niet verplicht)', () => {
    // De tool dekt ook isolatie-/gevelwerken-only offertes waar afbraakkeuzes
    // niet van toepassing zijn. Een ontbrekende groep mag dus niet blokkeren
    // zolang er wél lijnposten zijn.
    const items = buildChecklist(baseState({ groupSelections: {} }))
    expect(items.some((i) => i.id.startsWith('group-') && i.severity === 'error')).toBe(false)
  })

  it('blokkeert bij lege offerte (geen lijnposten)', () => {
    const items = buildChecklist(baseState({ quantities: {} }))
    expect(items.some((i) => i.id === 'no-items' && i.severity === 'error')).toBe(true)
  })
})

describe('buildChecklist — warnings', () => {
  it('waarschuwt bij dakopp = 0', () => {
    const items = buildChecklist(baseState({ meta: { ...baseState().meta, roofAreaM2: 0 } }))
    expect(items.some((i) => i.id === 'meta-roof-area' && i.severity === 'warning')).toBe(true)
  })

  it('waarschuwt bij item met null-prijs en qty > 0', () => {
    const items = buildChecklist(
      baseState({
        quantities: { ...baseState().quantities, 'verwijderen-sandwichpanelen': 50 },
      }),
    )
    expect(items.some((i) => i.id === 'noprice' && i.severity === 'warning')).toBe(true)
  })
})

describe('countBySeverity', () => {
  it('telt errors en warnings correct', () => {
    const items = buildChecklist(
      baseState({
        customer: { ...baseState().customer, firstName: '', lastName: '', email: 'x' },
        meta: { ...baseState().meta, roofAreaM2: 0 },
      }),
    )
    const counts = countBySeverity(items)
    expect(counts.error).toBeGreaterThan(0)
    expect(counts.warning).toBeGreaterThan(0)
  })
})
