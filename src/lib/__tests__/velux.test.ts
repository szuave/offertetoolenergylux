import { describe, expect, it } from 'vitest'
import { calculateTotals } from '@/lib/calculator'
import {
  veluxMaten,
  veluxConfigUnitPrice,
  veluxConfigsTotalPrice,
  veluxConfigHasMissingPrice,
  findMaat,
  type VeluxConfig,
} from '@/data/velux'
import type { QuoteState } from '@/types/quote'

function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: { number: 'V', issueDate: '2026-06-08', validUntilDate: '2026-07-08', salesperson: 'T', projectReference: '', roofAreaM2: 100 },
    customer: { firstName: 'T', lastName: 'T', email: 't@x.be', phone: '0470000000', street: 'S 1', postalCode: '3000', city: 'L', projectAddress: '' },
    quantities: {}, groupSelections: {}, flags: {}, categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    veluxConfigs: [],
    details: {}, supplements: {}, checklistAnswers: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06, notes: '',
    ...overrides,
  }
}

function mkConfig(overrides: Partial<VeluxConfig> = {}): VeluxConfig {
  return {
    id: 'cfg-' + Math.random().toString(36).slice(2, 8),
    aantal: 1,
    maat: null,
    basisCode: null,
    gootstukCode: null,
    verduisterCode: null,
    zonneGordijnCode: null,
    buitenZonCode: null,
    rolluikCode: null,
    ...overrides,
  }
}

describe('Velux — data integriteit', () => {
  it('19 maten geladen uit Velux Excel', () => {
    expect(veluxMaten.length).toBe(19)
  })

  it('MK06 bevat verwachte basismodellen', () => {
    const m = findMaat('MK06')
    expect(m).toBeDefined()
    const codes = m!.basis.map((b) => b.code)
    expect(codes).toContain('GGL 2066')
    expect(codes).toContain('GGL 2070')
  })

  it('MK06 GGL 2066 prijs = €689.33', () => {
    const m = findMaat('MK06')!
    const gg2066 = m.basis.find((b) => b.code === 'GGL 2066')
    expect(gg2066?.prijs).toBe(689.33)
  })

  it('CK02 GGL 3066 heeft prijs €485 (aangeleverd door Yasid)', () => {
    const m = findMaat('CK02')!
    const gg3066 = m.basis.find((b) => b.code === 'GGL 3066')
    expect(gg3066?.prijs).toBe(485)
  })

  it('CK04 Integra GGL 206630 heeft prijs €914', () => {
    const m = findMaat('CK04')!
    const integra = m.basis.find((b) => b.code === 'GGL 206630')
    expect(integra?.type).toBe('Integra')
    expect(integra?.prijs).toBe(914)
  })

  it('CK06 GGL 2062 is opAanvraag (verkoper vult prijs zelf in)', () => {
    const m = findMaat('CK06')!
    const it = m.basis.find((b) => b.code === 'GGL 2062')
    expect(it?.prijs).toBeNull()
    expect(it?.opAanvraag).toBe(true)
  })

  it('UK08 GGL 2050 is opAanvraag', () => {
    const m = findMaat('UK08')!
    const it = m.basis.find((b) => b.code === 'GGL 2050')
    expect(it?.opAanvraag).toBe(true)
  })
})

describe('Velux — unit price berekening', () => {
  it('basis-only = basisprijs', () => {
    const p = veluxConfigUnitPrice(mkConfig({ maat: 'MK06', basisCode: 'GGL 2066' }))
    expect(p).toBe(689.33)
  })

  it('basis + gootstuk + verduistering opgeteld', () => {
    // MK06 GGL 2066: €689.33 · EDW 2000: €139.43 · DKL 0705: €105.30
    const p = veluxConfigUnitPrice(
      mkConfig({
        maat: 'MK06',
        basisCode: 'GGL 2066',
        gootstukCode: 'EDW 2000',
        verduisterCode: 'DKL 0705',
      }),
    )
    expect(p).toBe(934.06)
  })

  it('lege config = €0', () => {
    expect(veluxConfigUnitPrice(mkConfig())).toBe(0)
  })

  it('opAanvraag basis zonder aangepastePrijs telt als 0', () => {
    // CK06 GGL 2062 is op aanvraag
    const cfg = mkConfig({ maat: 'CK06', basisCode: 'GGL 2062' })
    expect(veluxConfigUnitPrice(cfg)).toBe(0)
    expect(veluxConfigHasMissingPrice(cfg)).toBe(true)
  })

  it('opAanvraag basis MET aangepastePrijs gebruikt die prijs', () => {
    const cfg = mkConfig({ maat: 'CK06', basisCode: 'GGL 2062', aangepastePrijs: 750 })
    expect(veluxConfigUnitPrice(cfg)).toBe(750)
  })
})

describe('Velux — multi-config calculator (Yasid 11 juni)', () => {
  it('3× MK04 GGL 2066 (€634.73) + 1× UK04 GGL 2070 (€611.33) = €2515.52', () => {
    const configs: VeluxConfig[] = [
      mkConfig({ aantal: 3, maat: 'MK04', basisCode: 'GGL 2066' }),
      mkConfig({ aantal: 1, maat: 'UK04', basisCode: 'GGL 2070' }),
    ]
    const totaal = veluxConfigsTotalPrice(configs)
    expect(totaal).toBe(2515.52) // 3 × 634.73 + 1 × 611.33
  })

  it('Calculator lijntotaal = som over alle configs', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      flags: { veluxen: true },
      veluxConfigs: [
        mkConfig({ aantal: 3, maat: 'MK06', basisCode: 'GGL 2066' }),
        mkConfig({ aantal: 1, maat: 'CK02', basisCode: 'GGL 2062' }),
      ],
    })
    const t = calculateTotals(state)
    const velux = t.resolvedItems.find((r) => r.def.id === 'veluxen-nieuw')
    // 3 × €689.33 + 1 × €642.53 = €2710.52
    expect(velux?.lineTotal).toBe(2710.52)
    expect(velux?.quantity).toBe(4)
  })

  it('Lege configs lijst: veluxen-nieuw verschijnt niet in offerte', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      flags: { veluxen: true },
    })
    const t = calculateTotals(state)
    expect(t.resolvedItems.find((r) => r.def.id === 'veluxen-nieuw')).toBeUndefined()
  })
})
