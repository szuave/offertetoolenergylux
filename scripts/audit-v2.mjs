/* eslint-disable no-console */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'
const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

const wb = xlsx.readFile(EXCEL)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

// Lees Excel items
const excelItems = []
let heading = ''
let subHeading = ''
const CATS = new Set(['HELLEND DAK', 'GEVELWERKEN', 'PLAT DAK'])
for (const r of rows) {
  const label = String(r[0] ?? '').trim()
  const unit = String(r[1] ?? '').trim()
  if (!label && !unit) continue
  if (label && !unit && (r[2] === '' || r[2] === undefined) && label === label.toUpperCase()) {
    const upper = label.toUpperCase()
    if ([...CATS].some((c) => upper === c || upper.startsWith(c + ' '))) {
      heading = label
      subHeading = ''
    } else {
      subHeading = label
    }
    continue
  }
  if (!label) continue
  if (label.toLowerCase() === 'eenheid') continue
  excelItems.push({
    heading,
    subHeading,
    label,
    unit,
    price: r[2],
    filterRaw: String(r[3] ?? '').trim(),
  })
}

// Index catalog
const catalogByLabel = new Map()
function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim() }
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const k = norm(it.label)
      if (!catalogByLabel.has(k)) catalogByLabel.set(k, [])
      catalogByLabel.get(k).push({ cat: cat.id, sub: sub.id, ...it })
    }
  }
}

const missing = []
const inCatalogButNotExcel = []
const priceProblems = []
const filterProblems = []

const excelLabelsSet = new Set(excelItems.map((e) => norm(e.label)))
for (const [k, arr] of catalogByLabel) {
  if (!excelLabelsSet.has(k)) {
    for (const c of arr) inCatalogButNotExcel.push(c)
  }
}

const seen = new Map() // key → count consumed
for (const e of excelItems) {
  const k = norm(e.label)
  const matches = catalogByLabel.get(k)
  if (!matches || matches.length === 0) {
    missing.push(e)
    continue
  }
  const i = seen.get(k) ?? 0
  const match = matches[i] ?? matches[matches.length - 1]
  seen.set(k, i + 1)

  const excelPrice = typeof e.price === 'number'
    ? (e.price === 1 ? null : e.price)
    : (typeof e.price === 'string' && /regie/i.test(e.price)) ? null : null
  // Voor "€ 103,00"-string parsen
  const numFromStr = (typeof e.price === 'string')
    ? Number(e.price.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.'))
    : NaN
  const realPrice = typeof e.price === 'number' ? e.price : (Number.isFinite(numFromStr) && numFromStr > 1 ? numFromStr : null)

  if (realPrice !== match.unitPrice && !(realPrice === 1 && match.unitPrice === null) && !(realPrice === null && match.unitPrice === null)) {
    priceProblems.push({ label: e.label, excel: e.price, catalog: match.unitPrice })
  }
}

console.log('═══ FULL AUDIT — Excel(1) ↔ catalog.json ═══\n')
console.log(`Excel items: ${excelItems.length}`)
console.log(`Catalog items: ${[...catalogByLabel.values()].reduce((n, a) => n + a.length, 0)}\n`)

console.log(`▶ ONTBREKEN in catalog (${missing.length}):`)
for (const m of missing) console.log(`   · [${m.heading}] ${m.label}`)
console.log()

console.log(`▶ TEVEEL in catalog (${inCatalogButNotExcel.length}):`)
for (const x of inCatalogButNotExcel) console.log(`   · [${x.cat}/${x.sub}] ${x.label}`)
console.log()

console.log(`▶ PRIJS-DISCREPANCIES (${priceProblems.length}):`)
for (const p of priceProblems) {
  console.log(`   · ${p.label}: Excel ${JSON.stringify(p.excel)} vs Catalog €${p.catalog}`)
}
console.log()

// Filter-verificatie
console.log('▶ FILTERS in catalog per categorie:')
for (const cat of catalog.categories) {
  const flagsHere = new Set()
  for (const sub of cat.subcategories) {
    if (sub.subcategoryFlag) flagsHere.add(sub.subcategoryFlag)
    for (const it of sub.items) {
      if (it.filter.kind === 'optional') flagsHere.add(it.filter.flagId)
    }
  }
  console.log(`   ${cat.id}: ${[...flagsHere].join(', ') || '(geen filters)'}`)
}
console.log()

// Filter-volgorde
console.log('▶ FILTER-VOLGORDE (uit catalog.optionalFlags):')
for (const f of catalog.optionalFlags) {
  console.log(`   ${f.id} (${f.label})`)
}
console.log()

// MultipleChoice groups
console.log('▶ MULTIPLECHOICE GROUPS:')
for (const g of catalog.multipleChoiceGroups) {
  console.log(`   ${g.id}: ${g.itemIds.length} items, required=${g.required}`)
}
console.log()

// Items per categorie
console.log('▶ ITEMS PER CATEGORIE:')
for (const cat of catalog.categories) {
  let total = 0
  for (const sub of cat.subcategories) total += sub.items.length
  console.log(`   ${cat.id}: ${total} items in ${cat.subcategories.length} rubrieken`)
}
