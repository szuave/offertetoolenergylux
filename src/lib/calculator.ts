import { pricingConfig } from '@/data/pricing'
import { findVariant, CATEGORY_LABEL } from '@/data/dakbekleding'
import { itemFlagOverride, subcategoryFlag } from '@/data/filter-mappings'
import { CHECKLISTS } from '@/data/checklists'
import { veluxUnitPrice, veluxKeuzeIsCompleet } from '@/data/velux'
import type {
  AppliedSupplement,
  CategoryDef,
  LineItemDef,
  QuoteState,
  ResolvedLineItem,
  SubcategoryDef,
  SubtotalBreakdown,
  Totals,
} from '@/types/quote'

/**
 * Yasid's mail v2: filter "bakgoten en hanggoten" moet apart — items met die
 * tag verschijnen voortaan zodra één van beide aanstaat.
 */
export function isFlagActive(flagId: string, flags: Record<string, boolean>): boolean {
  if (flagId === 'bakgoten-en-hanggoten') {
    return Boolean(flags['bakgoten']) || Boolean(flags['hanggoten'])
  }
  return Boolean(flags[flagId])
}

/**
 * Yasid Excel: "Onderdak — altijd voorstellen als dakpan OF leien wordt
 * gekozen". Idem voor "Nokpan/Begin-eindvorst/Gevelpan/Noordbomen — altijd
 * bij keuze dakpan". Check op basis van de DakbekledingSelector-keuze.
 */
export function isDakpanChosen(state: Pick<QuoteState, 'cover'>): boolean {
  if (!state.cover.variantId) return false
  const v = findVariant(state.cover.variantId)
  return v?.category === 'dakpannen'
}

export function isDakpanOfLeienChosen(state: Pick<QuoteState, 'cover'>): boolean {
  if (!state.cover.variantId) return false
  const v = findVariant(state.cover.variantId)
  return v?.category === 'dakpannen' || v?.category === 'leien'
}

/**
 * Daryl 4 juni overrult Yasid Excel rij 83-88: Onderdak / Nokpan /
 * Gevelpan / Noordbomen moeten ALTIJD zichtbaar zijn bij hellend dak
 * (zie src/data/always-visible.ts). Begin-en-eindvorst was niet expliciet
 * vermeld door Daryl en blijft conditioneel op dakpan-keuze.
 */
export const ITEMS_ALLEEN_BIJ_DAKPAN = new Set(['begin-en-eindvorst'])
export const ITEMS_ALLEEN_BIJ_DAKPAN_OF_LEIEN = new Set<string>()

/**
 * Som van verwijderde dakbekleding-m² (multipleChoice "Verwijderen
 * dakbekleding"). Gebruikt voor de container-counter en de m²-prijs
 * van toxisch afval.
 */
const REMOVAL_ITEM_IDS = [
  'verwijderen-dakpannen',
  'verwijderen-asbestleien',
  'verwijderen-asbestonderdak',
  'verwijderen-sandwichpanelen',
  'verwijderen-singles',
]
function removedDakbekledingM2(state: QuoteState): number {
  // Alleen het item dat in de multipleChoice "verwijderen-dakbekleding" is
  // gekozen telt (anders dubbel rekenen bij wisselen).
  const chosen = state.groupSelections['verwijderen-dakbekleding']
  if (!chosen) return 0
  if (!REMOVAL_ITEM_IDS.includes(chosen)) return 0
  return state.quantities[chosen] ?? 0
}

/**
 * Yasid Excel rij 7: "Afvoeren werfpuin = €650 voor 1 container tem 90m²,
 * vanaf dan aantal 2 tellen" → aantal containers = ceil(removed_m² / 90).
 */
export function containerCount(state: QuoteState): number {
  const m2 = removedDakbekledingM2(state)
  if (m2 <= 0) return 0
  return Math.ceil(m2 / 90)
}

/**
 * Bepaalt of een item zichtbaar/actief is voor de huidige filter-state.
 * Voor sommige items geldt dat hun rij in de Excel een "Filteroptie"-kolom heeft
 * die los staat van het basis-filtertype — die worden via `itemFlagOverride`
 * extra geblokkeerd zolang die filter uit staat.
 */
export function isItemActive(
  item: LineItemDef,
  state: Pick<QuoteState, 'groupSelections' | 'flags' | 'quantities' | 'cover'>,
): boolean {
  // Cross-cutting filteroptie (bv. "gyproc-zolder") moet ook aan staan.
  const overrideFlag = itemFlagOverride(item.id)
  if (overrideFlag && !state.flags[overrideFlag]) return false

  // Yasid Excel: Onderdak alleen actief bij dakpan/leien-keuze;
  // Nokpan/Begin-eindvorst/Gevelpan/Noordbomen alleen bij dakpan-keuze.
  if (ITEMS_ALLEEN_BIJ_DAKPAN_OF_LEIEN.has(item.id) && !isDakpanOfLeienChosen(state)) {
    return false
  }
  if (ITEMS_ALLEEN_BIJ_DAKPAN.has(item.id) && !isDakpanChosen(state)) {
    return false
  }

  switch (item.filter.kind) {
    case 'always':
      return (state.quantities[item.id] ?? 0) > 0
    case 'multipleChoice':
      return state.groupSelections[item.filter.groupId] === item.id
    case 'optional':
      return isFlagActive(item.filter.flagId, state.flags)
  }
}

/**
 * Bepaalt of een subcategorie als geheel zichtbaar is. Sommige subcategorieën
 * (bv. "Isolatiewerken Sarking") hangen aan één filteroptie — als die uit
 * staat verbergt de hele subcategorie, ongeacht zijn items.
 */
export function isSubcategoryActive(
  subcategoryId: string,
  flags: Record<string, boolean>,
): boolean {
  const flag = subcategoryFlag(subcategoryId)
  if (!flag) return true
  return Boolean(flags[flag])
}

/**
 * Berekent het lijnbedrag voor één item. Items zonder prijs (null) tellen niet
 * mee in het totaal — die staan in de offerte als "prijs op aanvraag".
 * Houdt rekening met `minimumPrice`: als qty × unitPrice lager uitkomt dan
 * het minimum, geldt het minimum (Yasid mail v2: kiezelsteen min €1500,
 * toxisch min €800).
 */
export function calculateLineTotal(item: LineItemDef, quantity: number): number {
  if (item.unitPrice === null) return 0
  if (quantity <= 0) return 0
  const raw = item.unitPrice * quantity
  const total = item.minimumPrice !== undefined ? Math.max(raw, item.minimumPrice) : raw
  return round2(total)
}

// Virtuele categorie/subcategorie waaronder de dakbekleding-keuze (uit de
// dropdown-selector) als lijn verschijnt. De oude "Nieuwe dakbekleding"
// multipleChoice-groep in de catalogus wordt door de selector vervangen.
const HELLEND_DAK_CAT: CategoryDef = {
  id: 'hellend-dak',
  label: 'Hellend dak',
  subcategories: [],
}
const COVER_SUB: SubcategoryDef = {
  id: 'nieuwe-dakbekleding',
  label: 'Nieuwe dakbekleding',
  items: [],
}

function resolveCoverLine(state: QuoteState): ResolvedLineItem | null {
  const { variantId, areaM2 } = state.cover
  if (!variantId || areaM2 <= 0) return null
  const variant = findVariant(variantId)
  if (!variant) return null
  const label = `${CATEGORY_LABEL[variant.category]} — ${variant.brand} ${variant.type} (${variant.color})`
  const def: LineItemDef = {
    id: `cover:${variant.id}`,
    label,
    unit: 'm2',
    unitPrice: variant.unitPrice,
    filter: { kind: 'always' },
  }
  const lineTotal = calculateLineTotal(def, areaM2)
  return { def, category: HELLEND_DAK_CAT, subcategory: COVER_SUB, quantity: areaM2, lineTotal }
}

/**
 * Yasid Excel rij 7/8: speciale prijs-regels voor de twee afvoer-items
 * die overrulen de Excel-prijs.
 */
const CONTAINER_PRICE = 650
const TOXISCH_PER_M2 = 8
const TOXISCH_MINIMUM = 800

function resolveSpecialLine(
  item: LineItemDef,
  state: QuoteState,
): { quantity: number; lineTotal: number } | null {
  // Daryl 4 juni: afvoeren werfpuin + toxisch zijn nu ja/nee toggles
  // (apart, niet meer multiplechoice). Pas berekenen als verkoper "ja"
  // heeft aangevinkt (quantity > 0).
  if (item.id === 'afvoeren-werfpuin') {
    if ((state.quantities[item.id] ?? 0) <= 0) return null
    const count = containerCount(state)
    if (count <= 0) return null
    return { quantity: count, lineTotal: round2(count * CONTAINER_PRICE) }
  }
  if (item.id === 'afvoeren-werfpuin-toxisch-afval') {
    if ((state.quantities[item.id] ?? 0) <= 0) return null
    const m2 = removedDakbekledingM2(state)
    if (m2 <= 0) return null
    const raw = m2 * TOXISCH_PER_M2
    return { quantity: m2, lineTotal: round2(Math.max(raw, TOXISCH_MINIMUM)) }
  }
  // Yasid 8 juni: Veluxen nieuw — prijs = aantal × veluxUnitPrice(keuze)
  // op basis van de gekozen maat/basis/gootstuk/accessoires.
  if (item.id === 'veluxen-nieuw') {
    const qty = state.quantities[item.id] ?? 0
    if (qty <= 0) return null
    if (!veluxKeuzeIsCompleet(state.veluxKeuze)) {
      // Geen Velux gekozen → toon item maar met prijs 0 (verkoper moet kiezen)
      return { quantity: qty, lineTotal: 0 }
    }
    const unit = veluxUnitPrice(state.veluxKeuze)
    return { quantity: qty, lineTotal: round2(qty * unit) }
  }

  // Yasid Excel rij 156: koepel klantprijs = leveranciersprijs * 1.20.
  // Verkoper vult leveranciersprijs in via item-details, qty is aantal koepels.
  if (item.id === 'leveren-nieuwe-koepel') {
    const qty = state.quantities[item.id] ?? 0
    if (qty <= 0) return null
    const details = state.details[item.id] ?? {}
    const lev = Number(String(details['leveranciersprijs'] ?? '').replace(',', '.'))
    if (!Number.isFinite(lev) || lev <= 0) {
      return { quantity: qty, lineTotal: 0 }
    }
    return { quantity: qty, lineTotal: round2(qty * lev * 1.2) }
  }
  return null
}

export function resolveLineItems(state: QuoteState): ResolvedLineItem[] {
  const resolved: ResolvedLineItem[] = []
  for (const category of pricingConfig.categories) {
    for (const subcategory of category.subcategories) {
      const subActive = isSubcategoryActive(subcategory.id, state.flags)
      for (const item of subcategory.items) {
        // Items met eigen override (bv. gyproc-zolder) staan los van de
        // subcategorie-filter. Andere items volgen de subcategorie.
        if (!itemFlagOverride(item.id) && !subActive) continue
        if (!isItemActive(item, state)) continue

        // Speciale prijs-regels (container counter, toxisch €8/m²) overrulen
        // de standaard qty × unitPrice berekening.
        const special = resolveSpecialLine(item, state)
        if (special) {
          resolved.push({
            def: item,
            category,
            subcategory,
            quantity: special.quantity,
            lineTotal: special.lineTotal,
          })
          continue
        }

        const quantity = state.quantities[item.id] ?? 0
        if (quantity <= 0) continue
        const lineTotal = calculateLineTotal(item, quantity)
        resolved.push({ def: item, category, subcategory, quantity, lineTotal })
      }
    }
  }
  const cover = resolveCoverLine(state)
  if (cover) resolved.push(cover)
  return resolved
}

export function groupSubtotals(resolved: ResolvedLineItem[]): SubtotalBreakdown[] {
  const map = new Map<string, SubtotalBreakdown>()
  for (const line of resolved) {
    const key = `${line.category.id}::${line.subcategory.id}`
    let bucket = map.get(key)
    if (!bucket) {
      bucket = {
        categoryId: line.category.id,
        categoryLabel: line.category.label,
        subcategoryId: line.subcategory.id,
        subcategoryLabel: line.subcategory.label,
        amount: 0,
        items: [],
      }
      map.set(key, bucket)
    }
    bucket.amount = round2(bucket.amount + line.lineTotal)
    bucket.items.push(line)
  }
  return [...map.values()]
}

/**
 * Pas Daryl's 4 checklists toe (4 juni). Levert losse supplement-regels
 * en de EIND-checklist (+20%) apart op.
 */
function applyChecklists(
  state: QuoteState,
  itemsSubtotal: number,
  resolved: ResolvedLineItem[],
): { applied: AppliedSupplement[]; eindAmount: number } {
  const applied: AppliedSupplement[] = []
  let eindAmount = 0
  const answers = state.checklistAnswers ?? {}

  for (const checklist of CHECKLISTS) {
    const checklistAnswers = answers[checklist.id] ?? {}

    // EIND-checklist: +20% bij minstens 1 aanvink op het hele items-subtotal.
    if (checklist.groupRule?.kind === 'percentageOfSubtotal') {
      const anyChecked = checklist.items.some((it) => {
        const a = checklistAnswers[it.id]
        return a?.checked === true || a?.answer === 'ja'
      })
      if (anyChecked) {
        eindAmount = round2((itemsSubtotal * checklist.groupRule.percentage) / 100)
      }
      continue // EIND-checklist heeft geen per-item rules
    }

    // Per-item regels — een rule triggert bij `checked: true` OF
    // expliciet `answer: 'ja'` (gevel-ventilatie items).
    for (const item of checklist.items) {
      const answer = checklistAnswers[item.id]
      const triggered = answer?.checked === true || answer?.answer === 'ja'
      if (!triggered) continue
      if (!item.rule) continue

      let amount = 0
      let label = `${checklist.label}: ${item.label}`
      if (item.rule.kind === 'fixed') {
        amount = item.rule.amount
      } else if (item.rule.kind === 'perAmount') {
        const qty = answer.amount ?? 0
        amount = qty * item.rule.pricePerUnit
        if (qty > 0) label += ` (${qty}× €${item.rule.pricePerUnit})`
      } else if (item.rule.kind === 'percentageOfBasePrice') {
        // Basis = som van qty × unitPrice voor de gespecificeerde items
        let base = 0
        for (const line of resolved) {
          if (item.rule.itemIds.includes(line.def.id)) base += line.lineTotal
        }
        amount = (base * item.rule.percentage) / 100
        if (base > 0) label += ` (+${item.rule.percentage}%)`
      }
      if (amount > 0) {
        applied.push({ id: `${checklist.id}:${item.id}`, label, amount: round2(amount) })
      }
    }
  }

  return { applied, eindAmount }
}

export function calculateTotals(state: QuoteState): Totals {
  const resolved = resolveLineItems(state)
  const subtotals = groupSubtotals(resolved)
  const itemsSubtotal = round2(resolved.reduce((sum, l) => sum + l.lineTotal, 0))

  // Daryl 4 juni: 4 checklists toepassen.
  const { applied: appliedSupplements, eindAmount: eindChecklistAmount } =
    applyChecklists(state, itemsSubtotal, resolved)
  const supplementsTotal = round2(
    appliedSupplements.reduce((sum, s) => sum + s.amount, 0),
  )

  const subtotalExVat = round2(itemsSubtotal + supplementsTotal + eindChecklistAmount)

  const discountAmount = state.discount.enabled
    ? round2((subtotalExVat * state.discount.percentage) / 100)
    : 0

  const totalExVat = round2(subtotalExVat - discountAmount)
  const vatAmount = round2(totalExVat * state.vatRate)
  const totalIncVat = round2(totalExVat + vatAmount)

  const pricePerM2 =
    state.meta.roofAreaM2 > 0 ? round2(totalIncVat / state.meta.roofAreaM2) : null

  return {
    resolvedItems: resolved,
    subtotals,
    subtotalExVat,
    appliedSupplements,
    supplementsTotal,
    eindChecklistAmount,
    discountAmount,
    totalExVat,
    vatAmount,
    totalIncVat,
    pricePerM2,
  }
}

export function getSubcategoriesForCategory(categoryId: string): SubcategoryDef[] {
  const category = pricingConfig.categories.find((c) => c.id === categoryId)
  return category ? category.subcategories : []
}

export function getCategory(categoryId: string): CategoryDef | undefined {
  return pricingConfig.categories.find((c) => c.id === categoryId)
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
