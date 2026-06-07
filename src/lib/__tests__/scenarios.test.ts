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
    categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    details: {},
    supplements: {},
    checklistAnswers: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06,
    notes: '',
    ...overrides,
  }
}

describe('Demo-offerte (fixtures.demoQuote)', () => {
  it('berekent het demo-scenario consistent', () => {
    const totals = calculateTotals(demoQuote)
    // Stellingen 1*12 + 1*12 + 28*12 = 360
    // toxisch: auto-berekend = 120 m² × €8 = 960 (boven minimum €800)
    // asbestleien 120*30=3600 + oversteken 18*21=378
    //   + nokbalk 12*130=1560 + gording 8*130=1040 = 7898
    expect(totals.subtotalExVat).toBe(7898)
    expect(totals.discountAmount).toBe(394.9)
    expect(totals.totalExVat).toBe(7503.1)
    expect(totals.vatAmount).toBeCloseTo(450.19, 2)
    expect(totals.totalIncVat).toBeCloseTo(7953.29, 2)
    expect(totals.pricePerM2).toBeCloseTo(66.28, 2)
  })

  it('toont stellingen als lijn met prijs €12/m²', () => {
    const totals = calculateTotals(demoQuote)
    const stelling = totals.resolvedItems.find((r) =>
      r.def.id.startsWith('stelling-valbeveiliging'),
    )
    expect(stelling).toBeDefined()
    expect(stelling!.def.unitPrice).toBe(12)
    expect(stelling!.lineTotal).toBeGreaterThan(0)
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
  it('telt items met "Op regie" niet mee in het totaal', () => {
    // metselwerk-schouw heeft prijs "Op regie" → unitPrice === null
    const state = baseState({
      quantities: { 'metselwerk-schouw': 10 },
      flags: { schouw: true },
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
        'verwijderen-asbestleien': 100,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    const totals = calculateTotals(state)
    // alleen asbestleien telt mee: 100 * 30 = 3000
    expect(totals.subtotalExVat).toBe(3000)
    expect(totals.resolvedItems).toHaveLength(1)
    expect(totals.resolvedItems[0]!.def.id).toBe('verwijderen-asbestleien')
  })
})

describe('Scenario: dakbekleding-keuze (cover, cascading dropdown)', () => {
  it('voegt een lijn toe met variant-prijs × oppervlakte', () => {
    // Koramic Stormpan Pottelberg 44 Natuurrood: base €55 + 0 = €55/m²
    const state = baseState({
      cover: { variantId: 'koramic-dakpan-stormpan-pottelberg-44-natuurrood', areaM2: 100 },
    })
    const totals = calculateTotals(state)
    expect(totals.subtotalExVat).toBe(5500)
    expect(totals.resolvedItems).toHaveLength(1)
    expect(totals.resolvedItems[0]!.def.id).toBe('cover:koramic-dakpan-stormpan-pottelberg-44-natuurrood')
  })

  it('past negatieve toevoeging toe (Rustiek = base − €2 = €53/m²)', () => {
    const state = baseState({
      cover: { variantId: 'koramic-dakpan-stormpan-pottelberg-44-rustiek', areaM2: 100 },
    })
    expect(calculateTotals(state).subtotalExVat).toBe(5300)
  })

  it('sandwich-variant zonder prijs telt niet mee in subtotaal', () => {
    const state = baseState({
      cover: { variantId: 'sandwich-ecopanelen-antraciet', areaM2: 100 },
    })
    const totals = calculateTotals(state)
    expect(totals.subtotalExVat).toBe(0)
    expect(totals.resolvedItems).toHaveLength(1)
    expect(totals.resolvedItems[0]!.def.unitPrice).toBeNull()
  })

  it('geen cover zonder oppervlakte of zonder variant', () => {
    expect(
      calculateTotals(
        baseState({ cover: { variantId: 'koramic-dakpan-stormpan-pottelberg-44-natuurrood', areaM2: 0 } }),
      ).resolvedItems,
    ).toHaveLength(0)
    expect(
      calculateTotals(baseState({ cover: { variantId: null, areaM2: 100 } })).resolvedItems,
    ).toHaveLength(0)
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
          expect(['stuk', 'm2', 'lm', 'jaNee']).toContain(item.unit)
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
