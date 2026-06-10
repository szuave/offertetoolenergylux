/* eslint-disable no-console */
/**
 * ENORME audit. Alle data-integriteit, broken refs, label-kwaliteit,
 * filter-volgorde, persisted-state-versies, hint-quality, etc.
 */
import fs from 'fs'

const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))
const dakbekleding = JSON.parse(fs.readFileSync('./src/data/dakbekleding.json', 'utf8'))
const out = []
function row(label, ok, note = '') { out.push({ label, ok, note }) }

/* ── 1. Data-integriteit ── */
const allItems = []
const allIds = new Set()
const dupIds = []
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      if (allIds.has(it.id)) dupIds.push(it.id)
      allIds.add(it.id)
      allItems.push({ cat: cat.id, sub: sub.id, ...it })
    }
  }
}
row('Geen duplicate item-IDs', dupIds.length === 0, dupIds.join(','))

/* alle optional flag-refs verwijzen naar bestaande flag */
const flagIds = new Set(catalog.optionalFlags.map((f) => f.id))
const brokenFlags = []
for (const it of allItems) {
  if (it.filter.kind === 'optional' && !flagIds.has(it.filter.flagId)) {
    brokenFlags.push(`${it.id}→${it.filter.flagId}`)
  }
}
row('Alle optional-filter refs bestaan in optionalFlags', brokenFlags.length === 0, brokenFlags.join(','))

/* alle multipleChoice group-refs bestaan */
const groupIds = new Set(catalog.multipleChoiceGroups.map((g) => g.id))
const brokenGroups = []
for (const it of allItems) {
  if (it.filter.kind === 'multipleChoice' && !groupIds.has(it.filter.groupId)) {
    brokenGroups.push(`${it.id}→${it.filter.groupId}`)
  }
}
row('Alle multipleChoice refs bestaan in multipleChoiceGroups', brokenGroups.length === 0, brokenGroups.join(','))

/* alle multipleChoiceGroup itemIds bestaan */
const brokenGroupItems = []
for (const g of catalog.multipleChoiceGroups) {
  for (const id of g.itemIds) {
    if (!allIds.has(id)) brokenGroupItems.push(`${g.id}.itemIds has ${id}`)
  }
}
row('Alle multipleChoiceGroup itemIds bestaan', brokenGroupItems.length === 0, brokenGroupItems.join(','))

/* alle subcategoryFlag refs bestaan */
const brokenSub = []
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    if (sub.subcategoryFlag && !flagIds.has(sub.subcategoryFlag)) {
      brokenSub.push(`${sub.id}→${sub.subcategoryFlag}`)
    }
  }
}
row('Alle subcategoryFlag refs bestaan', brokenSub.length === 0, brokenSub.join(','))

/* unit-validatie */
const validUnits = new Set(['stuk', 'm2', 'lm', 'jaNee'])
const badUnits = allItems.filter((it) => !validUnits.has(it.unit)).map((it) => `${it.id}:${it.unit}`)
row('Alle items hebben een geldige unit', badUnits.length === 0, badUnits.slice(0, 5).join(','))

/* unitPrice typing */
const badPrice = allItems.filter((it) => it.unitPrice !== null && typeof it.unitPrice !== 'number').map((it) => it.id)
row('Alle unitPrice waarden zijn number|null', badPrice.length === 0, badPrice.join(','))

/* minimumPrice typing */
const badMin = allItems.filter((it) => it.minimumPrice !== undefined && typeof it.minimumPrice !== 'number').map((it) => it.id)
row('Alle minimumPrice waarden zijn number', badMin.length === 0, badMin.join(','))

/* ── 2. Excel-volgorde basis-check ── */
/* Eerste rubriek van hellend-dak moet werfinstallatie zijn */
row('hellend-dak eerste rubriek = werfinstallatie-afbraak',
  catalog.categories.find((c) => c.id === 'hellend-dak').subcategories[0].id === 'werfinstallatie-afbraak')

/* Eerste category moet hellend-dak zijn */
row('Eerste category = hellend-dak', catalog.categories[0].id === 'hellend-dak')
row('Tweede category = gevelwerken', catalog.categories[1].id === 'gevelwerken')
row('Derde category = plat-dak', catalog.categories[2].id === 'plat-dak')

/* Stelling-items in de eerste 4 rijen van werfinstallatie/afbraak */
const werfItems = catalog.categories[0].subcategories[0].items
const first4 = werfItems.slice(0, 4).map((it) => it.id)
row('4 stelling-items vooraan werfinstallatie',
  first4.every((id) => id.startsWith('stelling-valbeveiliging-')), first4.join(' / '))

/* Afvoeren werfpuin + toxisch als laatste 2 */
const last2 = werfItems.slice(-2).map((it) => it.id)
row('Afvoeren werfpuin + toxisch als laatste 2 in werfinstallatie',
  last2.includes('afvoeren-werfpuin') && last2.includes('afvoeren-werfpuin-toxisch-afval'))

/* Dakdichtingswerken: onderdak vóór nokpan */
const dakdicht = catalog.categories[0].subcategories.find((s) => s.id === 'dakdichtingswerken').items
const onderIdx = dakdicht.findIndex((it) => it.id === 'onderdak')
const nokIdx = dakdicht.findIndex((it) => it.id === 'nokpan')
row('Dakdichtingswerken: onderdak vóór nokpan', onderIdx >= 0 && nokIdx > onderIdx)

/* Plat dak rubriek-volgorde exact */
const platSubs = catalog.categories[2].subcategories.map((s) => s.id)
row('Plat dak rubrieken in juiste volgorde',
  JSON.stringify(platSubs) === JSON.stringify(['werfinstallatie','isolatiewerken','ambachtelijk-timmerwerk','dakdichtingswerken','lood-en-zinkwerken']))

/* ── 3. Filter-volgorde in catalog.optionalFlags (Excel-volgorde) ── */
/* eerste 6 flags moeten matchen met Excel-volgorde van hellend dak */
const firstFlags = catalog.optionalFlags.slice(0, 7).map((f) => f.id)
const expectedStart = ['sidings','oversteken','houtconstructie','bakgoten','hanggoten','veluxen','bakgoten-en-hanggoten']
row('Filter-volgorde: eerste 7 = Excel-volgorde',
  JSON.stringify(firstFlags) === JSON.stringify(expectedStart), firstFlags.join(','))

/* ── 4. Hint kwaliteit (lengte) ── */
const longHints = allItems.filter((it) => (it.hint?.length ?? 0) > 200)
row('Geen hints langer dan 200 chars', longHints.length === 0, longHints.length + ' items')

/* hints die niet door Daryl gevraagde "weg" categorie zijn — geen overgebleven Yasid-tags */
const oldTags = ['altijd voorstellen', 'Altijd voorstellen', 'altijd  bij keuze dakpan']
const remainingOldHints = allItems.filter((it) => {
  if (!it.hint) return false
  return oldTags.some((t) => it.hint.toLowerCase().includes(t.toLowerCase()))
}).map((it) => `${it.id}: "${it.hint}"`)
row('Geen overgebleven Yasid-tags in hints (Daryl wilde weg)',
  remainingOldHints.length === 0, remainingOldHints.slice(0, 3).join(' | '))

/* ── 5. Catalog-summary ── */
const catCount = catalog.categories.length
const subCount = catalog.categories.reduce((n, c) => n + c.subcategories.length, 0)
const itemCount = allItems.length
const flagCount = catalog.optionalFlags.length
const groupCount = catalog.multipleChoiceGroups.length
row(`Catalog stats: ${catCount} cats, ${subCount} subs, ${itemCount} items, ${flagCount} flags, ${groupCount} groups`, true)

/* ── 6. Dakbekleding (Mail 5) ── */
const variantCount = dakbekleding.variants.length
row(`Dakbekleding: ${variantCount} varianten (Mail 5 toevoegingen incl.)`, variantCount >= 42)

/* ── 7. Items zonder prijs (placeholders) ── */
const noPrice = allItems.filter((it) => it.unitPrice === null)
const placeholder1 = allItems.filter((it) => it.unitPrice === 1)
row(`${noPrice.length} items op "prijs volgt" (null)`, true,
  noPrice.map((it) => it.id).slice(0, 3).join(','))
row(`${placeholder1.length} items op €1 placeholder`, true,
  placeholder1.map((it) => it.id).slice(0, 3).join(','))

/* ── 8. Items met regie ── */
const regie = allItems.filter((it) => it.priceNote === 'Op regie')
row(`${regie.length} items "Op regie"`, true, regie.map((it) => it.id).join(','))

/* ── 9. PriceNote consistentie ── */
const badPriceNote = allItems.filter((it) => it.unitPrice === null && !it.priceNote)
row('Items zonder prijs hebben priceNote', badPriceNote.length === 0, badPriceNote.map((it) => it.id).join(','))

/* ── 10. ConfiguratorPanel logica refs ── */
const cfg = fs.readFileSync('./src/components/configurator/ConfiguratorPanel.tsx', 'utf8')
row('ConfiguratorPanel: ALWAYS_VISIBLE check aanwezig',
  cfg.includes('isItemAlwaysVisible') && cfg.includes('isGroupAlwaysVisible'))
row('ConfiguratorPanel: DakdichtingKeuze gerendered voor plat-dak dakdichting',
  cfg.includes('isDakdichtPlat') && cfg.includes('<DakdichtingKeuze />'))
row('ConfiguratorPanel: ChecklistsPanel inline render',
  cfg.includes('inlineChecklists') && cfg.includes('ChecklistsPanel'))

/* ── 11. Calculator special-line logic ── */
const calc = fs.readFileSync('./src/lib/calculator.ts', 'utf8')
row('Calculator: container-counter (€650 / 90m²)',
  calc.includes('CONTAINER_PRICE = 650') && calc.includes('Math.ceil') && calc.includes('/ 90'))
row('Calculator: toxisch €8/m² + min €800',
  calc.includes('TOXISCH_PER_M2 = 8') && calc.includes('TOXISCH_MINIMUM = 800'))
row('Calculator: koepel +20% van leveranciersprijs',
  calc.includes('leveren-nieuwe-koepel') && calc.includes('* 1.2'))
row('Calculator: applyChecklists genereert eindAmount + appliedSupplements',
  calc.includes('applyChecklists') && calc.includes('eindChecklistAmount'))

/* ── 12. Stelling cross-category ── */
const av = fs.readFileSync('./src/data/always-visible.ts', 'utf8')
row('Always-visible: stelling ook in plat-dak',
  av.includes("'plat-dak': new Set([...STELLING_ITEM_IDS])"))

/* ── 13. Items die filter:always hebben + verwacht (Daryl) ── */
const expectedAlways = [
  'verwijderen-bestaande-roofing',
  'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak',
  'leveren-en-plaatsen-sls-hout-ophoging-dakrand',
  'esthetische-afwerking-dakrand',
  'leveren-en-plaatsen-afvoerbuis',
  'nokpan', 'gevelpan', 'noordbomen',
]
const missingAlways = expectedAlways.filter((id) => {
  const it = allItems.find((x) => x.id === id)
  return !it || it.filter.kind !== 'always'
})
row('Alle verwachte "altijd"-items op filter:always', missingAlways.length === 0, missingAlways.join(','))

/* ── 14. Items die filter:optional + verwacht flag ── */
const expectedFlagged = [
  ['verwijderen-osb-plat-dak', 'plat-dak-houtconstructie'],
  ['leveren-en-plaatsen-epdm-tapgat', 'epdm'],
  ['leveren-en-plaatsen-roofing-tapgat', 'roofing'],
  ['nieuwe-oversteek-timmeren-basis-nieuwe-bekleding', 'oversteken'],
]
const wrongFlags = expectedFlagged.filter(([id, flag]) => {
  const it = allItems.find((x) => x.id === id)
  return !it || it.filter.kind !== 'optional' || it.filter.flagId !== flag
})
row('Verwachte optional filter-refs kloppen', wrongFlags.length === 0, JSON.stringify(wrongFlags))

/* ── 15. Geen lege rubrieken ── */
const emptySubs = []
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    if (sub.items.length === 0) emptySubs.push(`${cat.id}/${sub.id}`)
  }
}
row('Geen lege rubrieken', emptySubs.length === 0, emptySubs.join(','))

/* ── 16. Veluxen muggengaas + andere v2-items ── */
const v2Items = ['veluxen-muggengaas', 'blauwe-steen', 'verwijderen-asbestleien', 'stelling-valbeveiliging-zijkant-rechts', 'nokhoogte-lager-dan-1-70m']
const missingV2 = v2Items.filter((id) => !allIds.has(id))
row('Excel v2 nieuwe items aanwezig', missingV2.length === 0, missingV2.join(','))

/* ── 17. Hint scan: speciale Daryl-zinnen ── */
const ond = allItems.find((it) => it.id === 'onderdak')
row('Onderdak hint = exact A+++ zin', ond?.hint?.startsWith('Hoogkwalitatief Klasse A+++'))
const nok = allItems.find((it) => it.id === 'nokpan')
row('Nokpan hint = "geventileerde ondernok"', nok?.hint === 'geventileerde ondernok')
const ddv = allItems.find((it) => it.id === 'dakdoorvoer')
row('Dakdoorvoer hint bevat "Energylux"', ddv?.hint?.includes('Energylux'))
const vsh = allItems.find((it) => it.id === 'voegwerk-schouw')
row('Voegwerk schouw hint = regie €65/pp', vsh?.hint?.includes('65') && vsh?.hint?.toLowerCase().includes('regie'))

/* ── 18. Checklists data ── */
const cl = fs.readFileSync('./src/data/checklists.ts', 'utf8')
row('Checklists: alle 4 gedefinieerd',
  cl.includes('CHECKLIST_WERF_BELEMMERING') && cl.includes('CHECKLIST_GEVEL_VENTILATIE') &&
  cl.includes('CHECKLIST_ZONNEPANELEN') && cl.includes('CHECKLIST_EIND'))

/* ── 19. Build-check files aanwezig ── */
row('Vite config aanwezig', fs.existsSync('./vite.config.ts'))
row('TypeScript config aanwezig', fs.existsSync('./tsconfig.json'))
row('Tailwind config of index.css', fs.existsSync('./src/index.css'))

/* ── 20. Geen Claude/AI traces (Yasid: geen AI-attributie) ── */
const filesToScan = [
  './src/data/catalog.json',
  './src/data/checklists.ts',
  './src/data/always-visible.ts',
  './src/data/item-details.ts',
  './src/components/configurator/ChecklistsPanel.tsx',
  './src/components/configurator/DakdichtingKeuze.tsx',
  './src/components/wizard/DetailStep.tsx',
]
const aiHits = []
for (const f of filesToScan) {
  const c = fs.readFileSync(f, 'utf8')
  if (/claude|anthropic|chatgpt|openai/i.test(c)) aiHits.push(f)
}
row('Geen AI-attributie in source', aiHits.length === 0, aiHits.join(','))

/* ── 21. Demo state nog werkend? ── */
const fixtures = fs.readFileSync('./src/data/fixtures.ts', 'utf8')
row('Demo state heeft checklistAnswers veld', fixtures.includes('checklistAnswers'))
row('Demo state heeft supplements veld', fixtures.includes('supplements'))

/* ── Rapport ── */
console.log('═══ MEGA-AUDIT — alle ' + out.length + ' checks ═══\n')
let ok = 0, fail = 0
for (const r of out) {
  console.log((r.ok ? '✓ ' : '✗ ') + r.label + (r.note ? '  [' + r.note + ']' : ''))
  if (r.ok) ok++; else fail++
}
console.log('\n═══ ' + ok + ' OK / ' + fail + ' FAIL ═══')
if (fail > 0) process.exitCode = 1
