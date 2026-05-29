import { pricingConfig } from '@/data/pricing'
import { isNonEmpty, isValidBelgianPostalCode, isValidEmail } from '@/lib/validation'
import type { QuoteState } from '@/types/quote'

export type ChecklistSeverity = 'error' | 'warning' | 'info'

export type ChecklistItem = {
  id: string
  severity: ChecklistSeverity
  message: string
  scope: 'customer' | 'meta' | 'configurator' | 'pricing'
}

/**
 * "Niets vergeten" — harde checklist over de offerte heen.
 * Errors blokkeren PDF-export, warnings tonen we maar laten we toe.
 */
export function buildChecklist(state: QuoteState): ChecklistItem[] {
  const items: ChecklistItem[] = []

  if (!isNonEmpty(state.customer.firstName) || !isNonEmpty(state.customer.lastName)) {
    items.push({
      id: 'customer-name',
      severity: 'error',
      message: 'Klantnaam ontbreekt',
      scope: 'customer',
    })
  }
  if (!isValidEmail(state.customer.email)) {
    items.push({
      id: 'customer-email',
      severity: 'error',
      message: 'Ongeldig e-mailadres',
      scope: 'customer',
    })
  }
  if (!isNonEmpty(state.customer.phone)) {
    items.push({
      id: 'customer-phone',
      severity: 'warning',
      message: 'Geen telefoonnummer',
      scope: 'customer',
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
    })
  }
  if (!isNonEmpty(state.customer.projectAddress)) {
    items.push({
      id: 'project-address',
      severity: 'warning',
      message: 'Geen werfadres',
      scope: 'customer',
    })
  }

  if (!isNonEmpty(state.meta.salesperson)) {
    items.push({
      id: 'meta-salesperson',
      severity: 'error',
      message: 'Geen verkoper ingevuld',
      scope: 'meta',
    })
  }
  if (state.meta.roofAreaM2 <= 0) {
    items.push({
      id: 'meta-roof-area',
      severity: 'warning',
      message: 'Geen dakoppervlakte',
      scope: 'meta',
    })
  }

  for (const group of pricingConfig.multipleChoiceGroups) {
    if (group.required && !state.groupSelections[group.id]) {
      items.push({
        id: `group-${group.id}`,
        severity: 'error',
        message: `Keuze ontbreekt: ${group.label}`,
        scope: 'configurator',
      })
    }
  }

  const hasAnyLine = Object.values(state.quantities).some((q) => q > 0)
  if (!hasAnyLine) {
    items.push({
      id: 'no-items',
      severity: 'error',
      message: 'Nog geen werken gekozen',
      scope: 'configurator',
    })
  }

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
