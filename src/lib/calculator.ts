import { pricingConfig } from '@/data/pricing'
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
 * Bepaalt of een item meetelt in de berekening, gegeven de huidige filterstate.
 */
export function isItemActive(
  item: LineItemDef,
  state: Pick<QuoteState, 'groupSelections' | 'flags' | 'quantities'>,
): boolean {
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
 * Berekent het lijnbedrag voor één item. Items zonder prijs (null) tellen niet
 * mee in het totaal — die staan in de offerte als "prijs op aanvraag".
 */
export function calculateLineTotal(item: LineItemDef, quantity: number): number {
  if (item.unitPrice === null) return 0
  if (quantity <= 0) return 0
  return round2(item.unitPrice * quantity)
}

export function resolveLineItems(state: QuoteState): ResolvedLineItem[] {
  const resolved: ResolvedLineItem[] = []
  for (const category of pricingConfig.categories) {
    for (const subcategory of category.subcategories) {
      for (const item of subcategory.items) {
        if (!isItemActive(item, state)) continue
        const quantity = state.quantities[item.id] ?? 0
        if (quantity <= 0) continue
        const lineTotal = calculateLineTotal(item, quantity)
        resolved.push({ def: item, category, subcategory, quantity, lineTotal })
      }
    }
  }
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
