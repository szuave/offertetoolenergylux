import { pricingConfig } from '@/data/pricing'
import { findVariant, CATEGORY_LABEL } from '@/data/dakbekleding'
import { itemFlagOverride, subcategoryFlag } from '@/data/filter-mappings'
import type {
  CategoryDef,
  LineItemDef,
  QuoteState,
  ResolvedLineItem,
  SubcategoryDef,
  SubtotalBreakdown,
  Totals,
} from '@/types/quote'

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
      return Boolean(state.flags[item.filter.flagId])
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
 */
export function calculateLineTotal(item: LineItemDef, quantity: number): number {
  if (item.unitPrice === null) return 0
  if (quantity <= 0) return 0
  return round2(item.unitPrice * quantity)
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

export function calculateTotals(state: QuoteState): Totals {
  const resolved = resolveLineItems(state)
  const subtotals = groupSubtotals(resolved)
  const subtotalExVat = round2(resolved.reduce((sum, l) => sum + l.lineTotal, 0))

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
