/* eslint-disable no-console */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL_PATH = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX.xlsx'
const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

/* ---------- Excel inlezen ---------- */
const wb = xlsx.readFile(EXCEL_PATH)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

const excelItems = []
let heading = ''
for (const r of rows) {
  const label = String(r[0] ?? '').trim()
  const unit = String(r[1] ?? '').trim()
  const price = r[2]
  const filterRaw = String(r[3] ?? '').trim()
  if (!label && !unit) continue
  if (label && !unit && (price === '' || price === undefined) && label === label.toUpperCase()) {
    heading = label
    continue
  }
  if (label || unit) {
    excelItems.push({ heading, label, unit, price, filterRaw })
  }
}

/* ---------- Catalog index ---------- */
const catalogByLabel = new Map()
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const key = norm(it.label)
      if (!catalogByLabel.has(key)) catalogByLabel.set(key, [])
      catalogByLabel.get(key).push({ cat: cat.id, sub: sub.id, ...it })
    }
  }
}

function norm(s) {
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim()
}

/* ---------- Vergelijken ---------- */
const missing = []
const priceMismatch = []
const unitMismatch = []
const totalExcel = excelItems.filter((e) => e.label).length

for (const e of excelItems) {
  if (!e.label) continue
  const matches = catalogByLabel.get(norm(e.label))
  if (!matches || matches.length === 0) {
    missing.push(e)
    continue
  }
  const excelPrice = typeof e.price === 'number' ? e.price : null
  const excelUnit = mapUnit(e.unit)

  // Vergelijk: vind een match met hetzelfde eenheid+prijs of een willekeurige
  const exactMatch = matches.find((m) => m.unitPrice === excelPrice && mapUnit(m.unit) === excelUnit)
  if (exactMatch) continue

  const anyUnit = matches.find((m) => mapUnit(m.unit) === excelUnit)
  if (anyUnit && anyUnit.unitPrice !== excelPrice) {
    priceMismatch.push({ excel: e, catalog: anyUnit })
    continue
  }

  // Unit mismatch
  unitMismatch.push({ excel: e, catalog: matches[0] })
}

function mapUnit(u) {
  if (!u) return ''
  const x = String(u).toLowerCase().trim()
  if (x === 'm²' || x === 'm2') return 'm2'
  if (x === 'lm' || x === 'lopende meter') return 'lm'
  if (x === 'stuk' || x === 'aantal') return 'stuk'
  if (x === 'ja/nee') return 'ja-nee'
  return x
}

console.log(`═══ VERGELIJKING — ${totalExcel} items in Excel vs catalog ═══\n`)

console.log(`▶ ONTBREKEN volledig in catalog (${missing.length}):`)
for (const m of missing) {
  console.log(`   · [${m.heading}] ${m.label} | ${m.unit} | €${m.price} | filter: ${m.filterRaw}`)
}

console.log(`\n▶ PRIJS-MISMATCH (${priceMismatch.length}):`)
for (const { excel, catalog: c } of priceMismatch) {
  console.log(`   · ${excel.label}`)
  console.log(`       Excel:  ${excel.unit} €${excel.price}`)
  console.log(`       Catalog: ${c.unit} €${c.unitPrice} [${c.cat}/${c.sub}]`)
}

console.log(`\n▶ EENHEID-MISMATCH (${unitMismatch.length}):`)
for (const { excel, catalog: c } of unitMismatch) {
  console.log(`   · ${excel.label}`)
  console.log(`       Excel:  ${excel.unit}`)
  console.log(`       Catalog: ${c.unit} [${c.cat}/${c.sub}]`)
}

/* ---------- Filters die in Excel staan maar niet in catalog ---------- */
console.log('\n▶ FILTER-TAGS in Excel:')
const excelFilters = new Map()
for (const e of excelItems) {
  if (!e.filterRaw) continue
  excelFilters.set(e.filterRaw, (excelFilters.get(e.filterRaw) || 0) + 1)
}
const myFilters = new Set(catalog.optionalFlags.map((f) => f.id))
const myGroups = new Set(catalog.multipleChoiceGroups.map((g) => g.id))
for (const [k, n] of [...excelFilters].sort((a, b) => b[1] - a[1])) {
  console.log(`   "${k}" (${n}× gebruikt)`)
}

/* ---------- Sub-opties (RAL etc) ---------- */
console.log('\n▶ ITEMS MET SUB-OPTIE in Excel-kolom 4:')
for (const e of excelItems) {
  const subOpt = String(rows.find((r) => String(r[0] ?? '').trim() === e.label)?.[4] ?? '').trim()
  if (subOpt && subOpt !== 'RAL-Kleurcode') continue
  if (subOpt === 'RAL-Kleurcode') {
    console.log(`   RAL: ${e.label}`)
  }
}
// Alternatief: kolom 3 kan ook subopties bevatten
const colsMet = new Set()
for (const r of rows) {
  for (let i = 3; i < r.length; i++) {
    const v = String(r[i] ?? '').trim()
    if (v.toLowerCase().includes('schildpad')) {
      console.log(`   "Schildpad of diamantdak": ${r[0]}`)
    }
    if (v.toLowerCase() === 'ral-kleurcode') {
      colsMet.add(r[0])
    }
  }
}
console.log('   Items met RAL-Kleurcode tag (via kolom-scan):')
for (const l of colsMet) console.log(`     · ${l}`)
