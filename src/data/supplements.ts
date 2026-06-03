/**
 * Werf-supplementen — checklist-vragen die de prijs verhogen.
 * Komt uit Yasid's mail v2 / Excel-opmerkingen.
 *
 * Logica:
 *  - `plat-dak-moeilijke-werf`: +7% op de plat-dak subtotaal, met min €3000
 *    (mail: "werf moeilijk bereikbaar, hoger dan 8 meter, container niet
 *    mogelijk, container en materiaal +5 lopende meter van werf")
 *  - `gevel-moeilijke-gevel`: +€20/m² op gevel-subtotaal (mail: "veel
 *    hoekjes en kantjes, electriciteitsbak/-kabel tegen de gevel,
 *    ventilatieroosters, waterkraan moet verlengd worden")
 */

export type SupplementRule =
  | { kind: 'percentageOfCategory'; categoryId: string; percentage: number; minimum: number }
  | { kind: 'perM2OfCategory'; categoryId: string; amountPerM2: number }

export type SupplementDef = {
  id: string
  label: string
  description: string
  /** Categorie waaraan dit supplement gekoppeld is (verberg supplement als die niet in scope). */
  categoryId: string
  rule: SupplementRule
}

export const SUPPLEMENTS: readonly SupplementDef[] = [
  {
    id: 'hellend-dak-moeilijke-werf',
    label: 'Moeilijke werf hellend dak',
    description:
      'Werf moeilijk bereikbaar, container niet mogelijk, of container/materiaal +5 lm van werf. Geeft +7 % op hellend-dak werken met een minimum van €4319.',
    categoryId: 'hellend-dak',
    rule: { kind: 'percentageOfCategory', categoryId: 'hellend-dak', percentage: 7, minimum: 4319 },
  },
  {
    id: 'plat-dak-moeilijke-werf',
    label: 'Moeilijke werf plat dak',
    description:
      'Werf moeilijk bereikbaar, hoger dan 8 m, container niet mogelijk, of container/materiaal +5 lm van werf. Geeft +7 % op plat-dak werken met een minimum van €3000.',
    categoryId: 'plat-dak',
    rule: { kind: 'percentageOfCategory', categoryId: 'plat-dak', percentage: 7, minimum: 3000 },
  },
  {
    id: 'gevel-moeilijke-gevel',
    label: 'Moeilijke gevel',
    description:
      'Veel hoekjes en kantjes, electriciteitsbak of -kabel tegen de gevel, ventilatieroosters, waterkraan die verlengd moet worden. Geeft +€20/m² op gevelwerken.',
    categoryId: 'gevelwerken',
    rule: { kind: 'perM2OfCategory', categoryId: 'gevelwerken', amountPerM2: 20 },
  },
]

export function getSupplement(id: string): SupplementDef | undefined {
  return SUPPLEMENTS.find((s) => s.id === id)
}
