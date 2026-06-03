/* eslint-disable no-console */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL_PATH = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX.xlsx'
const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

const wb = xlsx.readFile(EXCEL_PATH)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

/* ---------- Map Excel filter-tag → catalog flag id ---------- */
function mapExcelToCatalog(raw) {
  const x = raw.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!x) return { kind: null }
  if (x.includes('multiplechoice')) {
    if (x.includes('afvoeren afval')) return { kind: 'group', id: 'afvoeren-afval' }
    if (x.includes('verwijderen dakbekleding')) return { kind: 'group', id: 'verwijderen-dakbekleding' }
    if (x.includes('dakbekleding')) return { kind: 'group', id: 'dakbekleding' }
    if (x.includes('loodafwerking')) return { kind: 'group', id: 'loodafwerking' }
    return { kind: 'group', id: '?' }
  }
  if (x.includes('altijd voorstellen')) return { kind: 'flag', id: 'standaard-dakwerk' }
  if (x.includes('hoort bij dakpan') || x.includes('hoor tbij dakpan')) {
    return { kind: 'flag', id: 'dakpan-toebehoren' }
  }
  if (x.includes('filteroptie isolatiewerken binnenkant')) return { kind: 'flag', id: 'isolatie-warme-dakzijde' }
  if (x.includes('filteroptie isolatiewerken')) return { kind: 'subcat', id: 'sarking' }
  // Generieke "filteroptie X" → mapping
  const m = x.match(/filteroptie\s+(.+)$/)
  if (m) {
    const name = m[1].trim()
    const flagMap = {
      'sidings': 'sidings',
      'oversteken': 'oversteken',
      'houtconstructie': 'houtconstructie',
      'bakgoten': 'bakgoten',
      'hanggoten': 'hanggoten',
      'veluxen': 'veluxen',
      'bakgoten en hanggoten': 'bakgoten-en-hanggoten',
      'schouw': 'schouw',
      'dakkapel': 'dakkapel',
      'zonnepanelen': 'zonnepanelen',
      'zonneboiler': 'zonneboiler',
      'gevelwerken': '_category_gevelwerken',
      'plat dak': '_category_plat-dak',
    }
    return { kind: 'flag', id: flagMap[name] ?? '?' + name }
  }
  if (x === 'schildpad of diamantdak' || x === 'ral-kleurcode') return { kind: 'sub-option', id: x }
  return { kind: 'unknown', id: raw }
}

/* ---------- Catalog index ---------- */
function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim() }
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

/* ---------- Walk Excel rows ---------- */
let heading = ''
const matches = []
const mismatches = []
const notes = []
let totalChecked = 0

for (const r of rows) {
  const label = String(r[0] ?? '').trim()
  const unit = String(r[1] ?? '').trim()
  if (label && !unit && (r[2] === '' || r[2] === undefined) && label === label.toUpperCase()) {
    heading = label
    continue
  }
  if (!label) continue
  // verzamel alle filter-info uit kolommen 3+
  const filterCol = []
  for (let i = 3; i < r.length; i++) {
    const v = String(r[i] ?? '').trim()
    if (v) filterCol.push(v)
  }
  const rawFilter = filterCol[0] ?? ''
  const expected = mapExcelToCatalog(rawFilter)

  const found = catalogByLabel.get(norm(label))
  if (!found || found.length === 0) continue
  const item = found[0]
  totalChecked++

  // Wat heeft catalog?
  const got = item.filter.kind === 'optional' ? `flag:${item.filter.flagId}`
    : item.filter.kind === 'multipleChoice' ? `group:${item.filter.groupId}`
    : `basis`

  // Wat verwacht Excel?
  const want = expected.kind === 'flag' ? `flag:${expected.id}`
    : expected.kind === 'group' ? `group:${expected.id}`
    : expected.kind === 'subcat' ? `subcat:${expected.id}`
    : expected.kind === 'sub-option' ? `sub-option:${expected.id}`
    : expected.kind === null ? `(geen filter)`
    : `?${rawFilter}`

  if (expected.kind === null) {
    // Excel zegt geen filter — accepteer alles
    matches.push({ label, want, got })
    continue
  }
  if (expected.id?.startsWith('_category_')) {
    // categorie-level filter → klopt automatisch want item zit in die categorie
    matches.push({ label, want: `categorie ${expected.id.replace('_category_','')}`, got })
    continue
  }
  if (expected.kind === 'sub-option') {
    notes.push({ label, raw: rawFilter, note: 'sub-optie nodig (geen filter)' })
    continue
  }
  if (expected.kind === 'subcat') {
    // Item moet in subcategorie staan die door deze flag wordt gestuurd
    const inRightSub = item.sub === 'isolatiewerken-sarking'
    if (inRightSub) matches.push({ label, want, got: 'sub: ' + item.sub })
    else mismatches.push({ label, want, got: 'sub: ' + item.sub, raw: rawFilter })
    continue
  }
  if (item.filter.kind === 'optional' && expected.kind === 'flag' && item.filter.flagId === expected.id) {
    matches.push({ label, want, got })
  } else if (item.filter.kind === 'multipleChoice' && expected.kind === 'group' && item.filter.groupId === expected.id) {
    matches.push({ label, want, got })
  } else {
    mismatches.push({ label, want, got, raw: rawFilter })
  }
}

console.log(`═══ FILTER-MAPPING audit — ${totalChecked} items met filter-tag in Excel ═══\n`)
console.log(`✓ ${matches.length} items met juiste filter`)
console.log(`⚠ ${mismatches.length} mismatches`)
console.log(`ℹ ${notes.length} sub-opties (geen filter)\n`)

if (mismatches.length) {
  console.log('▶ MISMATCHES:\n')
  for (const m of mismatches) {
    console.log(`   · ${m.label}`)
    console.log(`       Excel wil: ${m.want}  (raw: "${m.raw}")`)
    console.log(`       Catalog: ${m.got}`)
  }
}

if (notes.length) {
  console.log('\n▶ SUB-OPTIES (geen filter, vereisen extra invoer):\n')
  for (const n of notes) {
    console.log(`   · ${n.label} — ${n.raw}`)
  }
}
