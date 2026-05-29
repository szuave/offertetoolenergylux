/**
 * Parseert `RENOCHECK Artikellijst ENERGYLUX.xlsx` naar een getypte
 * catalogus-structuur voor src/data/pricing.ts.
 *
 * Gebruik:
 *   node scripts/parse-pricing.mjs "<pad naar xlsx>" [--json]
 *
 * Zonder --json schrijft het script direct src/data/pricing.generated.ts.
 * Met --json print het de tussenstructuur zodat je de mapping kan verifiëren.
 *
 * Wanneer Yasid de prijzen levert: vervang de xlsx en draai opnieuw.
 */
import XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const xlsxPath = process.argv[2] || 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX.xlsx'
const asJson = process.argv.includes('--json')

// Hoofdcategorieën (al-caps koppen die een nieuwe categorie starten)
const CATEGORY_NAMES = new Set(['HELLEND DAK', 'GEVELWERKEN', 'PLAT DAK'])

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')

// Globale dedup van item-IDs: identieke (of afgekapte) slugs krijgen -2, -3, …
const usedItemIds = new Set()
function uniqueItemId(label) {
  const base = slug(label)
  if (!usedItemIds.has(base)) {
    usedItemIds.add(base)
    return base
  }
  let n = 2
  while (usedItemIds.has(`${base}-${n}`)) n++
  const id = `${base}-${n}`
  usedItemIds.add(id)
  return id
}

const normUnit = (raw) => {
  const u = String(raw || '').trim().toLowerCase()
  if (u === 'm2' || u === 'm²') return 'm2'
  if (u === 'lm') return 'lm'
  if (u === 'stuk' || u === 'aantal') return 'stuk'
  if (u === 'ja/nee') return 'jaNee'
  return null
}

// Prijs-kolom kan getal, "Regie", "€", geformatteerde string, of leeg zijn.
function parsePrice(raw) {
  if (typeof raw === 'number') {
    // €1 is in deze lijst een placeholder ("prijs volgt"), geen echte prijs.
    if (raw === 1) return { mode: 'pending' }
    return { mode: 'fixed', value: raw }
  }
  const s = String(raw || '').trim()
  if (s === '') return { mode: 'pending' }
  if (/regie/i.test(s)) return { mode: 'regie' }
  // Geformatteerde euro-string "€ 103,00"
  const m = s.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(m)
  if (Number.isFinite(n) && n > 0) return n === 1 ? { mode: 'pending' } : { mode: 'fixed', value: n }
  return { mode: 'pending' }
}

// Mapt de vrije-tekst filterregel naar een gestructureerd inclusion-type.
function parseFilter(raw) {
  const f = String(raw || '').trim()
  const low = f.toLowerCase()

  if (low.startsWith('multiplechoice')) {
    // bv "Multiplechoice Verwijderen dakbekleding", "Multiplechoice afvoeren afval",
    // "Multiplechoice dakbekleding en dropdownmenu dakpannen", "Multiplechoice loodafwerking ..."
    let name = low.replace('multiplechoice', '').trim()
    const dropdown = /dropdownmenu/.test(name)
    name = name.replace(/en dropdownmenu.*/, '').replace(/ja of nee.*/, '').trim()
    return { kind: 'choice', groupId: slug(name), dropdown, note: f }
  }
  if (low.startsWith('filteroptie') || low.startsWith('filter optie')) {
    const name = low.replace(/filter\s*optie/, '').trim()
    return { kind: 'flag', flagId: slug(name) }
  }
  if (low.includes('hoort bij dakpan') || low.includes('hoor tbij dakpan')) {
    return { kind: 'flag', flagId: 'dakpan-toebehoren' }
  }
  if (low.includes('altijd voorstellen')) {
    return { kind: 'suggest' }
  }
  if (low.includes('ral-kleurcode') || low.includes('ral kleurcode')) {
    return { kind: 'base', color: true }
  }
  // Alles anders = gewoon een notitie, item is een basis-post
  return { kind: 'base', note: f || undefined }
}

const wb = XLSX.readFile(xlsxPath)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

const categories = []
let currentCat = null
let currentSub = null
let lastItemLabel = ''

// Voor rijen met een lege naam maar wél data (de Excel laat soms de naam leeg
// voor een spiegel-variant, bv. "Zijkant rechts" onder "Zijkant links").
function deriveLabel(prev) {
  if (!prev) return null
  if (/\blinks\b/i.test(prev)) return prev.replace(/\blinks\b/i, 'rechts')
  if (/\brechts\b/i.test(prev)) return prev.replace(/\brechts\b/i, 'links')
  return `${prev} (vervolg)`
}

// Een kop is VOLLEDIG in hoofdletters geschreven en heeft geen bruikbare eenheid.
// (Item-labels zijn zinhoofdletters, ook al bevatten ze acroniemen als PIR/EPDM.)
function isHeaderRow(r) {
  const a = String(r[0] || '').trim()
  if (!a) return false
  const letters = a.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letters.length < 3) return false
  const allCaps = letters === letters.toUpperCase()
  const unit = normUnit(r[1])
  return allCaps && unit === null
}

for (const r of rows) {
  let label = String(r[0] || '').trim()
  // sla pure tabelkop "Eenheid | Prijs" over
  if (label.toLowerCase() === 'eenheid') continue

  // Lege naam: enkel behouden als de rij een ÉCHTE eenheid of numerieke prijs
  // heeft (= een data-rij, geen "Eenheid|Prijs"-tabelkop) → afgeleide naam
  // (spiegel-variant, bv. "Zijkant rechts" onder "Zijkant links"). Anders skip.
  if (!label) {
    const hasRealData = normUnit(r[1]) !== null || typeof r[2] === 'number'
    const derived = hasRealData ? deriveLabel(lastItemLabel) : null
    if (!derived) continue
    label = derived
  }

  if (isHeaderRow(r)) {
    const upper = label.toUpperCase().replace(/\s+/g, ' ').trim()
    const isCategory = [...CATEGORY_NAMES].some((c) => upper.startsWith(c))
    if (isCategory) {
      currentCat = { id: slug(label), label: label.replace(/\s+/g, ' ').trim(), subcategories: [] }
      categories.push(currentCat)
      currentSub = null
    } else {
      if (!currentCat) {
        currentCat = { id: 'overig', label: 'Overig', subcategories: [] }
        categories.push(currentCat)
      }
      currentSub = { id: slug(label), label: label.replace(/\s+/g, ' ').trim(), items: [] }
      currentCat.subcategories.push(currentSub)
    }
    continue
  }

  // Gewone item-rij. Items zonder bruikbare eenheid behouden we toch (eenheid nog
  // niet ingevuld in de sheet) — default 'm2', te bevestigen door Yasid.
  if (!currentCat) continue
  if (!currentSub) {
    // Geen expliciete subcategorie-kop in de Excel → noem de groep naar de
    // categorie zelf (bv. "GEVELWERKEN" i.p.v. een generiek "Algemeen"),
    // zodat de tabelkop in de PDF netjes oogt.
    currentSub = { id: currentCat.id, label: currentCat.label, items: [] }
    currentCat.subcategories.push(currentSub)
  }

  const parsedUnit = normUnit(r[1])
  const unit = parsedUnit ?? 'm2'
  const price = parsePrice(r[2])
  const filter = parseFilter(r[3])
  const note = String(r[3] || '').trim()

  currentSub.items.push({
    id: uniqueItemId(label),
    label,
    unit,
    unitConfirmed: parsedUnit !== null,
    price,
    inclusion: filter,
    rawFilter: note || undefined,
  })
  lastItemLabel = label
}

// ---------------------------------------------------------------------------
// Omzetten naar het bestaande PricingConfig-model (always / multipleChoice /
// optional). Zo hergebruiken we de bestaande calculator, checklist en UI.
// ---------------------------------------------------------------------------

// Leesbare labels voor groepen en flags (fallback = title-case van de slug).
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
}

const titleCase = (s) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const priceNoteFor = (price) =>
  price.mode === 'regie' ? 'Op regie' : price.mode === 'pending' ? 'Prijs volgt' : undefined

const groupMap = new Map() // groupId -> { id,label,itemIds[],required }
const flagMap = new Map() // flagId -> { id,label }

const outCategories = categories.map((c) => ({
  id: c.id,
  label: titleCaseLabel(c.label),
  subcategories: c.subcategories.map((s) => ({
    id: s.id,
    label: titleCaseLabel(s.label),
    items: s.items.map((it) => {
      const unitPrice = it.price.mode === 'fixed' ? it.price.value : null
      const noteParts = []
      if (it.inclusion.color) noteParts.push('RAL-kleurcode vermelden')
      if (it.rawFilter && it.inclusion.kind === 'base' && !it.inclusion.color && it.rawFilter.length < 80) {
        noteParts.push(it.rawFilter)
      }
      const base = {
        id: it.id,
        label: it.label,
        unit: it.unit === 'jaNee' ? 'stuk' : it.unit,
        unitPrice,
        ...(noteParts.length ? { hint: noteParts.join(' · ') } : {}),
        ...(priceNoteFor(it.price) ? { priceNote: priceNoteFor(it.price) } : {}),
      }

      let filter
      if (it.inclusion.kind === 'choice') {
        const gid = it.inclusion.groupId
        if (!groupMap.has(gid)) {
          groupMap.set(gid, {
            id: gid,
            label: GROUP_LABELS[gid] || titleCase(gid),
            itemIds: [],
            required: false,
          })
        }
        groupMap.get(gid).itemIds.push(it.id)
        filter = { kind: 'multipleChoice', groupId: gid }
      } else if (it.inclusion.kind === 'flag') {
        const fid = it.inclusion.flagId
        if (!flagMap.has(fid)) {
          flagMap.set(fid, { id: fid, label: FLAG_LABELS[fid] || titleCase(fid) })
        }
        filter = { kind: 'optional', flagId: fid }
      } else {
        // base + suggest → always
        filter = { kind: 'always' }
      }
      return { ...base, filter }
    }),
  })),
}))

function titleCaseLabel(label) {
  // "WERFINSTALLATIE/AFBRAAK" → "Werfinstallatie / Afbraak"
  return label
    .toLowerCase()
    .replace(/\//g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const pricingConfig = {
  categories: outCategories,
  multipleChoiceGroups: [...groupMap.values()],
  optionalFlags: [...flagMap.values()],
}

const summary = {
  categories: outCategories.length,
  subcategories: outCategories.reduce((n, c) => n + c.subcategories.length, 0),
  items: outCategories.reduce((n, c) => n + c.subcategories.reduce((m, s) => m + s.items.length, 0), 0),
  groups: pricingConfig.multipleChoiceGroups.length,
  flags: pricingConfig.optionalFlags.length,
}

if (asJson) {
  console.log(JSON.stringify({ summary, pricingConfig }, null, 2))
} else {
  const outPath = path.resolve(__dirname, '../src/data/catalog.json')
  writeFileSync(outPath, JSON.stringify(pricingConfig, null, 2), 'utf8')
  console.log('Geschreven:', outPath)
  console.log('Samenvatting:', JSON.stringify(summary))
}
