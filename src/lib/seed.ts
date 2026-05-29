import { demoQuote } from '@/data/fixtures'

const STORAGE_KEY = 'energylux-offerte-v1'
const COUNTER_KEY = 'energylux-offerte-counter'
const SEED_PARAM = 'seed'

/**
 * Detecteert een seed-instructie in de URL en injecteert die in localStorage
 * vóór de app de Zustand-store hydrateert. Daarna wordt de query-parameter
 * uit de URL gepoetst zodat hij niet bij elke refresh opnieuw triggert.
 *
 * Ondersteunde waarden:
 *   ?seed=demo   → vul testofferte (Jan Janssens) in
 *   ?seed=clear  → wis alle opgeslagen state
 *
 * Moet aangeroepen worden vóór `createRoot().render()`.
 */
export function applyUrlSeed(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const seed = params.get(SEED_PARAM)
  if (!seed) return

  try {
    if (seed === 'demo') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state: demoQuote, version: 1 }),
      )
      // Bump teller naar demo-nummer zodat een volgende "Nieuwe offerte"
      // geen collision met EN-2026-05-27-01 veroorzaakt.
      const isoDate = demoQuote.meta.issueDate
      localStorage.setItem(
        COUNTER_KEY,
        JSON.stringify({ date: isoDate, count: 1 }),
      )
    } else if (seed === 'clear') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(COUNTER_KEY)
    }
  } catch (err) {
    console.warn('Seed kon niet toegepast worden:', err)
  } finally {
    params.delete(SEED_PARAM)
    const next = params.toString()
    const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', url)
  }
}
