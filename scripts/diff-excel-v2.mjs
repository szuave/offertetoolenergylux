/* eslint-disable no-console */
import xlsx from 'xlsx'

const OLD = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX.xlsx'
const NEW = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'

function readRows(path) {
  const wb = xlsx.readFile(path)
  const out = []
  for (const sn of wb.SheetNames) {
    const sheet = wb.Sheets[sn]
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    out.push({ sheet: sn, rows })
  }
  return out
}

const oldData = readRows(OLD)
const newData = readRows(NEW)

console.log('═══ SHEET-OVERZICHT ═══\n')
console.log('OUDE Excel: ' + oldData.map(d => `"${d.sheet}" (${d.rows.length} rijen)`).join(', '))
console.log('NIEUWE Excel: ' + newData.map(d => `"${d.sheet}" (${d.rows.length} rijen)`).join(', '))

function index(rows) {
  const items = []
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
      items.push({ heading, label, unit, price, filterRaw, raw: r })
    }
  }
  return items
}

const oldItems = index(oldData[0].rows)
const newItems = index(newData[0].rows)

console.log(`\nOude items: ${oldItems.length}`)
console.log(`Nieuwe items: ${newItems.length}\n`)

function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim() }

// Index per genormaliseerd label
const oldByLabel = new Map()
for (const it of oldItems) {
  const k = norm(it.label)
  if (!oldByLabel.has(k)) oldByLabel.set(k, [])
  oldByLabel.get(k).push(it)
}
const newByLabel = new Map()
for (const it of newItems) {
  const k = norm(it.label)
  if (!newByLabel.has(k)) newByLabel.set(k, [])
  newByLabel.get(k).push(it)
}

const addedItems = []
const removedItems = []
const changedPrice = []
const changedFilter = []
const changedUnit = []

for (const [k, arr] of newByLabel) {
  if (!oldByLabel.has(k)) {
    for (const it of arr) addedItems.push(it)
    continue
  }
  const oldArr = oldByLabel.get(k)
  for (let i = 0; i < arr.length; i++) {
    const newIt = arr[i]
    const oldIt = oldArr[i] ?? oldArr[0]
    if (!oldIt) { addedItems.push(newIt); continue }
    if (newIt.price !== oldIt.price && newIt.price !== '' && oldIt.price !== '') {
      changedPrice.push({ label: newIt.label, heading: newIt.heading, old: oldIt.price, new: newIt.price })
    }
    if (newIt.filterRaw !== oldIt.filterRaw) {
      changedFilter.push({ label: newIt.label, heading: newIt.heading, old: oldIt.filterRaw, new: newIt.filterRaw })
    }
    if (newIt.unit !== oldIt.unit && newIt.unit && oldIt.unit) {
      changedUnit.push({ label: newIt.label, heading: newIt.heading, old: oldIt.unit, new: newIt.unit })
    }
  }
}
for (const [k, arr] of oldByLabel) {
  if (!newByLabel.has(k)) {
    for (const it of arr) removedItems.push(it)
  } else {
    const newArr = newByLabel.get(k)
    if (arr.length > newArr.length) {
      for (let i = newArr.length; i < arr.length; i++) removedItems.push(arr[i])
    }
  }
}

console.log(`▶ NIEUWE items in v2 (${addedItems.length}):`)
for (const it of addedItems) {
  console.log(`   + [${it.heading}] ${it.label} | ${it.unit} | €${it.price} | filter: ${it.filterRaw}`)
}

console.log(`\n▶ WEGGEHAALDE items uit v1 (${removedItems.length}):`)
for (const it of removedItems) {
  console.log(`   − [${it.heading}] ${it.label} | ${it.unit} | €${it.price} | filter: ${it.filterRaw}`)
}

console.log(`\n▶ PRIJS-WIJZIGINGEN (${changedPrice.length}):`)
for (const c of changedPrice) {
  console.log(`   · ${c.label} [${c.heading}]: €${c.old} → €${c.new}`)
}

console.log(`\n▶ FILTER-WIJZIGINGEN (${changedFilter.length}):`)
for (const c of changedFilter) {
  console.log(`   · ${c.label} [${c.heading}]`)
  console.log(`       oud: "${c.old}"`)
  console.log(`       nieuw: "${c.new}"`)
}

console.log(`\n▶ EENHEID-WIJZIGINGEN (${changedUnit.length}):`)
for (const c of changedUnit) {
  console.log(`   · ${c.label} [${c.heading}]: ${c.old} → ${c.new}`)
}

// Unieke filter-tags in nieuwe excel
const newFilters = new Map()
for (const it of newItems) {
  if (!it.filterRaw) continue
  newFilters.set(it.filterRaw, (newFilters.get(it.filterRaw) || 0) + 1)
}
console.log(`\n▶ UNIEKE FILTER-TAGS in nieuwe Excel (${newFilters.size}):`)
for (const [k, n] of [...newFilters].sort((a, b) => b[1] - a[1])) {
  console.log(`   "${k}" (${n}×)`)
}
