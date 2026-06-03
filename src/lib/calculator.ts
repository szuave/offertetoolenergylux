import { pricingConfig } from '@/data/pricing'
import { findVariant, CATEGORY_LABEL } from '@/data/dakbekleding'
import { itemFlagOverride, subcategoryFlag } from '@/data/filter-mappings'
import { SUPPLEMENTS } from '@/data/supplements'
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
 * Bepaalt of een item zichtbaar/actief is voor de huidige filter-state.
 * Voor sommige items geldt dat hun rij in de Excel een "Filteroptie"-kolom heeft
 * die los staat van het basis-filtertype — die worden via `itemFlagOverride`
 * extra geblokkeerd zolang die filter uit staat.
 */
export function isItemActive(
  item: LineItemDef,
  state: Pick<QuoteState, 'groupSelections' | 'flags' | 'quantities'>,
): boolean {
  // Cross-cutting filteroptie (bv. "gyproc-zolder") moet ook aan staan.
  const overrideFlag = itemFlagOverride(item.id)
  if (overrideFlag && !state.flags[overrideFlag]) return false

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

function applySupplements(
  state: QuoteState,
  subtotals: SubtotalBreakdown[],
): AppliedSupplement[] {
  const applied: AppliedSupplement[] = []
  const sums = new Map<string, number>()
  for (const s of subtotals) {
    sums.set(s.categoryId, (sums.get(s.categoryId) ?? 0) + s.amount)
  }
  for (const sup of SUPPLEMENTS) {
    if (!state.supplements?.[sup.id]) continue
    const base = sums.get(sup.rule.categoryId) ?? 0
    if (base <= 0) continue
    let amount = 0
    if (sup.rule.kind === 'percentageOfCategory') {
      amount = Math.max((base * sup.rule.percentage) / 100, sup.rule.minimum)
    } else if (sup.rule.kind === 'perM2OfCategory') {
      // Som van m²-items in deze categorie als basis voor de perM2-supplement.
      let totalM2 = 0
      for (const s of subtotals) {
        if (s.categoryId !== sup.rule.categoryId) continue
        for (const line of s.items) {
          if (line.def.unit === 'm2') totalM2 += line.quantity
        }
      }
      amount = totalM2 * sup.rule.amountPerM2
    }
    if (amount > 0) {
      applied.push({ id: sup.id, label: sup.label, amount: round2(amount) })
    }
  }
  return applied
}

export function calculateTotals(state: QuoteState): Totals {
  const resolved = resolveLineItems(state)
  const subtotals = groupSubtotals(resolved)
  const itemsSubtotal = round2(resolved.reduce((sum, l) => sum + l.lineTotal, 0))

  const appliedSupplements = applySupplements(state, subtotals)
  const supplementsTotal = round2(
    appliedSupplements.reduce((sum, s) => sum + s.amount, 0),
  )

  const subtotalExVat = round2(itemsSubtotal + supplementsTotal)

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
