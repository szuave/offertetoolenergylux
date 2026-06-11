/**
 * Velux-data: maten, basistypes, gootstukken en accessoires uit Yasid's
 * "Velux artikelen-2.xlsx" (8 juni). Gegenereerd door parse-velux.mjs.
 */
import raw from '@/data/velux-data.json'

export type VeluxBasis = {
  /** "Velux" of "Integra" (Integra = elektrisch). */
  type: string
  /** Productcode, bv. "GGL 2066". */
  code: string
  prijs: number
}

export type VeluxAccessoire = {
  code: string
  prijs: number
}

export type VeluxKleurAccessoire = {
  code: string
  kleur: string
  prijs: number
}

export type VeluxMaat = {
  /** Maatcode, bv. "MK06", "CK02". */
  code: string
  basis: VeluxBasis[]
  gootstuk: VeluxAccessoire[]
  verduister: VeluxKleurAccessoire[]
  zonneGordijn: VeluxKleurAccessoire[]
  buitenZon: VeluxKleurAccessoire[]
  rolluik: VeluxKleurAccessoire[]
}

type VeluxData = { maten: VeluxMaat[] }

export const veluxData = raw as VeluxData
export const veluxMaten: readonly VeluxMaat[] = veluxData.maten

export function findMaat(code: string): VeluxMaat | undefined {
  return veluxMaten.find((m) => m.code === code)
}

/**
 * Gebruikerskeuze per Velux-set. Verkoper kiest maat + basis-model en
 * optioneel een gootstuk en accessoires. Prijs wordt per item opgeteld.
 */
export type VeluxKeuze = {
  maat: string | null
  basisCode: string | null
  gootstukCode: string | null
  verduisterCode: string | null
  zonneGordijnCode: string | null
  buitenZonCode: string | null
  rolluikCode: string | null
}

export const EMPTY_VELUX_KEUZE: VeluxKeuze = {
  maat: null,
  basisCode: null,
  gootstukCode: null,
  verduisterCode: null,
  zonneGordijnCode: null,
  buitenZonCode: null,
  rolluikCode: null,
}

export function veluxUnitPrice(keuze: VeluxKeuze): number {
  const maat = keuze.maat ? findMaat(keuze.maat) : null
  if (!maat) return 0
  let total = 0
  const basis = maat.basis.find((b) => b.code === keuze.basisCode)
  if (basis) total += basis.prijs
  const gs = maat.gootstuk.find((g) => g.code === keuze.gootstukCode)
  if (gs) total += gs.prijs
  const vd = maat.verduister.find((x) => x.code === keuze.verduisterCode)
  if (vd) total += vd.prijs
  const zg = maat.zonneGordijn.find((x) => x.code === keuze.zonneGordijnCode)
  if (zg) total += zg.prijs
  const bz = maat.buitenZon.find((x) => x.code === keuze.buitenZonCode)
  if (bz) total += bz.prijs
  const rl = maat.rolluik.find((x) => x.code === keuze.rolluikCode)
  if (rl) total += rl.prijs
  return Math.round(total * 100) / 100
}

export function veluxKeuzeIsCompleet(keuze: VeluxKeuze): boolean {
  return keuze.maat !== null && keuze.basisCode !== null
}

export function veluxKeuzeSummary(keuze: VeluxKeuze): string {
  if (!keuze.maat || !keuze.basisCode) return 'Geen Velux gekozen'
  const maat = findMaat(keuze.maat)
  if (!maat) return 'Onbekende maat'
  const basis = maat.basis.find((b) => b.code === keuze.basisCode)
  const parts = [`${maat.code} — ${basis?.code ?? ''}`]
  if (keuze.gootstukCode) parts.push(`Gootstuk ${keuze.gootstukCode}`)
  if (keuze.verduisterCode) parts.push(`Verduistering ${keuze.verduisterCode}`)
  if (keuze.zonneGordijnCode) parts.push(`Zonnegordijn ${keuze.zonneGordijnCode}`)
  if (keuze.buitenZonCode) parts.push(`Buitenzon ${keuze.buitenZonCode}`)
  if (keuze.rolluikCode) parts.push(`Rolluik ${keuze.rolluikCode}`)
  return parts.join(' · ')
}
