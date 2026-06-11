import { describe, expect, it } from 'vitest'
import { calculateTotals, isItemActive } from '@/lib/calculator'
import { getItemDef, pricingConfig } from '@/data/pricing'
import { STELLING_ITEM_IDS } from '@/data/always-visible'
import { CHECKLISTS } from '@/data/checklists'
import type { QuoteState } from '@/types/quote'

function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: { number: 'X', issueDate: '2026-06-04', validUntilDate: '2026-07-04', salesperson: 'T', projectReference: '', roofAreaM2: 100 },
    customer: { firstName: 'T', lastName: 'T', email: 't@x.be', phone: '0470000000', street: 'S 1', postalCode: '3000', city: 'L', projectAddress: '' },
    quantities: {}, groupSelections: {}, flags: {}, categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    veluxKeuze: { maat: null, basisCode: null, gootstukCode: null, verduisterCode: null, zonneGordijnCode: null, buitenZonCode: null, rolluikCode: null }, details: {}, supplements: {}, checklistAnswers: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 }, vatRate: 0.06, notes: '',
    ...overrides,
  }
}

describe('Daryl extra — Stelling cross-category', () => {
  it('stelling-items bestaan in hellend-dak/werfinstallatie-afbraak', () => {
    const hd = pricingConfig.categories.find((c) => c.id === 'hellend-dak')!
    const sub = hd.subcategories.find((s) => s.id === 'werfinstallatie-afbraak')!
    for (const id of STELLING_ITEM_IDS) {
      expect(sub.items.find((it) => it.id === id), `${id} ontbreekt`).toBeDefined()
    }
  })

  it('stelling-items NIET geblokkeerd door filter — kind=always', () => {
    for (const id of STELLING_ITEM_IDS) {
      const it = getItemDef(id)?.item
      expect(it).toBeDefined()
      expect(it!.filter.kind).toBe('always')
    }
  })

  it('stelling-item telt mee als verkoper een qty invult', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'stelling-valbeveiliging-voorgevel': 25 },
    })
    const t = calculateTotals(state)
    // 25 m² × €12 = 300
    const stell = t.resolvedItems.find((r) => r.def.id === 'stelling-valbeveiliging-voorgevel')
    expect(stell?.lineTotal).toBe(300)
  })
})

describe('Daryl extra — DakbekledingSelector positie + werking', () => {
  it('cover line verschijnt met variant + areaM2', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      cover: { variantId: 'koramic-dakpan-stormpan-pottelberg-44-natuurrood', areaM2: 100 },
    })
    const t = calculateTotals(state)
    const cov = t.resolvedItems.find((r) => r.def.id.startsWith('cover:'))
    expect(cov).toBeDefined()
    expect(cov!.lineTotal).toBe(5500) // 100 × €55
  })

  it('onderdak telt mee als verkoper qty invult (geen dakpan-keuze meer vereist)', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { onderdak: 80 },
    })
    const t = calculateTotals(state)
    const ond = t.resolvedItems.find((r) => r.def.id === 'onderdak')
    expect(ond?.lineTotal).toBe(2000) // 80 × €25
  })

  it('nokpan telt mee zonder dakpan-keuze (Daryl: altijd zichtbaar)', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { nokpan: 12 },
    })
    const t = calculateTotals(state)
    expect(t.resolvedItems.find((r) => r.def.id === 'nokpan')?.lineTotal).toBe(780) // 12 × €65
  })
})

describe('Daryl extra — Plat dak volledige flow', () => {
  it('verwijderen bestaande roofing telt mee zonder enige filter', () => {
    const state = baseState({
      categoryScope: { 'plat-dak': true },
      quantities: { 'verwijderen-bestaande-roofing': 80 },
    })
    const t = calculateTotals(state)
    const r = t.resolvedItems.find((it) => it.def.id === 'verwijderen-bestaande-roofing')
    expect(r?.lineTotal).toBe(3920) // 80 × €49
  })

  it('plat dak afvoerbuis telt mee zonder filter', () => {
    const state = baseState({
      categoryScope: { 'plat-dak': true },
      quantities: { 'leveren-en-plaatsen-afvoerbuis': 10 },
    })
    const t = calculateTotals(state)
    const afv = t.resolvedItems.find((it) => it.def.id === 'leveren-en-plaatsen-afvoerbuis')
    expect(afv?.lineTotal).toBe(570) // 10 × €57 (plat dak prijs)
  })

  it('plat-dak hout-items NIET zichtbaar zonder filter', () => {
    const osb = getItemDef('verwijderen-osb-plat-dak')!.item
    expect(isItemActive(osb, baseState({ flags: {} }))).toBe(false)
    expect(
      isItemActive(osb, baseState({ flags: { 'plat-dak-houtconstructie': true } })),
    ).toBe(true)
  })

  it('plat-dak isolatie-items achter plat-dak-isolatie filter', () => {
    const damp = getItemDef('plat-dak-dampscherm')!.item
    expect(isItemActive(damp, baseState({ flags: {} }))).toBe(false)
    expect(isItemActive(damp, baseState({ flags: { 'plat-dak-isolatie': true } }))).toBe(true)
  })

  it('koepel-items achter plat-dak-lichtkoepel filter', () => {
    const k = getItemDef('leveren-nieuwe-koepel')!.item
    expect(isItemActive(k, baseState({ flags: {} }))).toBe(false)
    expect(isItemActive(k, baseState({ flags: { 'plat-dak-lichtkoepel': true } }))).toBe(true)
  })
})

describe('Daryl extra — verwijderen dekstenen + minimum-prijzen', () => {
  it('verwijderen dekstenen telt mee × lm', () => {
    const state = baseState({
      categoryScope: { 'plat-dak': true },
      quantities: { 'verwijderen-dekstenen': 8 },
    })
    const t = calculateTotals(state)
    const dks = t.resolvedItems.find((r) => r.def.id === 'verwijderen-dekstenen')
    expect(dks?.lineTotal).toBe(8) // 8 × €1 placeholder
  })

  it('verwijderen kiezelsteen met klein qty triggert minimum €1500', () => {
    const state = baseState({
      categoryScope: { 'plat-dak': true },
      quantities: { 'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': 5 },
    })
    const t = calculateTotals(state)
    // 5 m² × €50 = €250 → min €1500
    const kiz = t.resolvedItems.find((r) => r.def.id === 'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')
    expect(kiz?.lineTotal).toBe(1500)
  })

  it('verwijderen kiezelsteen boven minimum gebruikt qty × prijs', () => {
    const state = baseState({
      categoryScope: { 'plat-dak': true },
      quantities: { 'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': 50 },
    })
    const t = calculateTotals(state)
    // 50 × €50 = €2500 > min
    const kiz = t.resolvedItems.find((r) => r.def.id === 'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')
    expect(kiz?.lineTotal).toBe(2500)
  })
})

describe('Daryl extra — Checklist-data integriteit', () => {
  it('alle 4 checklists bestaan met juiste ids', () => {
    const ids = CHECKLISTS.map((c) => c.id).sort()
    expect(ids).toEqual([
      'eind-checklist',
      'gevel-ventilatie',
      'werf-belemmering',
      'zonnepanelen-supplementen',
    ])
  })

  it('EIND-checklist heeft de 5 items van Daryl', () => {
    const eind = CHECKLISTS.find((c) => c.id === 'eind-checklist')!
    const ids = eind.items.map((it) => it.id).sort()
    expect(ids).toEqual([
      'afvoer-moeilijk',
      'container-5m',
      'container-niet-plaatsbaar',
      'energylux-bestelwagen',
      'hoger-6m',
    ])
  })

  it('gevel-ventilatie heeft de 4 items van Daryl, allemaal requiresYesNo', () => {
    const gv = CHECKLISTS.find((c) => c.id === 'gevel-ventilatie')!
    expect(gv.items).toHaveLength(4)
    expect(gv.items.every((it) => it.requiresYesNo === true)).toBe(true)
  })
})

describe('Daryl extra — Prijsvermeerderingen op subtotaal BTW excl', () => {
  it('alle supplementen + EIND-checklist verhogen de subtotal (basis voor BTW)', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'verwijderen-dakpannen': 100 },
      groupSelections: { 'verwijderen-dakbekleding': 'verwijderen-dakpannen' },
      checklistAnswers: {
        'eind-checklist': { 'hoger-6m': { checked: true } },
      },
    })
    const t = calculateTotals(state)
    // items 4000 + eind 20% (800) = 4800 BTW excl
    expect(t.subtotalExVat).toBe(4800)
    // BTW 6% op 4800 = 288
    expect(t.vatAmount).toBe(288)
    expect(t.totalIncVat).toBe(5088)
  })
})

describe('Daryl extra — Wachtkamer items (prijs volgt)', () => {
  it('Veluxen muggengaas heeft een item zonder prijs (Prijs volgt)', () => {
    const v = getItemDef('veluxen-muggengaas')?.item
    expect(v).toBeDefined()
    expect(v!.unitPrice).toBeNull()
    expect(v!.priceNote).toBe('Prijs volgt')
  })

  it('Blauwe steen bestaat met €95', () => {
    const b = getItemDef('blauwe-steen')?.item
    expect(b).toBeDefined()
    expect(b!.unitPrice).toBe(95)
  })
})

describe('Daryl extra — Volgorde-check', () => {
  it('Afvoeren-items staan ECHT als laatste 2 in werfinstallatie/afbraak', () => {
    const hd = pricingConfig.categories.find((c) => c.id === 'hellend-dak')!
    const sub = hd.subcategories.find((s) => s.id === 'werfinstallatie-afbraak')!
    const last = sub.items.slice(-2).map((it) => it.id)
    expect(last).toEqual(['afvoeren-werfpuin', 'afvoeren-werfpuin-toxisch-afval'])
  })

  it('Plat dak heeft sub-rubrieken in juiste volgorde', () => {
    const pd = pricingConfig.categories.find((c) => c.id === 'plat-dak')!
    const subs = pd.subcategories.map((s) => s.id)
    expect(subs).toEqual([
      'werfinstallatie',
      'isolatiewerken',
      'ambachtelijk-timmerwerk',
      'dakdichtingswerken',
      'lood-en-zinkwerken',
    ])
  })

  it('DakbekledingSelector zit logisch tussen onderdak en nokpan in hellend-dak', () => {
    const hd = pricingConfig.categories.find((c) => c.id === 'hellend-dak')!
    const dakdicht = hd.subcategories.find((s) => s.id === 'dakdichtingswerken')!
    const onderdakIdx = dakdicht.items.findIndex((it) => it.id === 'onderdak')
    const nokpanIdx = dakdicht.items.findIndex((it) => it.id === 'nokpan')
    expect(onderdakIdx).toBeGreaterThanOrEqual(0)
    expect(nokpanIdx).toBeGreaterThan(onderdakIdx)
  })
})
