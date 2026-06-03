/**
 * Subcategory- en item-filter-mappings. Subcategory-flags worden uit de
 * catalog gelezen (parser schrijft ze daar bij elke subcategorie); item-
 * overrides blijven hier hard-coded zolang Yasid ze niet in de Excel
 * aanduidt.
 */
import { pricingConfig } from '@/data/pricing'

const subFlagIndex = new Map<string, string>()
for (const cat of pricingConfig.categories) {
  for (const sub of cat.subcategories) {
    if (sub.subcategoryFlag) subFlagIndex.set(sub.id, sub.subcategoryFlag)
  }
}

/** Specifieke items die los van hun rubriek hun eigen filter hebben. */
export const ITEM_FLAG_OVERRIDE: Readonly<Record<string, string>> = {}

export function subcategoryFlag(subcategoryId: string): string | null {
  return subFlagIndex.get(subcategoryId) ?? null
}

export function itemFlagOverride(itemId: string): string | null {
  return ITEM_FLAG_OVERRIDE[itemId] ?? null
}
