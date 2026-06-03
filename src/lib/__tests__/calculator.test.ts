import { describe, expect, it } from 'vitest'
import { calculateLineTotal, calculateTotals, isItemActive } from '@/lib/calculator'
import { getItemDef } from '@/data/pricing'
import type { QuoteState } from '@/types/quote'

function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: {
      number: 'TEST-001',
      issueDate: '2026-05-27',
      validUntilDate: '2026-06-26',
      salesperson: 'Test Verkoper',
      projectReference: 'TEST-PROJECT',
      roofAreaM2: 100,
    },
    customer: {
      firstName: 'Jan',
      lastName: 'Janssens',
      email: 'jan@example.be',
      phone: '0470000000',
      street: 'Teststraat 1',
      postalCode: '3000',
      city: 'Leuven',
      projectAddress: 'Teststraat 1, 3000 Leuven',
    },
    quantities: {},
    groupSelections: {},
    flags: {},
    categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    details: {},
    supplements: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06,
    notes: '',
    ...overrides,
  }
}

// Stabiele items met vaste prijs uit de catalogus
const dakpannen = getItemDef('verwijderen-dakpannen')!.item // m2 @ 40, choice
const asbest = getItemDef('verwijderen-asbestleien')!.item // m2 @ 30, choice
const oversteken = getItemDef('verwijderen-oversteken')!.item // lm @ 21, optional/oversteken

describe('calculateLineTotal', () => {
  it('vermenigvuldigt eenheidsprijs met hoeveelheid', () => {
    expect(calculateLineTotal(dakpannen, 50)).toBe(2000)
  })

  it('geeft 0 bij hoeveelheid 0', () => {
    expect(calculateLineTotal(dakpannen, 0)).toBe(0)
  })

  it('geeft 0 voor items zonder prijs', () => {
    expect(calculateLineTotal({ ...dakpannen, unitPrice: null }, 50)).toBe(0)
  })

  it('rondt netjes af op 2 decimalen', () => {
    expect(calculateLineTotal({ ...dakpannen, unitPrice: 33.333 }, 3)).toBe(100)
  })
})

describe('isItemActive', () => {
  it('multipleChoice items enkel actief als ze geselecteerd zijn', () => {
    const selected = baseState({
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    expect(isItemActive(dakpannen, selected)).toBe(true)

    const otherChoice = baseState({
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    expect(isItemActive(dakpannen, otherChoice)).toBe(false)
  })

  it('optional items volgen hun flag', () => {
    expect(isItemActive(oversteken, baseState({ flags: { oversteken: true } }))).toBe(true)
    expect(isItemActive(oversteken, baseState({ flags: { oversteken: false } }))).toBe(false)
  })
})

describe('calculateTotals', () => {
  it('berekent leeg totaal als niks geselecteerd is', () => {
    const totals = calculateTotals(baseState())
    expect(totals.subtotalExVat).toBe(0)
    expect(totals.totalIncVat).toBe(0)
    expect(totals.resolvedItems).toHaveLength(0)
  })

  it('telt dakpannen-afbraak + optionele oversteken correct op', () => {
    const state = baseState({
      quantities: {
        [dakpannen.id]: 100,
        [oversteken.id]: 10,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
      flags: { oversteken: true },
    })
    // dakpannen 100*40 + oversteken 10*21 = 4000 + 210 = 4210
    expect(calculateTotals(state).subtotalExVat).toBe(4210)
  })

  it('telt een multipleChoice keuze enkel mee bij hoeveelheid > 0', () => {
    const state = baseState({
      quantities: { [asbest.id]: 1 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    expect(calculateTotals(state).subtotalExVat).toBe(30)
  })

  it('past 5% korting toe als enabled', () => {
    const state = baseState({
      quantities: { [dakpannen.id]: 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
      discount: { enabled: true, percentage: 5, conditionDays: 7 },
    })
    const totals = calculateTotals(state)
    expect(totals.subtotalExVat).toBe(4000)
    expect(totals.discountAmount).toBe(200)
    expect(totals.totalExVat).toBe(3800)
  })

  it('rekent 6% BTW correct', () => {
    const state = baseState({
      quantities: { [dakpannen.id]: 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    const totals = calculateTotals(state)
    expect(totals.vatAmount).toBe(240)
    expect(totals.totalIncVat).toBe(4240)
  })

  it('berekent prijs per m² als dakoppervlakte ingevuld is', () => {
    const state = baseState({
      meta: { ...baseState().meta, roofAreaM2: 100 },
      quantities: { [dakpannen.id]: 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    // 100*40 = 4000 ex BTW; +6% = 4240; /100 m² = 42.4
    expect(calculateTotals(state).pricePerM2).toBe(42.4)
  })

  it('groepeert subtotalen per subcategorie', () => {
    const state = baseState({
      quantities: { [dakpannen.id]: 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    const totals = calculateTotals(state)
    expect(totals.subtotals).toHaveLength(1)
    expect(totals.subtotals[0]!.amount).toBe(4000)
  })
})
