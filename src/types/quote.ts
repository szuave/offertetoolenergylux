export type Unit = 'stuk' | 'm2' | 'lm'

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
}

export type SubcategoryDef = {
  id: string
  label: string
  description?: string
  items: LineItemDef[]
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

export type QuoteState = {
  meta: QuoteMeta
  customer: Customer
  quantities: QuantityMap
  groupSelections: GroupSelections
  flags: FlagMap
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

export type Totals = {
  resolvedItems: ResolvedLineItem[]
  subtotals: SubtotalBreakdown[]
  subtotalExVat: number
  discountAmount: number
  totalExVat: number
  vatAmount: number
  totalIncVat: number
  pricePerM2: number | null
}
