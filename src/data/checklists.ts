/**
 * Checklists met prijsimpact (Daryl 4 juni). Vervangt de oude
 * werf-supplementen.
 *
 * Vier checklists:
 *  1. Werfinstallatie-belemmering (info-only, geen prijsimpact)
 *  2. Gevel ventilatieroosters (4 items met aantal-input en vaste prijzen)
 *  3. Zonnepanelen (3 cumulatieve % supplementen)
 *  4. EIND-checklist (5 items, één aanvink = +20% op totaal BTW ex)
 */

export type ChecklistAnswer = {
  /** Aangevinkt (ja/nee). */
  checked?: boolean
  /** Numerieke input (aantal m²/lm/meter). */
  amount?: number
  /** Vrije tekst. */
  text?: string
}

/** State per checklist: item-id → antwoord. */
export type ChecklistAnswers = Record<string, ChecklistAnswer>

export type ChecklistItemRule =
  | { kind: 'fixed'; amount: number }
  | { kind: 'perAmount'; pricePerUnit: number }
  | { kind: 'percentageOfBasePrice'; percentage: number; itemIds: readonly string[] }

export type ChecklistItem = {
  id: string
  label: string
  /** Sub-input naast de ja/nee: 'aantal' (text input), 'tekst' (vrije text), of geen. */
  input?: { kind: 'aantal'; unit: 'm2' | 'lm' | 'meter'; label: string } | { kind: 'tekst'; label: string; placeholder?: string }
  rule?: ChecklistItemRule
}

export type ChecklistDef = {
  id: string
  label: string
  description?: string
  /** Verschijnt wanneer welke scope-categorie aan staat (of altijd). */
  appliesWhen: { categoryId?: string; itemHasQty?: string; always?: boolean }
  items: readonly ChecklistItem[]
  /** Wanneer één van de items aangevinkt is, geldt deze groeps-regel ook. */
  groupRule?:
    | { kind: 'percentageOfSubtotal'; percentage: number }
    | { kind: 'noop' }
}

/* ---------------------------------------------------------------------- */
/* 1. Werfinstallatie-belemmering (info-only)                              */
/* ---------------------------------------------------------------------- */
const CHECKLIST_WERF_BELEMMERING: ChecklistDef = {
  id: 'werf-belemmering',
  label: 'Belemmering stelling plaatsen',
  description: 'Wat is er aanwezig op de werf? (informatief)',
  appliesWhen: { categoryId: 'hellend-dak' },
  items: [
    { id: 'carport', label: 'Carport' },
    { id: 'struiken', label: 'Struiken / andere zaken in de weg' },
    { id: 'moeilijk-bereikbaar', label: 'Werf moeilijk bereikbaar (container niet mogelijk)' },
    { id: 'container-vijf-meter', label: 'Container/materiaal +5 lopende meter van werf' },
    {
      id: 'opmerking',
      label: 'Extra opmerking',
      input: { kind: 'tekst', label: 'Toelichting', placeholder: 'optionele info' },
    },
  ],
}

/* ---------------------------------------------------------------------- */
/* 2. Gevel ventilatieroosters (4 items met aantal-input)                  */
/* ---------------------------------------------------------------------- */
const CHECKLIST_GEVEL_VENTILATIE: ChecklistDef = {
  id: 'gevel-ventilatie',
  label: 'Gevelwerken — ventilatie & afwatering',
  description:
    'Alle vragen moeten beantwoord worden (ja/nee). Sommige genereren een prijssupplement.',
  appliesWhen: { categoryId: 'gevelwerken' },
  items: [
    { id: 'barst-gevel', label: 'Barst(en) in de gevel' },
    {
      id: 'muur-recht',
      label: 'Muur dient recht gemaakt te worden',
      input: { kind: 'aantal', unit: 'm2', label: 'm²' },
      rule: { kind: 'perAmount', pricePerUnit: 32 },
    },
    {
      id: 'dakverbreding-zink',
      label: 'Dakverbreding zink op maat',
      input: { kind: 'aantal', unit: 'lm', label: 'lm' },
      rule: { kind: 'perAmount', pricePerUnit: 73 },
    },
    {
      id: 'afwatering-ok',
      label: 'Afwatering naar goot na gevelisolatie OK',
      rule: { kind: 'fixed', amount: 431 },
    },
  ],
}

/* ---------------------------------------------------------------------- */
/* 3. Zonnepanelen — cumulatieve % supplementen                            */
/* ---------------------------------------------------------------------- */
const ZONNEPANEEL_ITEMS = [
  'demonteren-zonnepanelen',
  'monteren-zonnepanelen',
] as const

const CHECKLIST_ZONNEPANELEN: ChecklistDef = {
  id: 'zonnepanelen-supplementen',
  label: 'Zonnepanelen — werfomstandigheden',
  description: 'Cumulatieve verhoging op de basisprijs van de zonnepaneel-items.',
  appliesWhen: { itemHasQty: 'monteren-zonnepanelen' },
  items: [
    {
      id: 'hoger-6m',
      label: 'Hoger dan 6 meter',
      rule: { kind: 'percentageOfBasePrice', percentage: 20, itemIds: [...ZONNEPANEEL_ITEMS] },
    },
    {
      id: 'leien-dak',
      label: 'Leien dak (cumulatief)',
      rule: { kind: 'percentageOfBasePrice', percentage: 25, itemIds: [...ZONNEPANEEL_ITEMS] },
    },
    {
      id: 'afstand-12m',
      label: 'Afstand zonnepanelen > 12 m van omvormer/elektriciteitskast',
      input: { kind: 'aantal', unit: 'meter', label: 'aantal meter' },
      rule: { kind: 'percentageOfBasePrice', percentage: 12, itemIds: [...ZONNEPANEEL_ITEMS] },
    },
  ],
}

/* ---------------------------------------------------------------------- */
/* 4. EIND-checklist (+20% bij één aanvink)                                */
/* ---------------------------------------------------------------------- */
const CHECKLIST_EIND: ChecklistDef = {
  id: 'eind-checklist',
  label: 'Werf-omstandigheden (eindcheck)',
  description:
    'Indien minstens één van deze omstandigheden van toepassing is, wordt het subtotaal (BTW excl.) met 20 % verhoogd.',
  appliesWhen: { always: true },
  items: [
    { id: 'hoger-6m', label: 'Hoger dan 6 meter' },
    { id: 'afvoer-moeilijk', label: 'Afvoer moeilijk' },
    { id: 'container-5m', label: 'Container 5 meter van de werf' },
    { id: 'container-niet-plaatsbaar', label: 'Container kan niet geplaatst worden' },
    { id: 'energylux-bestelwagen', label: 'Afval afvoeren door Energylux met bestelwagen' },
  ],
  groupRule: { kind: 'percentageOfSubtotal', percentage: 20 },
}

export const CHECKLISTS: readonly ChecklistDef[] = [
  CHECKLIST_WERF_BELEMMERING,
  CHECKLIST_GEVEL_VENTILATIE,
  CHECKLIST_ZONNEPANELEN,
  CHECKLIST_EIND,
]

export function getChecklist(id: string): ChecklistDef | undefined {
  return CHECKLISTS.find((c) => c.id === id)
}
