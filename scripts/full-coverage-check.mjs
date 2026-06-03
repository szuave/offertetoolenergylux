/* eslint-disable no-console */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'
const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

const wb = xlsx.readFile(EXCEL)
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })

const CATS = new Set(['HELLEND DAK', 'GEVELWERKEN', 'PLAT DAK'])

// 1. Lees ALLE rijen die een echte item kunnen zijn (heeft label + niet header + niet leeg)
const excelItems = []
let heading = ''
for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  const label = String(r[0] || '').trim()
  const unit = String(r[1] || '').trim()
  const price = r[2]
  const filterRaw = String(r[3] || '').trim()

  if (!label) continue
  if (label.toLowerCase() === 'eenheid') continue

  // Heading detectie
  if (!unit && (price === '' || price === undefined) && label === label.toUpperCase()) {
    const upper = label.toUpperCase()
    const isCatHeading = [...CATS].some((c) => upper === c || upper.startsWith(c + ' '))
    heading = label
    if (isCatHeading) continue
    if (label.match(/^(WERFINSTALLATIE|ISOLATIEWERKEN|AMBACHTELIJK|DAKDICHTINGSWERKEN|LOOD)/)) continue
    // Geen heading, kan een echt item zijn dat ALL-CAPS heet (bv. ISOLATIEWERKEN onder plat dak)
  }

  // Item rij
  excelItems.push({ row: i + 1, heading, label, unit, price, filterRaw })
}

function norm(s) {
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim()
}

const catalogByLabel = new Map()
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const k = norm(it.label)
      if (!catalogByLabel.has(k)) catalogByLabel.set(k, [])
      catalogByLabel.get(k).push({ cat: cat.id, sub: sub.id, ...it })
    }
  }
}

console.log('═══ FULL COVERAGE — elk Excel-item ↔ catalog ═══\n')
console.log(`Excel-items: ${excelItems.length}`)
let totalCatalog = 0
for (const c of catalog.categories) for (const s of c.subcategories) totalCatalog += s.items.length
console.log(`Catalog-items: ${totalCatalog}\n`)

const missing = []
const consumed = new Map()
for (const e of excelItems) {
  const k = norm(e.label)
  const matches = catalogByLabel.get(k)
  if (!matches || matches.length === 0) {
    missing.push(e)
    continue
  }
  const idx = consumed.get(k) ?? 0
  consumed.set(k, idx + 1)
  if (idx >= matches.length) {
    missing.push({ ...e, note: 'meer voorkomens in Excel dan in catalog' })
  }
}

if (missing.length === 0) {
  console.log('✓ ALLE Excel-items zitten in catalog\n')
} else {
  console.log(`⚠ ${missing.length} Excel-items ONTBREKEN in catalog:\n`)
  for (const m of missing) {
    console.log(`   rij${String(m.row).padStart(3)}  [${m.heading}] ${m.label} | ${m.unit} | ${typeof m.price === 'number' ? '€'+m.price : '"'+m.price+'"'} | ${m.filterRaw}`)
  }
}

// Check: catalog items die NIET in Excel staan
const excelLabels = new Set(excelItems.map((e) => norm(e.label)))
const extras = []
for (const [k, arr] of catalogByLabel) {
  if (!excelLabels.has(k)) {
    for (const x of arr) extras.push(x)
  }
}
if (extras.length === 0) {
  console.log('✓ Catalog bevat geen items die niet in Excel staan\n')
} else {
  console.log(`⚠ ${extras.length} Catalog-items NIET in Excel:`)
  for (const x of extras) console.log(`   [${x.cat}/${x.sub}] ${x.label}`)
}

// Items met €1 placeholder (= null in catalog)
console.log('\n▶ Items met "prijs volgt" placeholder (€null in catalog):')
let placeholders = 0
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      if (it.unitPrice === null) {
        placeholders++
        console.log(`   [${cat.id}/${sub.id}] ${it.label} (${it.unit}) - ${it.priceNote ?? 'Prijs volgt'}`)
      }
    }
  }
}
console.log(`Totaal: ${placeholders} placeholder-items`)
