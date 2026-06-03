/**
 * Parseert de nieuwe RENOCHECK Excel (v(1)) naar catalog.json met:
 *  - Excel-volgorde behouden voor items, rubrieken én filters
 *  - Filter "Altijd voorstellen" → basis (`always`), geen filter
 *  - "Multiplechoice" tags → groups
 *  - "Filteroptie X" tags → optional flags
 *  - "altijd bij keuze dakpan" / "hoort bij dakpan" → flag dakpan-toebehoren
 *  - ja/nee eenheid blijft `jaNee` (UI rendert als checkbox)
 *  - RAL-kleurcode tags → hint "RAL-kleurcode invullen"
 *  - "Checklist X = €Y" notities → hint (verkoper ziet de uitleg)
 *
 * Run:
 *   node scripts/parse-pricing-v2.mjs
 */
import XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xlsxPath =
  process.argv[2] ||
  'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'

const CATEGORY_NAMES = new Set(['HELLEND DAK', 'GEVELWERKEN', 'PLAT DAK'])

const slug = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')

const usedIds = new Set()
function uniqueId(label) {
  const base = slug(label) || 'item'
  if (!usedIds.has(base)) {
    usedIds.add(base)
    return base
  }
  let n = 2
  while (usedIds.has(`${base}-${n}`)) n++
  const id = `${base}-${n}`
  usedIds.add(id)
  return id
}

function normUnit(raw) {
  const u = String(raw || '').trim().toLowerCase()
  if (u === 'm2' || u === 'm²') return 'm2'
  if (u === 'lm') return 'lm'
  if (u === 'stuk' || u === 'aantal') return 'stuk'
  if (u === 'ja/nee') return 'jaNee'
  return null
}

/**
 * Yasid gebruikt €1 of een lege cel als placeholder voor prijzen die nog
 * komen. User-keuze: behoud die als ECHTE €1 in plaats van "Prijs volgt",
 * zodat ze meerekenen in de offerte tot Yasid de echte prijzen levert.
 */
function parsePrice(raw) {
  if (typeof raw === 'number') {
    return { mode: 'fixed', value: raw }
  }
  const s = String(raw || '').trim()
  if (s === '') return { mode: 'fixed', value: 1 }
  if (/regie/i.test(s)) return { mode: 'regie' }
  const m = s.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(m)
  if (Number.isFinite(n) && n > 0) {
    return { mode: 'fixed', value: n }
  }
  return { mode: 'fixed', value: 1 }
}

/**
 * Mapt filter-cel naar gestructureerde inclusion.
 * Yasid gebruikt:
 *  - "Multiplechoice X[: en checklist…]"
 *  - "Filteroptie X" (case-insensitive, "filter optie" of "filteroptie ")
 *  - "altijd bij keuze dakpan" / "hoort bij dakpan" → dakpan-toebehoren
 *  - "altijd voorstellen [...]"  → basis (always)
 *  - "Altijd en tektsveld voorzien voor …" → basis (stelling)
 *  - "Checklist aanvinken" → basis met hint
 *  - "RAL-kleurcode" / "Ral - kleurcode moet ingevuld worden" → RAL sub-optie
 *  - "Keuze 6cm, 16cm  22cm" → keuze sub-optie
 *  - "ISOLATIE PLAT DAK zie sarking hellend dak" → notitie (basis)
 *  - "Offerte opvragen…" → notitie (basis)
 *  - "met een minimum van 1500 euro" → hint
 *  - alles anders met "Checklist X = €Y" → hint
 */
function parseFilter(raw) {
  const f = String(raw || '').trim()
  if (!f) return { kind: 'base' }
  const low = f.toLowerCase()

  if (low.startsWith('multiplechoice')) {
    let name = low.replace('multiplechoice', '').trim()
    name = name.split(':')[0].split(' en checklist')[0].split(' en dropdownmenu')[0].split(' ja of nee')[0].trim()
    return { kind: 'choice', groupId: slug(name), hint: f }
  }

  if (/^filter\s*optie/.test(low)) {
    let name = low.replace(/^filter\s*optie/, '').trim()
    name = name.split(' en zie ')[0].trim()
    return { kind: 'flag', flagId: slug(name), hint: f }
  }

  if (low.includes('hoort bij dakpan') || low.includes('hoor tbij dakpan') || low.includes('altijd  bij keuze dakpan') || low.includes('altijd bij keuze dakpan')) {
    return { kind: 'flag', flagId: 'dakpan-toebehoren' }
  }

  if (low.includes('altijd voorstellen') || low.includes('altijd en tektsveld') || low.includes('altijd en tekstveld')) {
    return { kind: 'base', hint: f }
  }

  if (low.includes('ral') && low.includes('kleur')) {
    return { kind: 'base', ral: true }
  }

  if (low.startsWith('keuze ')) {
    return { kind: 'base', choiceHint: f }
  }

  if (low.startsWith('checklist')) {
    return { kind: 'base', hint: f }
  }

  return { kind: 'base', hint: f }
}

const wb = XLSX.readFile(xlsxPath)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

const categories = []
let currentCat = null
let currentSub = null
let lastItemLabel = ''

function isHeaderRow(r) {
  const a = String(r[0] || '').trim()
  if (!a) return false
  const letters = a.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letters.length < 3) return false
  const allCaps = letters === letters.toUpperCase()
  const unit = normUnit(r[1])
  return allCaps && unit === null
}

function deriveLabel(prev) {
  if (!prev) return null
  if (/\blinks\b/i.test(prev)) return prev.replace(/\blinks\b/i, 'rechts')
  if (/\brechts\b/i.test(prev)) return prev.replace(/\brechts\b/i, 'links')
  return null
}

const flagSeenOrder = []
const groupSeenOrder = []
const flagMap = new Map()
const groupMap = new Map()

function registerFlag(id) {
  if (!flagMap.has(id)) {
    flagMap.set(id, { id, label: FLAG_LABELS[id] || titleCase(id) })
    flagSeenOrder.push(id)
  }
}
function registerGroup(id) {
  if (!groupMap.has(id)) {
    groupMap.set(id, {
      id,
      label: GROUP_LABELS[id] || titleCase(id),
      itemIds: [],
      required: false,
    })
    groupSeenOrder.push(id)
  }
}

const GROUP_LABELS = {
  'afvoeren-afval': 'Afvoeren werfpuin',
  'verwijderen-dakbekleding': 'Verwijderen dakbekleding',
  dakbekleding: 'Nieuwe dakbekleding',
  loodafwerking: 'Loodafwerking',
}
const FLAG_LABELS = {
  sidings: 'Sidings',
  oversteken: 'Oversteken',
  houtconstructie: 'Houtconstructie',
  bakgoten: 'Bakgoten',
  hanggoten: 'Hanggoten',
  veluxen: 'Velux / dakramen',
  'bakgoten-en-hanggoten': 'Bakgoten + hanggoten',
  schouw: 'Schouw',
  dakkapel: 'Dakkapel',
  zonnepanelen: 'Zonnepanelen',
  zonneboiler: 'Zonneboiler',
  'dakpan-toebehoren': 'Dakpan-toebehoren',
  isolatiewerken: 'Isolatiewerken (sarking)',
  'isolatiewerken-binnenkant': 'Isolatie binnenkant',
}

const titleCase = (s) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function titleCaseLabel(label) {
  return label
    .toLowerCase()
    .replace(/\//g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const priceNoteFor = (price) =>
  price.mode === 'regie' ? 'Op regie' : price.mode === 'pending' ? 'Prijs volgt' : undefined

for (const r of rows) {
  let label = String(r[0] || '').trim()
  if (label.toLowerCase() === 'eenheid') continue

  if (!label) {
    const hasRealData = normUnit(r[1]) !== null || typeof r[2] === 'number'
    const derived = hasRealData ? deriveLabel(lastItemLabel) : null
    if (!derived) continue
    label = derived
  }

  if (isHeaderRow(r)) {
    const upper = label.toUpperCase().replace(/\s+/g, ' ').trim()
    const isCategory = [...CATEGORY_NAMES].some((c) => upper === c || upper.startsWith(c + ' '))
    if (isCategory) {
      currentCat = { id: slug(label), label: titleCaseLabel(label), subcategories: [] }
      categories.push(currentCat)
      currentSub = null
    } else {
      if (!currentCat) {
        currentCat = { id: 'overig', label: 'Overig', subcategories: [] }
        categories.push(currentCat)
      }
      // Detecteer of de heading-rij ZELF een filter-tag heeft
      // (bv. "ISOLATIEWERKEN SARKING" → Filteroptie isolatiewerken).
      // In dat geval krijgen alle items binnen deze rubriek die filter
      // toegewezen, en wordt de filter ook op subcategory-niveau bewaard
      // zodat de UI hem als rubriek-filter kan tonen.
      const headerInclusion = parseFilter(r[3])
      const subFlag = headerInclusion.kind === 'flag' ? headerInclusion.flagId : null
      currentSub = {
        id: slug(label),
        label: titleCaseLabel(label),
        items: [],
        ...(subFlag ? { subcategoryFlag: subFlag } : {}),
      }
      if (subFlag) registerFlag(subFlag)
      currentCat.subcategories.push(currentSub)
    }
    continue
  }

  if (!currentCat) continue
  if (!currentSub) {
    currentSub = { id: currentCat.id, label: currentCat.label, items: [] }
    currentCat.subcategories.push(currentSub)
  }

  const parsedUnit = normUnit(r[1])
  const unit = parsedUnit ?? 'm2'
  const price = parsePrice(r[2])
  const inclusion = parseFilter(r[3])
  const unitPrice = price.mode === 'fixed' ? price.value : null

  // hint samenstellen
  const hintParts = []
  if (inclusion.ral) hintParts.push('RAL-kleurcode invullen')
  if (inclusion.choiceHint) hintParts.push(inclusion.choiceHint)
  if (inclusion.hint && !/^multiplechoice|^filter\s*optie|^altijd\s*voorstellen$/i.test(inclusion.hint)) {
    // Lange checklist-notitie van Yasid (over container-prijs, minimum, etc.)
    hintParts.push(inclusion.hint)
  }
  const hint = hintParts.length ? hintParts.join(' · ') : undefined

  let filter
  if (inclusion.kind === 'choice') {
    registerGroup(inclusion.groupId)
    groupMap.get(inclusion.groupId).itemIds.push('PLACEHOLDER')
    filter = { kind: 'multipleChoice', groupId: inclusion.groupId }
  } else if (inclusion.kind === 'flag') {
    registerFlag(inclusion.flagId)
    filter = { kind: 'optional', flagId: inclusion.flagId }
  } else {
    filter = { kind: 'always' }
  }

  const id = uniqueId(label)
  const item = {
    id,
    label,
    unit,
    unitPrice,
    filter,
  }
  if (hint) item.hint = hint
  const pn = priceNoteFor(price)
  if (pn) item.priceNote = pn

  // Update groupMap.itemIds met echte id
  if (filter.kind === 'multipleChoice') {
    const arr = groupMap.get(filter.groupId).itemIds
    arr[arr.length - 1] = id
  }

  currentSub.items.push(item)
  lastItemLabel = label
}

const pricingConfig = {
  categories,
  multipleChoiceGroups: groupSeenOrder.map((id) => groupMap.get(id)),
  optionalFlags: flagSeenOrder.map((id) => flagMap.get(id)),
}

const summary = {
  categories: categories.length,
  subcategories: categories.reduce((n, c) => n + c.subcategories.length, 0),
  items: categories.reduce((n, c) => n + c.subcategories.reduce((m, s) => m + s.items.length, 0), 0),
  groups: pricingConfig.multipleChoiceGroups.length,
  flags: pricingConfig.optionalFlags.length,
}

const outPath = path.resolve(__dirname, '../src/data/catalog.json')
writeFileSync(outPath, JSON.stringify(pricingConfig, null, 2) + '\n', 'utf8')
console.log('Geschreven:', outPath)
console.log('Samenvatting:', JSON.stringify(summary))
console.log('Flag-volgorde:', flagSeenOrder.join(', '))
console.log('Group-volgorde:', groupSeenOrder.join(', '))
