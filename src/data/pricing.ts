import type { LineItemDef, PricingConfig } from '@/types/quote'
import catalog from '@/data/catalog.json'

/**
 * Energylux-artikellijst — automatisch gegenereerd uit
 * `RENOCHECK Artikellijst ENERGYLUX.xlsx` via `scripts/parse-pricing.mjs`.
 *
 * NIET met de hand bewerken: draai het parse-script opnieuw wanneer Yasid een
 * nieuwe Excel (met definitieve prijzen) levert:
 *
 *   node scripts/parse-pricing.mjs "<pad naar xlsx>"
 *
 * Items zonder vaste prijs hebben `unitPrice: null` + een `priceNote`
 * ("Prijs volgt" / "Op regie") en tellen niet mee in het totaal.
 */
export const pricingConfig = catalog as PricingConfig

let itemIndex: Map<
  string,
  { item: LineItemDef; categoryId: string; subcategoryId: string }
> | null = null

export function getItemDef(id: string) {
  if (!itemIndex) {
    itemIndex = new Map()
    for (const category of pricingConfig.categories) {
      for (const sub of category.subcategories) {
        for (const item of sub.items) {
          itemIndex.set(item.id, { item, categoryId: category.id, subcategoryId: sub.id })
        }
      }
    }
  }
  return itemIndex.get(id)
}

export function getAllItems() {
  return pricingConfig.categories.flatMap((c) =>
    c.subcategories.flatMap((s) => s.items.map((item) => ({ item, category: c, subcategory: s }))),
  )
}
