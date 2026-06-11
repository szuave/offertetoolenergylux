import { describe, expect, it } from 'vitest'
import { calculateTotals, isItemActive } from '@/lib/calculator'
import { buildChecklist, hasBlockingErrors } from '@/lib/checklist'
import { getItemDef } from '@/data/pricing'
import type { QuoteState } from '@/types/quote'

/**
 * Connectie-tests — bewijst dat Daryl's logica echt werkt wanneer een
 * verkoper iets aanvinkt of invult. Geen losse code-checks maar
 * end-to-end runtime-verificatie.
 */
function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: {
      number: 'CN-1',
      issueDate: '2026-06-04',
      validUntilDate: '2026-07-04',
      salesperson: 'Tester',
      projectReference: '',
      roofAreaM2: 100,
    },
    customer: {
      firstName: 'Test', lastName: 'Test', email: 'test@x.be',
      phone: '0470000000', street: 'Test 1', postalCode: '3000',
      city: 'Leuven', projectAddress: '',
    },
    quantities: {},
    groupSelections: {},
    flags: {},
    categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    veluxConfigs: [],
    details: {},
    supplements: {},
    checklistAnswers: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06,
    notes: '',
    ...overrides,
  }
}

describe('Daryl connecties — EIND-checklist +20%', () => {
  it('voegt geen +20% toe als geen item aangevinkt', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'verwijderen-dakpannen': 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
    })
    const t = calculateTotals(state)
    expect(t.eindChecklistAmount).toBe(0)
    expect(t.subtotalExVat).toBe(4000) // 100 m² × €40
  })

  it('voegt +20% toe zodra 1 eind-checklist item aangevinkt is', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'verwijderen-dakpannen': 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
      checklistAnswers: {
        'eind-checklist': { 'hoger-6m': { checked: true } },
      },
    })
    const t = calculateTotals(state)
    expect(t.eindChecklistAmount).toBe(800) // 20% van 4000
    expect(t.subtotalExVat).toBe(4800) // items + eind
  })
})

describe('Daryl connecties — Gevel-ventilatie blocking', () => {
  it('blokkeert export als gevelwerken in scope EN gevel-vragen onbeantwoord', () => {
    const state = baseState({
      categoryScope: { gevelwerken: true },
      quantities: { 'gevelisolatie-eps': 50 },
    })
    const items = buildChecklist(state)
    expect(items.some((i) => i.id === 'gevel-ventilatie-incomplete')).toBe(true)
    expect(hasBlockingErrors(items)).toBe(true)
  })

  it('laat export door zodra alle 4 vragen Ja of Nee zijn', () => {
    const state = baseState({
      categoryScope: { gevelwerken: true },
      quantities: { 'gevelisolatie-eps': 50 },
      checklistAnswers: {
        'gevel-ventilatie': {
          'barst-gevel': { answer: 'nee' },
          'muur-recht': { answer: 'nee' },
          'dakverbreding-zink': { answer: 'nee' },
          'afwatering-ok': { answer: 'ja', checked: true },
        },
      },
    })
    const items = buildChecklist(state)
    expect(items.some((i) => i.id === 'gevel-ventilatie-incomplete')).toBe(false)
  })

  it('legt €431 supplement op zodra "afwatering-ok" Ja is', () => {
    const state = baseState({
      categoryScope: { gevelwerken: true },
      quantities: { 'gevelisolatie-eps': 50 },
      checklistAnswers: {
        'gevel-ventilatie': {
          'barst-gevel': { answer: 'nee' },
          'muur-recht': { answer: 'nee' },
          'dakverbreding-zink': { answer: 'nee' },
          'afwatering-ok': { answer: 'ja', checked: true },
        },
      },
    })
    const t = calculateTotals(state)
    expect(t.appliedSupplements.some((s) => s.amount === 431)).toBe(true)
  })

  it('rekent muur-recht €32/m² supplement correct', () => {
    const state = baseState({
      categoryScope: { gevelwerken: true },
      checklistAnswers: {
        'gevel-ventilatie': {
          'muur-recht': { answer: 'ja', checked: true, amount: 10 },
        },
      },
    })
    const t = calculateTotals(state)
    expect(t.appliedSupplements.some((s) => s.amount === 320)).toBe(true) // 10 × 32
  })
})

describe('Daryl connecties — Roofing/EPDM keuze', () => {
  it('toont EPDM-tapgat als roofing OF epdm flag actief is (Daryl: bij EPDM-keuze)', () => {
    const tap = getItemDef('leveren-en-plaatsen-epdm-tapgat')?.item
    if (!tap) throw new Error('item bestaat niet')
    expect(isItemActive(tap, baseState({ flags: { epdm: true } }))).toBe(true)
    expect(isItemActive(tap, baseState({ flags: {} }))).toBe(false)
  })

  it('toont Roofing-tapgat als roofing flag actief is', () => {
    const tap = getItemDef('leveren-en-plaatsen-roofing-tapgat')?.item
    if (!tap) throw new Error('item bestaat niet')
    expect(isItemActive(tap, baseState({ flags: { roofing: true } }))).toBe(true)
    expect(isItemActive(tap, baseState({ flags: {} }))).toBe(false)
  })
})

describe('Daryl connecties — Zonnepanelen-checklist (cumulatief)', () => {
  it('+20% op zonnepaneel-basisprijs als "hoger dan 6m" ja', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'monteren-zonnepanelen': 10 },
      flags: { zonnepanelen: true },
      checklistAnswers: {
        'zonnepanelen-supplementen': { 'hoger-6m': { checked: true } },
      },
    })
    const t = calculateTotals(state)
    // monteren-zonnepanelen = 10 × €55 = €550. +20% = €110.
    expect(t.appliedSupplements.some((s) => s.amount === 110)).toBe(true)
  })
})

describe('Daryl connecties — Afvoeren werfpuin ja/nee toggle', () => {
  it('rekent container-prijs zodra afvoeren-werfpuin op Ja staat én dakbekleding wordt verwijderd', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: {
        'verwijderen-asbestleien': 120,
        'afvoeren-werfpuin': 1,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    const t = calculateTotals(state)
    // 120 m² / 90 = 2 containers × €650 = €1300
    const afvoerLine = t.resolvedItems.find((r) => r.def.id === 'afvoeren-werfpuin')
    expect(afvoerLine?.lineTotal).toBe(1300)
  })

  it('rekent niets zodra afvoeren-werfpuin op qty 0 (Nee) staat', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: {
        'verwijderen-asbestleien': 120,
        'afvoeren-werfpuin': 0,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    const t = calculateTotals(state)
    expect(t.resolvedItems.find((r) => r.def.id === 'afvoeren-werfpuin')).toBeUndefined()
  })
})

describe('Daryl connecties — Toxisch €8/m² met min €800', () => {
  it('past €800 minimum toe bij kleine hoeveelheid', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: {
        'verwijderen-asbestleien': 50,
        'afvoeren-werfpuin-toxisch-afval': 1,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    const t = calculateTotals(state)
    // 50 × €8 = €400 → min €800
    const tox = t.resolvedItems.find((r) => r.def.id === 'afvoeren-werfpuin-toxisch-afval')
    expect(tox?.lineTotal).toBe(800)
  })

  it('rekent €8/m² boven de 100m²', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: {
        'verwijderen-asbestleien': 150,
        'afvoeren-werfpuin-toxisch-afval': 1,
      },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-asbestleien' },
    })
    const t = calculateTotals(state)
    // 150 × €8 = €1200
    const tox = t.resolvedItems.find((r) => r.def.id === 'afvoeren-werfpuin-toxisch-afval')
    expect(tox?.lineTotal).toBe(1200)
  })
})
