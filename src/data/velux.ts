/**
 * Velux-data: maten, basistypes, gootstukken en accessoires uit Yasid's
 * "Velux artikelen-2.xlsx" (8 juni). Gegenereerd door parse-velux.mjs.
 *
 * Yasid 11 juni: ALLE modellen uit de Excel worden opgenomen, ook die
 * waar de prijs nog ontbreekt — dan staat `prijs: null` en toont de UI
 * "(Prijs volgt)" achter het model. Verkoper kan dat model toch zien.
 */
import raw from '@/data/velux-data.json'

// Korte id-generator (8 chars) — voldoende voor React keys binnen één
// offerte. Geen nanoid-dependency: vermijd extra bundle weight.
function shortId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export type VeluxBasis = {
  /** "Velux" of "Integra" (Integra = elektrisch). */
  type: string
  /** Productcode, bv. "GGL 2066". */
  code: string
  /** null = prijs ontbreekt. opAanvraag-items hebben prijs null en de
   *  verkoper vult de prijs zelf in via VeluxConfig.aangepastePrijs. */
  prijs: number | null
  /** Yasid: "op aanvraag" — verkoper vult de prijs handmatig in. */
  opAanvraag?: boolean
}

export type VeluxAccessoire = {
  code: string
  prijs: number | null
  opAanvraag?: boolean
}

export type VeluxKleurAccessoire = {
  code: string
  kleur: string
  prijs: number | null
  opAanvraag?: boolean
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
 * Eén Velux-configuratie. Yasid 11 juni: verkoper moet meerdere Velux-
 * types in dezelfde offerte kunnen plaatsen (bv. 3× MK04 + 1× UK04),
 * dus de QuoteState bevat een ARRAY van VeluxConfig.
 */
export type VeluxConfig = {
  id: string
  aantal: number
  maat: string | null
  basisCode: string | null
  gootstukCode: string | null
  verduisterCode: string | null
  zonneGordijnCode: string | null
  buitenZonCode: string | null
  rolluikCode: string | null
  /**
   * Door verkoper ingevulde basisprijs wanneer het gekozen basismodel
   * "op aanvraag" is (bv. CK06 GGL 2062, UK08 GGL 2050). Vervangt de
   * basisprijs in veluxConfigUnitPrice. null = nog niet ingevuld.
   */
  aangepastePrijs?: number | null
}

export function emptyVeluxConfig(): VeluxConfig {
  return {
    id: shortId(),
    aantal: 1,
    maat: null,
    basisCode: null,
    gootstukCode: null,
    verduisterCode: null,
    zonneGordijnCode: null,
    buitenZonCode: null,
    rolluikCode: null,
    aangepastePrijs: null,
  }
}

/** Is het gekozen basismodel een "op aanvraag" item? */
export function veluxConfigBasisIsOpAanvraag(config: VeluxConfig): boolean {
  const maat = config.maat ? findMaat(config.maat) : null
  if (!maat) return false
  const basis = maat.basis.find((b) => b.code === config.basisCode)
  return basis?.opAanvraag === true
}

/**
 * Prijs per stuk voor één configuratie. Null-prijs onderdelen (Yasid moet
 * nog leveren) tellen voor 0 — de UI flagt dit zichtbaar zodat verkoper
 * weet dat de offerte onvolledig is.
 */
export function veluxConfigUnitPrice(config: VeluxConfig): number {
  const maat = config.maat ? findMaat(config.maat) : null
  if (!maat) return 0
  let total = 0
  const basis = maat.basis.find((b) => b.code === config.basisCode)
  if (basis) {
    // Op-aanvraag: gebruik aangepastePrijs als die ingevuld is, anders 0.
    if (basis.opAanvraag) {
      if (typeof config.aangepastePrijs === 'number' && config.aangepastePrijs > 0) {
        total += config.aangepastePrijs
      }
    } else if (basis.prijs) {
      total += basis.prijs
    }
  }
  const gs = maat.gootstuk.find((g) => g.code === config.gootstukCode)
  if (gs?.prijs) total += gs.prijs
  const vd = maat.verduister.find((x) => x.code === config.verduisterCode)
  if (vd?.prijs) total += vd.prijs
  const zg = maat.zonneGordijn.find((x) => x.code === config.zonneGordijnCode)
  if (zg?.prijs) total += zg.prijs
  const bz = maat.buitenZon.find((x) => x.code === config.buitenZonCode)
  if (bz?.prijs) total += bz.prijs
  const rl = maat.rolluik.find((x) => x.code === config.rolluikCode)
  if (rl?.prijs) total += rl.prijs
  return Math.round(total * 100) / 100
}

export function veluxConfigIsCompleet(config: VeluxConfig): boolean {
  return config.maat !== null && config.basisCode !== null && config.aantal > 0
}

/** Heeft deze config een gekozen onderdeel waarvan de prijs null is? */
export function veluxConfigHasMissingPrice(config: VeluxConfig): boolean {
  const maat = config.maat ? findMaat(config.maat) : null
  if (!maat) return false
  const basis = maat.basis.find((b) => b.code === config.basisCode)
  if (basis && basis.prijs === null) return true
  const gs = maat.gootstuk.find((g) => g.code === config.gootstukCode)
  if (gs && gs.prijs === null) return true
  const vd = maat.verduister.find((x) => x.code === config.verduisterCode)
  if (vd && vd.prijs === null) return true
  const zg = maat.zonneGordijn.find((x) => x.code === config.zonneGordijnCode)
  if (zg && zg.prijs === null) return true
  const bz = maat.buitenZon.find((x) => x.code === config.buitenZonCode)
  if (bz && bz.prijs === null) return true
  const rl = maat.rolluik.find((x) => x.code === config.rolluikCode)
  if (rl && rl.prijs === null) return true
  return false
}

export function veluxConfigSummary(config: VeluxConfig): string {
  if (!config.maat || !config.basisCode) return 'Geen Velux gekozen'
  const maat = findMaat(config.maat)
  if (!maat) return 'Onbekende maat'
  const basis = maat.basis.find((b) => b.code === config.basisCode)
  const parts = [`${maat.code} — ${basis?.type ?? ''} ${basis?.code ?? ''}`.trim()]
  if (config.gootstukCode) parts.push(`Gootstuk ${config.gootstukCode}`)
  if (config.verduisterCode) parts.push(`Verduistering ${config.verduisterCode}`)
  if (config.zonneGordijnCode) parts.push(`Zonnegordijn ${config.zonneGordijnCode}`)
  if (config.buitenZonCode) parts.push(`Buitenzon ${config.buitenZonCode}`)
  if (config.rolluikCode) parts.push(`Rolluik ${config.rolluikCode}`)
  return parts.join(' · ')
}

/** Totaal aantal Veluxen over alle configs. */
export function veluxConfigsTotalAantal(configs: readonly VeluxConfig[]): number {
  return configs.reduce((s, c) => s + (c.aantal || 0), 0)
}

/** Som over alle configs: aantal × unit-prijs. Null-prijs telt als 0. */
export function veluxConfigsTotalPrice(configs: readonly VeluxConfig[]): number {
  let total = 0
  for (const c of configs) total += c.aantal * veluxConfigUnitPrice(c)
  return Math.round(total * 100) / 100
}
