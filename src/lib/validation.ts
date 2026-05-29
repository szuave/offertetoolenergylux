/**
 * Marktwaarde-classificatie staat uit tot er echte drempels per categorie zijn.
 * De vroegere `classifyPricePerM2`-functie is verwijderd in plaats van te
 * leunen op verzonnen getallen — zie [[git history]] om hem terug te halen
 * wanneer we per categorie reële min/max-waarden hebben.
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return emailRegex.test(value.trim())
}

export function isValidBelgianPostalCode(value: string): boolean {
  return /^\d{4}$/.test(value.trim())
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}
