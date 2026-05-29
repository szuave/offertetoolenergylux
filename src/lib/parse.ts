/**
 * Parse een numerieke string die in een Belgische locale ingevuld kan zijn:
 *   "3,5"  → 3.5
 *   "3.5"  → 3.5
 *   "1.250,75" → 1250.75   (punt-duizend, komma-decimaal)
 *   "1,250.75" → 1250.75   (gokken op US-formaat)
 *   ""     → null
 *   "abc"  → null
 */
export function parseLocaleNumber(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  // Verwijder spaties (duizendtal kan met spatie geschreven worden)
  let s = trimmed.replace(/\s/g, '')

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    // Beide aanwezig → laatst voorkomende = decimaal-scheider
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      // Komma is decimaal, punten zijn duizendtallen
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // Punt is decimaal, komma's zijn duizendtallen
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    // Alleen komma → in BE: decimaal-scheider
    s = s.replace(',', '.')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
