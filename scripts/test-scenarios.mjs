/**
 * Functionele test: 5 personen × 5 dak-scenario's.
 * Draait elk door calculateTotals + buildChecklist en rendert de PDF.
 * Vereist een draaiende dev-server (npm run dev) voor de PDF-afbeeldingen.
 *
 *   npx vite-node scripts/test-scenarios.mjs
 */
import { renderToFile } from '@react-pdf/renderer'
import { createElement } from 'react'
import { OfferDocument } from '../src/components/pdf/OfferDocument.tsx'
import { calculateTotals } from '../src/lib/calculator.ts'
import { buildChecklist, hasBlockingErrors, countBySeverity } from '../src/lib/checklist.ts'
import { readFileSync, rmSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const assets = {
  logoFull: `${BASE}/energylux-logo.png`,
  logoBanner: `${BASE}/energylux-logo-banner.png`,
  hero: `${BASE}/pdf/hero.jpg`,
  realisaties: Array.from({ length: 9 }, (_, i) => `${BASE}/pdf/realisatie-${i + 1}.jpg`),
}

function meta(o = {}) {
  return {
    number: 'EN-2026-06-01-01',
    issueDate: '2026-06-01',
    validUntilDate: '2026-07-01',
    salesperson: 'Tom Peeters',
    projectReference: '',
    roofAreaM2: 100,
    ...o,
  }
}
function cust(o = {}) {
  return {
    firstName: 'Test', lastName: 'Klant', email: 'test@example.be', phone: '0470000000',
    street: 'Teststraat 1', postalCode: '3000', city: 'Leuven', projectAddress: '', ...o,
  }
}
function quote(o) {
  return {
    meta: meta(o.meta), customer: cust(o.customer),
    quantities: o.quantities ?? {}, groupSelections: o.groupSelections ?? {}, flags: o.flags ?? {},
    discount: o.discount ?? { enabled: false, percentage: 5, conditionDays: 7 },
    vatRate: o.vatRate ?? 0.06, notes: o.notes ?? '',
  }
}

const scenarios = [
  {
    naam: '1. Anna Verlinden — hellend dak, asbest → dakpannen + isolatie (6% BTW, korting)',
    q: quote({
      meta: { roofAreaM2: 150, projectReference: 'VERLINDEN-HD' },
      customer: { firstName: 'Anna', lastName: 'Verlinden', email: 'anna.verlinden@example.be', city: 'Aarschot', postalCode: '3200' },
      quantities: {
        'afvoeren-werfpuin-toxisch-afval': 1, 'verwijderen-asbest': 150,
        'dakpan': 150, 'dampscherm': 150, 'pir-12-cm-rd-waarde-5-45': 150,
        'verwijderen-oversteken': 22,
      },
      groupSelections: { 'afvoeren-afval': 'afvoeren-werfpuin-toxisch-afval', 'verwijderen-dakbekleding': 'verwijderen-asbest', 'dakbekleding': 'dakpan' },
      flags: { oversteken: true },
      discount: { enabled: true, percentage: 5, conditionDays: 7 }, vatRate: 0.06,
    }),
  },
  {
    naam: '2. Mohammed El Amrani — plat dak vernieuwen (6% BTW)',
    q: quote({
      meta: { roofAreaM2: 80, projectReference: 'ELAMRANI-PD' },
      customer: { firstName: 'Mohammed', lastName: 'El Amrani', email: 'm.elamrani@example.be', city: 'Vilvoorde', postalCode: '1800' },
      quantities: {
        'verwijderen-bestaande-roofing': 80, 'isolatiewerken': 80, 'leveren-en-plaatsen-toplaag-roofing': 80,
      },
      vatRate: 0.06,
    }),
  },
  {
    naam: '3. Sophie Maes — gevelwerken (21% BTW nieuwbouw)',
    q: quote({
      meta: { roofAreaM2: 0, projectReference: 'MAES-GEVEL' },
      customer: { firstName: 'Sophie', lastName: 'Maes', email: 'sophie.maes@example.be', city: 'Leuven', postalCode: '3000', projectAddress: 'Bondgenotenlaan 5, 3000 Leuven' },
      quantities: { 'verwijderen-sidings-gevel': 60, 'gevelisolatie-eps': 60, 'gevelafwerking-crepi-siliconenharspleister': 60 },
      vatRate: 0.21,
    }),
  },
  {
    naam: '4. Pieter & Lien Janssens — combinatie hellend dak + gevel (6%, korting)',
    q: quote({
      meta: { roofAreaM2: 120, projectReference: 'JANSSENS-COMBI' },
      customer: { firstName: 'Pieter & Lien', lastName: 'Janssens', email: 'pieter.janssens@example.be', city: 'Tienen', postalCode: '3300' },
      quantities: {
        'afvoeren-werfpuin': 1, 'verwijderen-dakpannen': 120, 'dakpan': 120, 'dampscherm': 120,
        'verwijderen-nokbalk': 9, 'gevelisolatie-eps': 45,
      },
      groupSelections: { 'afvoeren-afval': 'afvoeren-werfpuin', 'verwijderen-dakbekleding': 'verwijderen-dakpannen', 'dakbekleding': 'dakpan' },
      flags: { houtconstructie: true },
      discount: { enabled: true, percentage: 7, conditionDays: 7 }, vatRate: 0.06,
    }),
  },
  {
    naam: '5. Onvolledige invoer (validatie-test) — moet fouten geven',
    q: quote({
      customer: { firstName: '', lastName: '', email: 'geen-email', phone: '', street: '', postalCode: '99', city: '' },
      meta: { salesperson: '', roofAreaM2: 0 },
      quantities: {},
    }),
    verwachtFouten: true,
  },
]

let allOk = true
for (const sc of scenarios) {
  const totals = calculateTotals(sc.q)
  const checklist = buildChecklist(sc.q)
  const counts = countBySeverity(checklist)
  const blocked = hasBlockingErrors(checklist)

  let pdfPages = 0, pdfError = null
  try {
    const file = `__test_${scenarios.indexOf(sc) + 1}.pdf`
    await renderToFile(createElement(OfferDocument, { quote: sc.q, totals, assets }), file)
    pdfPages = (readFileSync(file, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
    rmSync(file)
  } catch (e) {
    pdfError = e.message
  }

  const fmt = (n) => '€ ' + n.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  console.log('\n' + sc.naam)
  console.log('  lijnen:', totals.resolvedItems.length, '| subtotaal:', fmt(totals.subtotalExVat),
    '| korting:', fmt(totals.discountAmount), '| BTW:', fmt(totals.vatAmount), '| totaal incl:', fmt(totals.totalIncVat))
  console.log('  prijs/m²:', totals.pricePerM2 === null ? 'n.v.t.' : fmt(totals.pricePerM2))
  console.log('  checklist: ' + counts.error + ' fouten, ' + counts.warning + ' aandachtspunten | blokkeert export:', blocked)
  if (checklist.length) console.log('    → ' + checklist.map((c) => c.severity[0].toUpperCase() + ':' + c.message).join(' | '))
  console.log('  PDF:', pdfError ? 'FOUT: ' + pdfError : pdfPages + ' paginas')

  // Valideer verwachtingen
  const problems = []
  if (pdfError) problems.push('PDF render faalde')
  if (!sc.verwachtFouten && blocked) problems.push('onverwacht geblokkeerd (checklist-fouten bij geldige invoer)')
  if (sc.verwachtFouten && !blocked) problems.push('verwachtte blokkerende fouten maar kreeg er geen')
  if (!sc.verwachtFouten && totals.subtotalExVat <= 0) problems.push('subtotaal is 0 bij geldige invoer')
  // Paginarendement varieert met de hoeveelheid werken (8-10 is normaal).
  if (!pdfError && (pdfPages < 8 || pdfPages > 11)) problems.push('onverwacht paginaaantal: ' + pdfPages)
  if (problems.length) { allOk = false; console.log('  >> PROBLEEM:', problems.join('; ')) }
  else console.log('  OK')
}

console.log('\n=================================')
console.log(allOk ? 'ALLE 5 SCENARIOS GESLAAGD' : 'ER ZIJN PROBLEMEN — zie hierboven')
