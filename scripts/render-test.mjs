/**
 * Render-test voor de offerte-PDF (alleen lokaal, niet in de build).
 * Draait het OfferDocument server-side en schrijft test-offerte.pdf.
 * Afbeeldingen worden van de draaiende dev-server (localhost:5173) gehaald,
 * dus start eerst `npm run dev`.
 *
 *   npx vite-node scripts/render-test.mjs
 */
import { renderToFile } from '@react-pdf/renderer'
import { createElement } from 'react'
import { OfferDocument } from '../src/components/pdf/OfferDocument.tsx'
import { demoQuote } from '../src/data/fixtures.ts'
import { calculateTotals } from '../src/lib/calculator.ts'

const BASE = 'http://localhost:5173'
const assets = {
  logoFull: `${BASE}/energylux-logo.png`,
  logoBanner: `${BASE}/energylux-logo-banner.png`,
  hero: `${BASE}/pdf/hero.jpg`,
  realisaties: Array.from({ length: 9 }, (_, i) => `${BASE}/pdf/realisatie-${i + 1}.jpg`),
}

const totals = calculateTotals(demoQuote)
await renderToFile(
  createElement(OfferDocument, { quote: demoQuote, totals, assets }),
  'test-offerte.pdf',
)
console.log('OK — test-offerte.pdf geschreven')
