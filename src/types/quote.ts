export type Unit = 'stuk' | 'm2' | 'lm' | 'jaNee'

export type FilterRule =
  | { kind: 'always' }
  | { kind: 'multipleChoice'; groupId: string }
  | { kind: 'optional'; flagId: string }

export type LineItemDef = {
  id: string
  label: string
  hint?: string
  unit: Unit
  unitPrice: number | null
  /** Tekst bij items zonder vaste prijs: "Prijs volgt" of "Op regie". */
  priceNote?: string
  filter: FilterRule
  /**
   * Minimum-prijs voor dit item. Als qty × unitPrice lager uitkomt dan dit
   * bedrag, wordt dit minimum als lijntotaal gebruikt. Bv. "Verwijderen
   * kiezelsteen" minimum €1500.
   */
  minimumPrice?: number
}

export type SubcategoryDef = {
  id: string
  label: string
  description?: string
  items: LineItemDef[]
  /** Filter-flag die de hele rubriek aan/uit zet (uit Excel header-rij). */
  subcategoryFlag?: string
}

export type CategoryDef = {
  id: string
  label: string
  subcategories: SubcategoryDef[]
}

export type MultipleChoiceGroupDef = {
  id: string
  label: string
  description?: string
  itemIds: string[]
  required: boolean
}

export type OptionalFlagDef = {
  id: string
  label: string
  description?: string
}

export type PricingConfig = {
  categories: CategoryDef[]
  multipleChoiceGroups: MultipleChoiceGroupDef[]
  optionalFlags: OptionalFlagDef[]
}

export type Customer = {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  postalCode: string
  city: string
  projectAddress: string
}

export type QuoteMeta = {
  number: string
  issueDate: string
  validUntilDate: string
  salesperson: string
  projectReference: string
  roofAreaM2: number
}

export type DiscountConfig = {
  enabled: boolean
  percentage: number
  conditionDays: number
}

export type QuantityMap = Record<string, number>
export type GroupSelections = Record<string, string | null>
export type FlagMap = Record<string, boolean>

/** Gekozen nieuwe dakbekleding (uit het cascading dropdown-systeem). */
export type CoverChoice = {
  variantId: string | null
  areaM2: number
}

/**
 * Vrije sub-opties per lijnitem (RAL-kleur, merk, dimensies, …) die op de PDF
 * onder de lijn verschijnen. Bv. voor "Esthetische afwerking dakrand": merk
 * Rockpanel, dimensie 30 cm. Beïnvloeden de prijs niet — informatief.
 */
export type ItemDetails = Record<string, string>
export type DetailsMap = Record<string, ItemDetails>

/** Welke top-level categorieën van toepassing zijn voor deze offerte. */
export type ScopeMap = Record<string, boolean>

export type WizardStep = 'filter' | 'customer' | 'works'

/**
 * Werf-supplementen (checklist-vragen uit Yasid's mail v2):
 *  - Plat dak werf moeilijk bereikbaar/hoogte/container etc → +7% met min €3000
 *  - Gevel veel hoekjes/electriciteit/sanitair → +€20/m² gevel-werken
 */
export type SupplementMap = Record<string, boolean>

export type QuoteState = {
  meta: QuoteMeta
  customer: Customer
  quantities: QuantityMap
  groupSelections: GroupSelections
  flags: FlagMap
  /** Welke categorieën van toepassing zijn (uit de filteropties-intake). */
  categoryScope: ScopeMap
  cover: CoverChoice
  /** Vrije sub-opties per item (merk, RAL, dimensie). */
  details: DetailsMap
  /** Werf-supplementen die de subtotaal modifiëren (Yasid mail v2). */
  supplements: SupplementMap
  discount: DiscountConfig
  vatRate: number
  notes: string
}

export type ResolvedLineItem = {
  def: LineItemDef
  category: CategoryDef
  subcategory: SubcategoryDef
  quantity: number
  lineTotal: number
}

export type SubtotalBreakdown = {
  categoryId: string
  categoryLabel: string
  subcategoryId: string
  subcategoryLabel: string
  amount: number
  items: ResolvedLineItem[]
}

export type AppliedSupplement = {
  id: string
  label: string
  amount: number
}

export type Totals = {
  resolvedItems: ResolvedLineItem[]
  subtotals: SubtotalBreakdown[]
  subtotalExVat: number
  /** Toegepaste werf-supplementen, in volgorde. */
  appliedSupplements: AppliedSupplement[]
  /** Som van alle supplementen. */
  supplementsTotal: number
  discountAmount: number
  totalExVat: number
  vatAmount: number
  totalIncVat: number
  pricePerM2: number | null
}
