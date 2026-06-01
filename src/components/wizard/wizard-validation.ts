import { isNonEmpty, isValidBelgianPostalCode, isValidEmail } from '@/lib/validation'
import type { QuoteState, WizardStep } from '@/types/quote'

/**
 * Bepaalt of een stap "voltooid genoeg" is om door te gaan naar de volgende.
 * Geen-vergeten validatie staat los hiervan (zie `lib/checklist`); die geldt
 * pas bij het effectief exporteren van de PDF.
 */
export function canAdvanceFrom(step: WizardStep, state: QuoteState): boolean {
  if (step === 'filter') {
    return Object.values(state.categoryScope).some((v) => v === true)
  }
  if (step === 'customer') {
    const c = state.customer
    return (
      isNonEmpty(c.firstName) &&
      isNonEmpty(c.lastName) &&
      isValidEmail(c.email) &&
      isNonEmpty(c.street) &&
      isValidBelgianPostalCode(c.postalCode) &&
      isNonEmpty(c.city) &&
      isNonEmpty(state.meta.salesperson)
    )
  }
  // 'works' is laatste stap — geen "Volgende".
  return true
}

export function blockingReason(step: WizardStep, state: QuoteState): string | null {
  if (canAdvanceFrom(step, state)) return null
  if (step === 'filter') return 'Minstens één categorie aanvinken.'
  if (step === 'customer') return 'Verplichte velden invullen.'
  return null
}
