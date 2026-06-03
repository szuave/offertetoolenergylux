import type { QuoteState } from '@/types/quote'

/**
 * Demo-offerte voor presentatie/testen.
 * Triggert via URL: http://localhost:5173/?seed=demo
 *
 * Scenario: Jan Janssens uit Leuven, asbest dak van 120 m² volledig
 * verwijderen incl. nokbalk en oversteken. Enkel afbraak, geen heropbouw —
 * prijs per m² zal in het rood vallen om te tonen dat de validatie werkt.
 */
export const demoQuote: QuoteState = {
  meta: {
    number: 'EN-2026-05-29-01',
    issueDate: '2026-05-29',
    validUntilDate: '2026-06-28',
    salesperson: 'Tom Peeters',
    projectReference: 'JANSSENS-HD-2026',
    roofAreaM2: 120,
  },
  customer: {
    firstName: 'Jan',
    lastName: 'Janssens',
    email: 'jan.janssens@example.be',
    phone: '0470 12 34 56',
    street: 'Kerkstraat 12',
    postalCode: '3000',
    city: 'Leuven',
    projectAddress: 'Hoge Wei 45, 3001 Heverlee',
  },
  quantities: {
    'stelling-valbeveiliging-voorgevel': 1,
    'stelling-valbeveiliging-achtergevel': 1,
    'stelling-valbeveiliging-zijkant-links': 28,
    'afvoeren-werfpuin-toxisch-afval': 1,
    'verwijderen-asbestleien': 120,
    'verwijderen-oversteken': 18,
    'verwijderen-nokbalk': 12,
    'verwijderen-gording': 8,
  },
  groupSelections: {
    'afvoeren-afval': 'afvoeren-werfpuin-toxisch-afval',
    'verwijderen-dakbekleding': 'verwijderen-asbestleien',
  },
  flags: {
    oversteken: true,
    houtconstructie: true,
    sidings: false,
  },
  categoryScope: { 'hellend-dak': true },
  cover: { variantId: null, areaM2: 0 },
  details: {},
  supplements: {},
  discount: { enabled: true, percentage: 5, conditionDays: 7 },
  vatRate: 0.06,
  notes:
    'Werf bereikbaar via achterzijde, parking op straat. Carport aanwezig — stelling moet eromheen geplaatst worden. Asbestattest aanwezig en in orde.',
}
