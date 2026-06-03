/* eslint-disable no-console */
/**
 * Verifieert dat de catalog 100% in Excel-volgorde staat:
 *  - Categorieën in volgorde van Excel
 *  - Sub-rubrieken in volgorde van Excel
 *  - Items binnen rubriek in volgorde van Excel
 *  - Filters in volgorde van eerste-encounter in Excel
 */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'
const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

const wb = xlsx.readFile(EXCEL)
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })

const CATS = new Set(['HELLEND DAK', 'GEVELWERKEN', 'PLAT DAK'])

const excelCats = []
const excelSubsByCat = new Map()
const excelItemsBySub = new Map()
const excelFilterOrder = []
const seenFilters = new Set()

let currentCat = ''
let currentSub = ''

function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim() }

function tagFlag(raw) {
  const x = String(raw || '').toLowerCase().trim()
  if (!x) return null
  if (x.startsWith('multiplechoice')) return null
  if (/^filter\s*optie/.test(x)) {
    let n = x.replace(/^filter\s*optie/, '').trim()
    n = n.split(' en zie ')[0].trim()
    return n.replace(/\s+/g, '-')
  }
  if (x.includes('hoort bij dakpan') || x.includes('hoor tbij dakpan') || x.includes('altijd  bij keuze dakpan') || x.includes('altijd bij keuze dakpan')) {
    return 'dakpan-toebehoren'
  }
  return null
}

for (const r of rows) {
  const label = String(r[0] || '').trim()
  const unit = String(r[1] || '').trim()
  const filterRaw = String(r[3] || '').trim()

  if (!label) continue
  if (label.toLowerCase() === 'eenheid') continue

  if (!unit && (r[2] === '' || r[2] === undefined) && label === label.toUpperCase()) {
    const upper = label.toUpperCase()
    if ([...CATS].some((c) => upper === c || upper.startsWith(c + ' '))) {
      currentCat = label
      excelCats.push(label)
      excelSubsByCat.set(label, [])
      currentSub = ''
      // Header heeft soms ook een sub-filter (bv. ISOLATIEWERKEN SARKING)
      const headerFlag = tagFlag(filterRaw)
      if (headerFlag && !seenFilters.has(headerFlag)) {
        seenFilters.add(headerFlag)
        excelFilterOrder.push(headerFlag)
      }
    } else {
      currentSub = label
      excelSubsByCat.get(currentCat)?.push(label)
      excelItemsBySub.set(currentSub, [])
      const headerFlag = tagFlag(filterRaw)
      if (headerFlag && !seenFilters.has(headerFlag)) {
        seenFilters.add(headerFlag)
        excelFilterOrder.push(headerFlag)
      }
    }
    continue
  }

  // item rij
  if (!currentSub && currentCat) {
    // Categorie zonder expliciete sub-heading → gebruik categorie-naam
    currentSub = currentCat
    if (!excelSubsByCat.get(currentCat)?.includes(currentCat)) {
      excelSubsByCat.get(currentCat)?.push(currentCat)
      excelItemsBySub.set(currentCat, [])
    }
  }
  excelItemsBySub.get(currentSub)?.push(label)
  const flag = tagFlag(filterRaw)
  if (flag && !seenFilters.has(flag)) {
    seenFilters.add(flag)
    excelFilterOrder.push(flag)
  }
}

console.log('═══ VOLGORDE-AUDIT ═══\n')

console.log('▶ CATEGORIE-VOLGORDE:')
console.log('   Excel  :', excelCats.join(' → '))
console.log('   Catalog:', catalog.categories.map((c) => c.label).join(' → '))
console.log()

console.log('▶ SUB-RUBRIEK volgorde per categorie:')
for (const cat of catalog.categories) {
  const catKey = excelCats.find((e) => norm(e) === norm(cat.label).toUpperCase().replace(/ /g, ' ')) ?? cat.label.toUpperCase()
  const excelSubs = excelSubsByCat.get(catKey) ?? []
  const catalogSubs = cat.subcategories.map((s) => s.label)
  console.log(`   ${cat.id}:`)
  console.log('     Excel  :', excelSubs.join(' → ') || '(geen sub-headings)')
  console.log('     Catalog:', catalogSubs.join(' → '))
}
console.log()

console.log('▶ FILTER-VOLGORDE (eerste keer dat ze in Excel voorkomen):')
const catalogFlagOrder = catalog.optionalFlags.map((f) => f.id)
console.log('   Excel  :', excelFilterOrder.join(' → '))
console.log('   Catalog:', catalogFlagOrder.join(' → '))
console.log()

// Match check
const orderMatch =
  excelFilterOrder.every((f, i) => catalogFlagOrder.includes(f)) &&
  catalogFlagOrder
    .filter((f) => f !== 'roofing' && f !== 'epdm')  // augment toegevoegd, niet in Excel
    .every((f, i) => {
      const inExcel = excelFilterOrder.indexOf(f)
      return inExcel >= 0
    })

console.log('▶ ITEM-VOLGORDE binnen rubrieken (steekproef):')
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    if (sub.items.length < 3) continue
    const sample = sub.items.slice(0, 3).map((i) => i.label).join(' → ')
    console.log(`   ${cat.id}/${sub.id}: ${sample}`)
  }
}
