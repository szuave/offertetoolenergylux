/**
 * Rendert een LEGE offerte (template) — enkel logo + vaste onderdelen,
 * zonder klantgegevens of werken. Output in voorbeeld-offerte/.
 * Vereist een draaiende dev-server (npm run dev).
 */
import { renderToFile } from '@react-pdf/renderer'
import { createElement } from 'react'
import { OfferDocument } from '../src/components/pdf/OfferDocument.tsx'
import { calculateTotals } from '../src/lib/calculator.ts'

const BASE = 'http://localhost:5173'
const assets = {
  logoFull: `${BASE}/energylux-logo.png`,
  logoBanner: `${BASE}/energylux-logo-banner.png`,
  hero: `${BASE}/pdf/hero.jpg`,
  realisaties: Array.from({ length: 9 }, (_, i) => `${BASE}/pdf/realisatie-${i + 1}.jpg`),
}

const leeg = {
  meta: {
    number: 'EN-JJJJ-MM-DD-NN', issueDate: '', validUntilDate: '',
    salesperson: '', projectReference: '', roofAreaM2: 0,
  },
  customer: { firstName: '', lastName: '', email: '', phone: '', street: '', postalCode: '', city: '', projectAddress: '' },
  quantities: {}, groupSelections: {}, flags: {},
  discount: { enabled: false, percentage: 5, conditionDays: 7 }, vatRate: 0.06, notes: '',
}

await renderToFile(
  createElement(OfferDocument, { quote: leeg, totals: calculateTotals(leeg), assets }),
  'voorbeeld-offerte/Energylux-offerte-template.pdf',
)
console.log('OK — voorbeeld-offerte/Energylux-offerte-template.pdf')
