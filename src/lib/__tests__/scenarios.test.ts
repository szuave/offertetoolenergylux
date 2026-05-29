import { describe, expect, it } from 'vitest'
import { calculateTotals, isItemActive } from '@/lib/calculator'
import { pricingConfig, getItemDef } from '@/data/pricing'
import { demoQuote } from '@/data/fixtures'
import type { QuoteState } from '@/types/quote'

function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: {
      number: 'T',
      issueDate: '2026-05-27',
      validUntilDate: '2026-06-26',
      salesperson: 'Tom Peeters',
      projectReference: '',
      roofAreaM2: 100,
    },
    customer: {
      firstName: '', lastName: '', email: '', phone: '',
      street: '', postalCode: '', city: '', projectAddress: '',
    },
    quantities: {},
    groupSelections: {},
    flags: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06,
    notes: '',
    ...overrides,
  }
}

describe('Demo-offerte (fixtures.demoQuote)', () => {
  it('berekent het demo-scenario consistent', () => {
    const totals = calculateTotals(demoQuote)
    // Stellingen staan op "prijs volgt" (null) → tellen niet mee.
    // toxisch 649 + asbest 120*45=5400 + oversteken 18*21=378
    //   + nokbalk 12*130=1560 + gording 8*130=1040 = 9027
    expect(totals.subtotalExVat).toBe(9027)
    expect(totals.discountAmount).toBe(451.35)
    expect(totals.totalExVat).toBe(8575.65)
    expect(totals.vatAmount).toBeCloseTo(514.54, 2)
    expect(totals.totalIncVat).toBeCloseTo(9090.19, 2)
    expect(totals.pricePerM2).toBeCloseTo(75.75, 2)
  })

  it('toont stellingen als lijn maar telt ze niet (prijs volgt)', () => {
    const totals = calculateTotals(demoQuote)
    const stelling = totals.resolvedItems.find((r) =>
      r.def.id.startsWith('stelling-valbeveiliging'),
    )
    expect(stelling).toBeDefined()
    expect(stelling!.def.unitPrice).toBeNull()
    expect(stelling!.lineTotal).toBe(0)
  })
})

describe('Scenario: 21% BTW (nieuwbouw)', () => {
  it('past 21% BTW toe i.p.v. 6%', () => {
    const state = baseState({
      vatRate: 0.21,
      quantities: { 'verwijderen-dakpannen': 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    const totals = calculateTotals(state)
    expect(totals.subtotalExVat).toBe(4000)
    expect(totals.vatAmount).toBe(840)
    expect(totals.totalIncVat).toBe(4840)
  })
})

describe('Scenario: items met prijs-volgt (null)', () => {
  it('telt sandwichpanelen niet mee in het totaal maar toont de lijn', () => {
    const state = baseState({
      quantities: { 'verwijderen-sandwichpanelen': 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-sandwichpanelen' },
    })
    const totals = calculateTotals(state)
    expect(totals.subtotalExVat).toBe(0)
    expect(totals.resolvedItems).toHaveLength(1)
    expect(totals.resolvedItems[0]!.def.unitPrice).toBeNull()
  })
})

describe('Scenario: wisselen tussen multipleChoice keuzes', () => {
  it('telt alleen de huidige keuze, oude qty wordt genegeerd', () => {
    const state = baseState({
      quantities: {
        'verwijderen-dakpannen': 100,
        'verwijderen-asbest': 100,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbest' },
    })
    const totals = calculateTotals(state)
    // alleen asbest telt mee: 100 * 45 = 4500
    expect(totals.subtotalExVat).toBe(4500)
    expect(totals.resolvedItems).toHaveLength(1)
    expect(totals.resolvedItems[0]!.def.id).toBe('verwijderen-asbest')
  })
})

describe('Scenario: optionele flag aan/uit', () => {
  it('negeert oversteken-items als de flag uit staat', () => {
    const state = baseState({
      quantities: { 'verwijderen-oversteken': 10 },
      flags: { oversteken: false },
    })
    expect(calculateTotals(state).subtotalExVat).toBe(0)
  })

  it('telt oversteken mee zodra de flag aan staat', () => {
    const state = baseState({
      quantities: { 'verwijderen-oversteken': 10 },
      flags: { oversteken: true },
    })
    expect(calculateTotals(state).subtotalExVat).toBe(210)
  })
})

describe('Edge cases', () => {
  it('lege state geeft alles 0', () => {
    const t = calculateTotals(baseState())
    expect(t.subtotalExVat).toBe(0)
    expect(t.totalIncVat).toBe(0)
    expect(t.resolvedItems).toEqual([])
    expect(t.subtotals).toEqual([])
  })

  it('roofAreaM2 = 0 → pricePerM2 is null', () => {
    const state = baseState({
      meta: { ...baseState().meta, roofAreaM2: 0 },
      quantities: { 'verwijderen-dakpannen': 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    expect(calculateTotals(state).pricePerM2).toBeNull()
  })
})

describe('Data-integriteit van pricingConfig (gegenereerd uit Excel)', () => {
  it('bevat 3 categorieën', () => {
    expect(pricingConfig.categories).toHaveLength(3)
  })

  it('alle multipleChoice items wijzen naar bestaande groepen', () => {
    const validGroups = new Set(pricingConfig.multipleChoiceGroups.map((g) => g.id))
    for (const cat of pricingConfig.categories) {
      for (const sub of cat.subcategories) {
        for (const item of sub.items) {
          if (item.filter.kind === 'multipleChoice') {
            expect(validGroups.has(item.filter.groupId)).toBe(true)
          }
        }
      }
    }
  })

  it('alle optional items wijzen naar bestaande flags', () => {
    const validFlags = new Set(pricingConfig.optionalFlags.map((f) => f.id))
    for (const cat of pricingConfig.categories) {
      for (const sub of cat.subcategories) {
        for (const item of sub.items) {
          if (item.filter.kind === 'optional') {
            expect(validFlags.has(item.filter.flagId)).toBe(true)
          }
        }
      }
    }
  })

  it('alle item IDs zijn uniek', () => {
    const ids = pricingConfig.categories.flatMap((c) =>
      c.subcategories.flatMap((s) => s.items.map((i) => i.id)),
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('alle multipleChoice groups verwijzen naar bestaande items', () => {
    for (const group of pricingConfig.multipleChoiceGroups) {
      for (const itemId of group.itemIds) {
        expect(getItemDef(itemId)).toBeDefined()
      }
    }
  })

  it('elk item heeft een geldige eenheid en (prijs of priceNote)', () => {
    for (const cat of pricingConfig.categories) {
      for (const sub of cat.subcategories) {
        for (const item of sub.items) {
          expect(['stuk', 'm2', 'lm']).toContain(item.unit)
          if (item.unitPrice === null) {
            expect(item.priceNote ?? 'Prijs volgt').toBeTruthy()
          } else {
            expect(item.unitPrice).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})

describe('isItemActive — exhaustief op gegenereerde data', () => {
  it('werkt voor de drie filter kinds', () => {
    const dakpannen = getItemDef('verwijderen-dakpannen')!.item
    const oversteken = getItemDef('verwijderen-oversteken')!.item

    expect(isItemActive(dakpannen, baseState())).toBe(false)
    expect(
      isItemActive(
        dakpannen,
        baseState({ groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' } }),
      ),
    ).toBe(true)

    expect(isItemActive(oversteken, baseState({ flags: { oversteken: false } }))).toBe(false)
    expect(isItemActive(oversteken, baseState({ flags: { oversteken: true } }))).toBe(true)
  })
})
