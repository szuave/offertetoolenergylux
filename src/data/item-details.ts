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

export type DetailField = SelectField | TextField | ConditionalSelectField

const ESTHETISCHE_AFWERKING_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'merk',
    label: 'Merk',
    options: ['Rockpanel', 'Trespa', 'Volkern', 'Padouk'],
  },
  {
    kind: 'text',
    key: 'ral',
    label: 'RAL-kleur',
    placeholder: 'bv. RAL 7016',
  },
  {
    kind: 'select',
    key: 'plaat-dimensie',
    label: 'Plaat-dimensie',
    options: ['30 cm', '40 cm', '50 cm', '60 cm'],
  },
]

const OVERSTEKEN_FIELDS: readonly DetailField[] = [
  {
    kind: 'select',
    key: 'dakrand-breedte',
    label: 'Dakrand-breedte',
    options: ['40 cm', '50 cm', '60 cm'],
  },
  {
    kind: 'conditional-select',
    key: 'oversteek-combo',
    label: 'Dimensie-combo',
    dependsOn: 'dakrand-breedte',
    optionsByValue: {
      '40 cm': ['30-30', '30-40'],
      '50 cm': ['30-30', '30-40', '30-50'],
      '60 cm': ['30-30', '30-40', '30-50', '30-60'],
    },
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
  'esthetische-afwerking-oversteken': [
    ...ESTHETISCHE_AFWERKING_FIELDS,
    ...OVERSTEKEN_FIELDS,
  ],

  // Oversteken — conditionele dimensie-combo afhankelijk van dakrand-breedte.
  'verwijderen-oversteken': OVERSTEKEN_FIELDS,
  'strippen-oversteken': OVERSTEKEN_FIELDS,
  'nieuwe-oversteken-timmeren': OVERSTEKEN_FIELDS,
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
