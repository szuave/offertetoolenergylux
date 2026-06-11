import { describe, expect, it } from 'vitest'
import { calculateTotals } from '@/lib/calculator'
import { veluxMaten, veluxUnitPrice, findMaat } from '@/data/velux'
import type { QuoteState } from '@/types/quote'

function baseState(overrides: Partial<QuoteState> = {}): QuoteState {
  return {
    meta: { number: 'V', issueDate: '2026-06-08', validUntilDate: '2026-07-08', salesperson: 'T', projectReference: '', roofAreaM2: 100 },
    customer: { firstName: 'T', lastName: 'T', email: 't@x.be', phone: '0470000000', street: 'S 1', postalCode: '3000', city: 'L', projectAddress: '' },
    quantities: {}, groupSelections: {}, flags: {}, categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    veluxKeuze: { maat: null, basisCode: null, gootstukCode: null, verduisterCode: null, zonneGordijnCode: null, buitenZonCode: null, rolluikCode: null },
    details: {}, supplements: {}, checklistAnswers: {},
    discount: { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: 0.06, notes: '',
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
})

describe('Velux — unit price berekening', () => {
  it('basis-only = basisprijs', () => {
    const price = veluxUnitPrice({
      maat: 'MK06', basisCode: 'GGL 2066',
      gootstukCode: null, verduisterCode: null,
      zonneGordijnCode: null, buitenZonCode: null, rolluikCode: null,
    })
    expect(price).toBe(689.33)
  })

  it('basis + gootstuk + verduistering opgeteld', () => {
    // MK06 GGL 2066: €689.33
    // MK06 EDW 2000 gootstuk: €139.43
    // MK06 DKL 0705 verduistering Donkergrijs: €105.30
    const price = veluxUnitPrice({
      maat: 'MK06', basisCode: 'GGL 2066',
      gootstukCode: 'EDW 2000', verduisterCode: 'DKL 0705',
      zonneGordijnCode: null, buitenZonCode: null, rolluikCode: null,
    })
    expect(price).toBe(934.06) // 689.33 + 139.43 + 105.30
  })

  it('lege keuze = €0', () => {
    expect(veluxUnitPrice({
      maat: null, basisCode: null, gootstukCode: null,
      verduisterCode: null, zonneGordijnCode: null,
      buitenZonCode: null, rolluikCode: null,
    })).toBe(0)
  })
})

describe('Velux — calculator integratie (line in offerte)', () => {
  it('Veluxen nieuw met qty=3 en MK06+GGL 2066 = 3 × €689.33 = €2067.99', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'veluxen-nieuw': 3 },
      flags: { veluxen: true },
      veluxKeuze: {
        maat: 'MK06', basisCode: 'GGL 2066',
        gootstukCode: null, verduisterCode: null,
        zonneGordijnCode: null, buitenZonCode: null, rolluikCode: null,
      },
    })
    const t = calculateTotals(state)
    const velux = t.resolvedItems.find((r) => r.def.id === 'veluxen-nieuw')
    expect(velux?.lineTotal).toBe(2067.99)
    expect(velux?.quantity).toBe(3)
  })

  it('Zonder velux-keuze maar qty=3: lijntotaal = 0 (verkoper moet kiezen)', () => {
    const state = baseState({
      categoryScope: { 'hellend-dak': true },
      quantities: { 'veluxen-nieuw': 3 },
      flags: { veluxen: true },
    })
    const t = calculateTotals(state)
    const velux = t.resolvedItems.find((r) => r.def.id === 'veluxen-nieuw')
    expect(velux?.lineTotal).toBe(0)
    // De qty wordt wél getoond zodat verkoper het ziet
    expect(velux?.quantity).toBe(3)
  })
})
