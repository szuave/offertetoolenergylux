import raw from '@/data/dakbekleding.json'

export type DakbekledingCategory = 'dakpannen' | 'leien' | 'sandwichpanelen'

export type DakbekledingVariant = {
  id: string
  category: DakbekledingCategory
  /** Subgroep zoals "Vezelcementleien" / "Natuurleien" / sandwich-merklijn */
  group: string | null
  brand: string
  /** Type/model bij dakpannen + leien, "dikte" bij sandwichpanelen */
  type: string
  color: string
  /** Toevoeging op de basisprijs; negatief = korting; null = prijs volgt */
  priceAdd: number | null
  /** Berekende eenheidsprijs per m² (basis + toevoeging) — null bij prijs volgt */
  unitPrice: number | null
  /** Pad naar foto (optioneel; placeholders tot Yasid de foto's levert) */
  photo?: string
}

type Catalog = { basePrice: number; variants: DakbekledingVariant[] }

const catalog = raw as Catalog

export const DAKBEKLEDING_BASE_PRICE = catalog.basePrice
export const dakbekledingVariants = catalog.variants

const byId = new Map(catalog.variants.map((v) => [v.id, v]))
export function findVariant(id: string | null | undefined): DakbekledingVariant | undefined {
  if (!id) return undefined
  return byId.get(id)
}

export const CATEGORY_LABEL: Record<DakbekledingCategory, string> = {
  dakpannen: 'Dakpannen',
  leien: 'Leien',
  sandwichpanelen: 'Sandwichpanelen',
}

/** Cascading helpers — geven de unieke waarden op elk niveau van de keuzeketen. */
export function listCategories(): DakbekledingCategory[] {
  return ['dakpannen', 'leien', 'sandwichpanelen']
}

export function listBrands(category: DakbekledingCategory): string[] {
  return [...new Set(catalog.variants.filter((v) => v.category === category).map((v) => v.brand))]
}

export function listTypes(category: DakbekledingCategory, brand: string): string[] {
  return [
    ...new Set(
      catalog.variants
        .filter((v) => v.category === category && v.brand === brand)
        .map((v) => v.type),
    ),
  ]
}

export function listColors(
  category: DakbekledingCategory,
  brand: string,
  type: string,
): string[] {
  return catalog.variants
    .filter((v) => v.category === category && v.brand === brand && v.type === type)
    .map((v) => v.color)
}

export function resolveVariant(
  category: DakbekledingCategory,
  brand: string,
  type: string,
  color: string,
): DakbekledingVariant | undefined {
  return catalog.variants.find(
    (v) =>
      v.category === category && v.brand === brand && v.type === type && v.color === color,
  )
}
