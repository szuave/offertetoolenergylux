/* eslint-disable no-console */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL_PATH = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX.xlsx'
const COVER_PATH = 'C:/Users/uidlo/Downloads/Opties dakbekleding hellend dak.xlsx'

const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))
const cover = JSON.parse(fs.readFileSync('./src/data/dakbekleding.json', 'utf8'))

console.log('═══ AUDIT — Energylux Offerte-tool ═══\n')

/* ---------- 1. Items per rubriek tellen ---------- */
const wb = xlsx.readFile(EXCEL_PATH)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

let excelItemCount = 0
let excelPriceTotal = 0
let excelPriceItems = 0
let currentHeading = ''
const excelByHeading = {}

for (const r of rows) {
  const label = String(r[0] ?? '').trim()
  const unit = String(r[1] ?? '').trim()
  const price = r[2]
  if (!label) continue
  // Heading detection
  if (label === label.toUpperCase() && !unit && (price === '' || price === undefined)) {
    currentHeading = label
    excelByHeading[currentHeading] = []
    continue
  }
  if (unit) {
    excelItemCount++
    excelByHeading[currentHeading] = excelByHeading[currentHeading] ?? []
    excelByHeading[currentHeading].push({ label, unit, price })
    if (typeof price === 'number') {
      excelPriceTotal += price
      excelPriceItems++
    }
  }
}

let catalogItemCount = 0
let catalogPriceTotal = 0
let catalogPriceItems = 0
const catalogBySub = {}

for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    catalogBySub[sub.label.toUpperCase()] = sub.items
    for (const item of sub.items) {
      catalogItemCount++
      if (typeof item.unitPrice === 'number') {
        catalogPriceTotal += item.unitPrice
        catalogPriceItems++
      }
    }
  }
}

console.log('Items in Excel  :', excelItemCount)
console.log('Items in catalog:', catalogItemCount)
console.log('Verschil        :', catalogItemCount - excelItemCount)
console.log()
console.log('Prijzen in Excel  :', excelPriceItems, '— som €' + excelPriceTotal)
console.log('Prijzen in catalog:', catalogPriceItems, '— som €' + catalogPriceTotal)
console.log('Verschil          : €' + (catalogPriceTotal - excelPriceTotal))
console.log()

/* ---------- 2. Per-heading vergelijking ---------- */
console.log('─── Per rubriek ───')
for (const heading of Object.keys(excelByHeading)) {
  const ex = excelByHeading[heading].length
  // Vind catalog subcategorie met dezelfde naam (case-insensitive, fuzzy)
  const subKey = Object.keys(catalogBySub).find(
    (k) => k === heading || k.replace(/[-_]/g, ' ') === heading.replace(/[-_]/g, ' '),
  )
  const ca = subKey ? catalogBySub[subKey].length : 0
  const marker = ex === ca ? '✓' : '⚠'
  console.log(`  ${marker} ${heading.padEnd(35)} — Excel: ${ex}, Catalog: ${ca}`)
}
console.log()

/* ---------- 3. Filter-tagging audit ---------- */
console.log('─── Filter-tagging audit ───')
const flagIds = new Set(catalog.optionalFlags.map((f) => f.id))
const groupIds = new Set(catalog.multipleChoiceGroups.map((g) => g.id))
let unknownFlag = 0
let unknownGroup = 0
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const item of sub.items) {
      if (item.filter.kind === 'optional' && !flagIds.has(item.filter.flagId)) {
        console.log(`  ⚠ ITEM "${item.id}" wijst naar onbestaand flag "${item.filter.flagId}"`)
        unknownFlag++
      }
      if (item.filter.kind === 'multipleChoice' && !groupIds.has(item.filter.groupId)) {
        console.log(`  ⚠ ITEM "${item.id}" wijst naar onbestaand group "${item.filter.groupId}"`)
        unknownGroup++
      }
    }
  }
}
console.log(`  ${unknownFlag === 0 ? '✓' : '⚠'} ${unknownFlag} items met onbestaande flag-referentie`)
console.log(`  ${unknownGroup === 0 ? '✓' : '⚠'} ${unknownGroup} items met onbestaande group-referentie`)
console.log()

/* ---------- 4. Dakbekleding-varianten ---------- */
const wb2 = xlsx.readFile(COVER_PATH)
let coverExcelCount = 0
for (const name of wb2.SheetNames) {
  const sheet2 = wb2.Sheets[name]
  const rows2 = xlsx.utils.sheet_to_json(sheet2, { header: 1, defval: '' })
  for (const r of rows2) {
    if (String(r[0] ?? '').trim() && r[1] !== undefined && r[1] !== '') coverExcelCount++
  }
}
console.log('Dakbekleding-varianten Excel (ruw, alle rijen): ', coverExcelCount)
console.log('Dakbekleding-varianten in catalog            : ', cover.variants.length)
console.log()

/* ---------- 5. Items zonder prijs in catalog ---------- */
let noPriceItems = 0
const sampleNoPrice = []
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const item of sub.items) {
      if (item.unitPrice === null) {
        noPriceItems++
        if (sampleNoPrice.length < 8) {
          sampleNoPrice.push(`${sub.label} → ${item.label}`)
        }
      }
    }
  }
}
console.log('─── Items zonder prijs (prijs volgt) ───')
console.log(`  ${noPriceItems} items, voorbeeld:`)
for (const s of sampleNoPrice) console.log('    ·', s)
console.log()

/* ---------- 6. Conditionele-logica spot-checks ---------- */
console.log('─── Conditionele logica spot-checks ───')
// Voor enkele bekende flags, tel items cross-rubriek
const checkFlags = ['dakkapel', 'bakgoten', 'velux', 'oversteken', 'sarking', 'standaard-dakwerk']
for (const f of checkFlags) {
  const flagId = catalog.optionalFlags.find((x) => x.id === f || x.id === f + 'en')?.id ?? f
  let cnt = 0
  const rubrieken = new Set()
  for (const cat of catalog.categories) {
    for (const sub of cat.subcategories) {
      for (const item of sub.items) {
        if (item.filter.kind === 'optional' && item.filter.flagId === flagId) {
          cnt++
          rubrieken.add(sub.label)
        }
      }
    }
  }
  console.log(`  Filter "${flagId}": ${cnt} items, verdeeld over ${rubrieken.size} rubrieken`)
}
console.log()

console.log('═══ Einde audit ═══')
