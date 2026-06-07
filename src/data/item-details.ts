/**
 * Sub-opties (info-velden) per lijnitem.
 *
 * Yasid (Energylux) vroeg specifiek:
 *  - "Esthetische afwerking dakrand/hanggoot" → RAL-kleur, Merk
 *    (Rockpanel/Trespa/Volkern/Padouk), Dimensies (30/40/50/60 cm).
 *  - "Oversteken" → dakrand-breedte (40/50/60 cm) + dimensie-combinaties
 *    (30-30, 30-40, 30-50, 30-60) waar de mogelijke combo's afhangen van
 *    de gekozen breedte (40 cm → enkel 30-30 of 30-40, 50 cm → +30-50,
 *    60 cm → alle vier).
 *
 * De velden beïnvloeden de prijs niet — ze verschijnen onder de lijn op
 * de PDF zodat de uitvoerders weten welke materialen nodig zijn.
 */

export type SelectField = {
  kind: 'select'
  key: string
  label: string
  options: readonly string[]
}

export type TextField = {
  kind: 'text'
  key: string
  label: string
  placeholder?: string
}

/**
 * RAL-kleurpicker — autocomplete-input met dropdown van alle RAL Classic
 * kleuren (213). Verkoper typt code of naam, kleur-swatch verschijnt
 * naast elke suggestie. Klikken vult in.
 */
export type RalField = {
  kind: 'ral'
  key: string
  label: string
}

/**
 * Veld waarvan de mogelijke opties afhangen van de waarde van een ander veld.
 * Wordt gebruikt voor de oversteken-dimensies: pas zinvolle combo's tonen
 * zodra de dakrand-breedte gekozen is.
 */
export type ConditionalSelectField = {
  kind: 'conditional-select'
  key: string
  label: string
  dependsOn: string
  optionsByValue: Readonly<Record<string, readonly string[]>>
}

export type DetailField = SelectField | TextField | RalField | ConditionalSelectField

const ESTHETISCHE_AFWERKING_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'merk',
    label: 'Merk',
    options: ['Rockpanel', 'Trespa', 'Volkern', 'Padouk'],
  },
  { kind: 'ral', key: 'ral', label: 'RAL-kleur' },
  {
    kind: 'select',
    key: 'plaat-dimensie',
    label: 'Plaat-dimensie',
    options: ['30 cm', '40 cm', '50 cm', '60 cm'],
  },
]

/**
 * Daryl (4 juni): "dimensie combo moet dimensie hoogte-diepte zijn".
 * Eerste maat = hoogte (was breedte in v2). Tweede maat = diepte. Combo's
 * blijven dezelfde getallen, alleen de interpretatie.
 */
const DIMENSIE_COMBO_PER_HOOGTE: Readonly<Record<string, readonly string[]>> = {
  '30 cm': ['30-30', '30-40', '30-50', '30-60'],
  '40 cm': ['40-40', '40-50', '40-60'],
  '50 cm': ['50-50', '50-60'],
  '60 cm': ['60-60'],
}

/** Voor nieuwe-oversteken-timmeren: hoogte + combo + vrije diepte in cm. */
const OVERSTEKEN_NIEUW_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'oversteek-hoogte',
    label: 'Oversteek-hoogte',
    options: ['30 cm', '40 cm', '50 cm', '60 cm'],
  },
  {
    kind: 'conditional-select',
    key: 'dimensie-hoogte-diepte',
    label: 'Dimensie hoogte-diepte',
    dependsOn: 'oversteek-hoogte',
    optionsByValue: DIMENSIE_COMBO_PER_HOOGTE,
  },
  {
    kind: 'text',
    key: 'diepte-cm',
    label: 'Diepte (cm)',
    placeholder: 'bv. 35',
  },
]

/** Voor esthetische-afwerking-oversteken: merk + ral + hoogte + combo (geen diepte cm). */
const ESTHETISCHE_OVERSTEKEN_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'merk',
    label: 'Merk',
    options: ['Rockpanel', 'Trespa', 'Volkern', 'Padouk'],
  },
  { kind: 'ral', key: 'ral', label: 'RAL-kleur' },
  {
    kind: 'select',
    key: 'oversteek-hoogte',
    label: 'Oversteek-hoogte',
    options: ['30 cm', '40 cm', '50 cm', '60 cm'],
  },
  {
    kind: 'conditional-select',
    key: 'dimensie-hoogte-diepte',
    label: 'Dimensie hoogte-diepte',
    dependsOn: 'oversteek-hoogte',
    optionsByValue: DIMENSIE_COMBO_PER_HOOGTE,
  },
]

/** Voor buitenbekleding / zinken binnenbekleding / EPDM dichting bakgoot. */
const BAKGOTEN_BEKLEDING_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'merk',
    label: 'Merk',
    options: ['Rockpanel', 'Trespa', 'Volkern', 'Padouk', 'Zink', 'Aluminium'],
  },
  { kind: 'ral', key: 'ral', label: 'RAL-kleur' },
  {
    kind: 'select',
    key: 'bakgoot-hoogte',
    label: 'Bakgoot-hoogte',
    options: ['30 cm', '40 cm', '50 cm', '60 cm'],
  },
  {
    kind: 'conditional-select',
    key: 'dimensie-hoogte-diepte',
    label: 'Dimensie hoogte-diepte',
    dependsOn: 'bakgoot-hoogte',
    optionsByValue: DIMENSIE_COMBO_PER_HOOGTE,
  },
]

/** Voor nieuwe-bakgoot-timmeren: geen merk/RAL — Daryl wil die weg. */
const BAKGOTEN_NIEUW_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'bakgoot-hoogte',
    label: 'Bakgoot-hoogte',
    options: ['30 cm', '40 cm', '50 cm', '60 cm'],
  },
  {
    kind: 'conditional-select',
    key: 'dimensie-hoogte-diepte',
    label: 'Dimensie hoogte-diepte',
    dependsOn: 'bakgoot-hoogte',
    optionsByValue: DIMENSIE_COMBO_PER_HOOGTE,
  },
]

const RAL_ONLY_FIELDS: readonly DetailField[] = [
  { kind: 'ral', key: 'ral', label: 'RAL-kleur' },
]

/**
 * Yasid Excel rij 3-6: "Stelling info altijd vermelden — carport,
 * struiken, rommel, te smalle doorgang, …". Verkoper vult een vrij
 * tekstveld in.
 */
const STELLING_FIELDS: readonly DetailField[] = [
  {
    kind: 'text',
    key: 'info',
    label: 'Werf-info bij stelling',
    placeholder: 'carport, struiken, rommel, te smalle doorgang, …',
  },
]

/**
 * Yasid Excel rij 156: "Leveren nieuwe koepel — Offerte opvragen en
 * exacte productcode vermelden op offerte. Klantenprijs = leveranciers-
 * prijs vermeerderd met 20 %". Verkoper vult productcode + lev-prijs in,
 * calculator zet er +20 % op.
 */
const KOEPEL_FIELDS: readonly DetailField[] = [
  {
    kind: 'text',
    key: 'productcode',
    label: 'Productcode koepel',
    placeholder: 'exacte code van leverancier',
  },
  {
    kind: 'text',
    key: 'leveranciersprijs',
    label: 'Leveranciersprijs (excl. BTW)',
    placeholder: 'bv. 450 — wordt +20% verkoopprijs',
  },
]

/** Item-ID → fields. Items zonder entry hebben geen sub-opties. */
export const ITEM_DETAILS: Readonly<Record<string, readonly DetailField[]>> = {
  // Esthetische afwerkingen — Yasid wil hier merk + RAL + plaat-dimensie.
  'esthetische-afwerking-dakrand': ESTHETISCHE_AFWERKING_FIELDS,
  'esthetische-afwerking-hellende-dakrand-zijkant-m': ESTHETISCHE_AFWERKING_FIELDS,
  'esthetische-afwerking-hanggoot': ESTHETISCHE_AFWERKING_FIELDS,
  'esthetische-afwerking-zijkant-dakkapel': ESTHETISCHE_AFWERKING_FIELDS,
  'esthetische-afwerking-voorzijde-dakkapel': ESTHETISCHE_AFWERKING_FIELDS,
  // Daryl 4 juni: esthetische afwerking oversteken = merk + ral + oversteek-
  // hoogte + dimensie hoogte-diepte (dakrand-breedte weg, plaat-dim → oversteek-hoogte).
  'esthetische-afwerking-oversteken': ESTHETISCHE_OVERSTEKEN_FIELDS,

  // Daryl 4 juni: afbraak-oversteken hebben geen sub-opties nodig.
  'verwijderen-oversteken': [],
  'strippen-oversteken': [],
  // Daryl 4 juni: nieuwe oversteken — geen merk/ral/plaat-dim, wel
  // oversteek-hoogte + combo + diepte in cm.
  'nieuwe-oversteken-timmeren-toekomstige-gevelisol': OVERSTEKEN_NIEUW_FIELDS,
  'nieuwe-oversteek-timmeren-basis-nieuwe-bekleding': OVERSTEKEN_NIEUW_FIELDS,

  // Daryl 4 juni: "Strippen bakgoten — Merk / ral / breedte / combo
  // moeten hier niet staan". Afbraak-items hebben geen sub-opties.
  'verwijderen-bakgoten': [],
  'strippen-bakgoten': [],
  'strippen-binnenbekleding-bakgoot': [],
  // Bekleding-items: merk + ral + bakgoot-hoogte + dimensie hoogte-diepte.
  'buitenbekleding-bakgoot': BAKGOTEN_BEKLEDING_FIELDS,
  'zinken-binnenbekleding-bakgoot': BAKGOTEN_BEKLEDING_FIELDS,
  'epdm-dichting-bakgoot': BAKGOTEN_BEKLEDING_FIELDS,
  // Daryl 4 juni: nieuwe bakgoot — geen merk/ral, wel hoogte + combo.
  'nieuwe-bakgoot-timmeren': BAKGOTEN_NIEUW_FIELDS,

  // Gevelwerken — RAL-kleurcode is verplicht.
  'gevelafwerking-crepi-siliconenharspleister': RAL_ONLY_FIELDS,
  'granietpleister': RAL_ONLY_FIELDS,
  'aludorpels': RAL_ONLY_FIELDS,
  'leveren-en-plaatsen-aludorpels': RAL_ONLY_FIELDS,

  // Stelling-items — vrije tekst voor werf-info.
  'stelling-valbeveiliging-voorgevel': STELLING_FIELDS,
  'stelling-valbeveiliging-achtergevel': STELLING_FIELDS,
  'stelling-valbeveiliging-zijkant-links': STELLING_FIELDS,
  'stelling-valbeveiliging-zijkant-rechts': STELLING_FIELDS,

  // Lichtkoepel — leveranciersprijs + 20 % marge.
  'leveren-nieuwe-koepel': KOEPEL_FIELDS,

  // Minerale wol — Yasid Excel rij 53: "Keuze 6cm, 16cm, 22cm".
  'minerale-wol': [
    {
      kind: 'select',
      key: 'dikte',
      label: 'Dikte minerale wol',
      options: ['6 cm', '16 cm', '22 cm'],
    },
  ],
}

export function getDetailFields(itemId: string): readonly DetailField[] | null {
  return ITEM_DETAILS[itemId] ?? null
}

/**
 * Telt hoeveel sub-opties verplicht-maar-nog-leeg zijn voor één item.
 * Houdt rekening met conditional fields: pas verplicht zodra de parent
 * gekozen is.
 */
export function countMissingDetails(
  itemId: string,
  values: Readonly<Record<string, string>>,
): number {
  const fields = getDetailFields(itemId)
  if (!fields) return 0
  let missing = 0
  for (const f of fields) {
    if (f.kind === 'conditional-select') {
      const parent = values[f.dependsOn]
      if (!parent) continue // parent nog niet ingevuld → kind nog niet relevant
      const opts = f.optionsByValue[parent]
      if (!opts || opts.length === 0) continue
      if (!values[f.key] || values[f.key]!.trim() === '') missing++
    } else {
      if (!values[f.key] || values[f.key]!.trim() === '') missing++
    }
  }
  return missing
}
