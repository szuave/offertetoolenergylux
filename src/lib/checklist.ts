import { pricingConfig } from '@/data/pricing'
import { countMissingDetails, getDetailFields } from '@/data/item-details'
import { isNonEmpty, isValidBelgianPostalCode, isValidEmail } from '@/lib/validation'
import type { QuoteState, WizardStep } from '@/types/quote'

export type ChecklistSeverity = 'error' | 'warning' | 'info'

export type ChecklistItem = {
  id: string
  severity: ChecklistSeverity
  message: string
  scope: 'customer' | 'meta' | 'configurator' | 'pricing'
  /** Welke wizard-stap moet de verkoper bezoeken om dit op te lossen. */
  step: WizardStep
}

/**
 * "Niets vergeten" — harde checklist over de offerte heen.
 * Errors blokkeren PDF-export, warnings tonen we maar laten we toe.
 *
 * Elke regel weet onder welke wizard-stap hij valt zodat we per stap
 * een teller (rode badge) kunnen tonen.
 */
export function buildChecklist(state: QuoteState): ChecklistItem[] {
  const items: ChecklistItem[] = []

  /* ---------- Stap 1 — Klant + project ---------- */

  if (!isNonEmpty(state.customer.firstName) || !isNonEmpty(state.customer.lastName)) {
    items.push({
      id: 'customer-name',
      severity: 'error',
      message: 'Klantnaam ontbreekt',
      scope: 'customer',
      step: 'customer',
    })
  }
  if (!isValidEmail(state.customer.email)) {
    items.push({
      id: 'customer-email',
      severity: 'error',
      message: 'Ongeldig e-mailadres',
      scope: 'customer',
      step: 'customer',
    })
  }
  if (!isNonEmpty(state.customer.phone)) {
    items.push({
      id: 'customer-phone',
      severity: 'warning',
      message: 'Geen telefoonnummer',
      scope: 'customer',
      step: 'customer',
    })
  }
  if (
    !isNonEmpty(state.customer.street) ||
    !isValidBelgianPostalCode(state.customer.postalCode) ||
    !isNonEmpty(state.customer.city)
  ) {
    items.push({
      id: 'customer-address',
      severity: 'error',
      message: 'Adres onvolledig',
      scope: 'customer',
      step: 'customer',
    })
  }
  if (!isNonEmpty(state.customer.projectAddress)) {
    items.push({
      id: 'project-address',
      severity: 'warning',
      message: 'Geen werfadres',
      scope: 'customer',
      step: 'customer',
    })
  }
  if (!isNonEmpty(state.meta.salesperson)) {
    items.push({
      id: 'meta-salesperson',
      severity: 'error',
      message: 'Geen verkoper ingevuld',
      scope: 'meta',
      step: 'customer',
    })
  }

  /* ---------- Stap 2 — Soort werken ---------- */

  const anyScope = Object.values(state.categoryScope).some((v) => v === true)
  if (!anyScope) {
    items.push({
      id: 'no-scope',
      severity: 'error',
      message: 'Geen categorie aangevinkt',
      scope: 'configurator',
      step: 'filter',
    })
  }

  /* ---------- Stap 3 — Detail ---------- */

  for (const group of pricingConfig.multipleChoiceGroups) {
    if (group.required && !state.groupSelections[group.id]) {
      items.push({
        id: `group-${group.id}`,
        severity: 'error',
        message: `Keuze ontbreekt: ${group.label}`,
        scope: 'configurator',
        step: 'works',
      })
    }
  }

  const hasAnyLine =
    Object.values(state.quantities).some((q) => q > 0) ||
    (state.cover.variantId !== null && state.cover.areaM2 > 0)
  if (!hasAnyLine && anyScope) {
    items.push({
      id: 'no-items',
      severity: 'error',
      message: 'Geen hoeveelheden ingevuld bij Detail & afwerking',
      scope: 'configurator',
      step: 'works',
    })
  }

  // Cover gekozen maar geen oppervlakte → niet bruikbaar in offerte.
  if (state.cover.variantId !== null && state.cover.areaM2 <= 0) {
    items.push({
      id: 'cover-no-area',
      severity: 'error',
      message: 'Dakbekleding gekozen maar geen oppervlakte ingevuld',
      scope: 'configurator',
      step: 'works',
    })
  }

  // Sub-opties (RAL, merk, dimensie, oversteek-combo) onvolledig voor items
  // met qty > 0. Conform Yasid's eis "verkoper kan niets vergeten" tellen
  // we dit als ERROR (blokkeert PDF-export), niet als waarschuwing.
  let incompleteDetails = 0
  for (const cat of pricingConfig.categories) {
    for (const sub of cat.subcategories) {
      for (const item of sub.items) {
        const qty = state.quantities[item.id] ?? 0
        if (qty <= 0) continue
        if (!getDetailFields(item.id)) continue
        const filled = state.details[item.id] ?? {}
        if (countMissingDetails(item.id, filled) > 0) incompleteDetails++
      }
    }
  }
  if (incompleteDetails > 0) {
    items.push({
      id: 'details-incomplete',
      severity: 'error',
      message:
        incompleteDetails === 1
          ? '1 item heeft nog niet alle sub-opties ingevuld (merk, RAL, dimensie, …)'
          : `${incompleteDetails} items hebben nog niet alle sub-opties ingevuld`,
      scope: 'configurator',
      step: 'works',
    })
  }

  // Items zonder prijs (worden niet meegerekend).
  let noPriceCount = 0
  for (const cat of pricingConfig.categories) {
    for (const sub of cat.subcategories) {
      for (const item of sub.items) {
        const qty = state.quantities[item.id] ?? 0
        if (item.unitPrice === null && qty > 0) noPriceCount++
      }
    }
  }
  if (noPriceCount > 0) {
    items.push({
      id: 'noprice',
      severity: 'warning',
      message:
        noPriceCount === 1
          ? '1 artikel zonder prijs (niet meegerekend)'
          : `${noPriceCount} artikelen zonder prijs (niet meegerekend)`,
      scope: 'pricing',
      step: 'works',
    })
  }

  return items
}

export function hasBlockingErrors(items: ChecklistItem[]): boolean {
  return items.some((i) => i.severity === 'error')
}

export function countBySeverity(items: ChecklistItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.severity] += 1
      return acc
    },
    { error: 0, warning: 0, info: 0 } as Record<ChecklistSeverity, number>,
  )
}

export function countByStepSeverity(items: ChecklistItem[]) {
  const counts: Record<WizardStep, { error: number; warning: number }> = {
    customer: { error: 0, warning: 0 },
    filter: { error: 0, warning: 0 },
    works: { error: 0, warning: 0 },
  }
  for (const item of items) {
    if (item.severity === 'error') counts[item.step].error++
    else if (item.severity === 'warning') counts[item.step].warning++
  }
  return counts
}
