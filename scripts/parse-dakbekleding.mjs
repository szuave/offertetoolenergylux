/**
 * Parseert `Opties dakbekleding hellend dak.xlsx` naar een getypt variant-overzicht.
 * Basisprijs voor dakbekleding = €55/m² (in de Excel vermeld in cel A1).
 * Elke variant heeft een "prijstoevoeging" die op de basisprijs komt
 * (negatief = korting, leeg = prijs volgt voor sandwichpanelen).
 *
 *   node scripts/parse-dakbekleding.mjs "<pad naar xlsx>"
 */
import XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xlsxPath =
  process.argv[2] || 'C:/Users/uidlo/Downloads/Opties dakbekleding hellend dak.xlsx'

const BASE_PRICE = 55

const slug = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')

function parseToev(raw) {
  if (typeof raw === 'number') return raw
  const s = String(raw || '').trim().toLowerCase()
  if (s === '') return null
  // "minus 2 euro" / "minus 3 euro"
  const minus = s.match(/^minus\s*(\d+(?:[.,]\d+)?)/)
  if (minus) return -Number(minus[1].replace(',', '.'))
  const n = Number(s.replace(/[^0-9,.-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const wb = XLSX.readFile(xlsxPath)
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })

const usedIds = new Set()
function uniqueId(base) {
  if (!usedIds.has(base)) { usedIds.add(base); return base }
  let n = 2
  while (usedIds.has(`${base}-${n}`)) n++
  usedIds.add(`${base}-${n}`)
  return `${base}-${n}`
}

const variants = []

// Linkerblok (kolom A-E): Dakpannen
//   row 0 = header DAKPANNEN, row 1 = kolomlabels, rij 2+ = items
for (let i = 2; i < rows.length; i++) {
  const r = rows[i]
  const cat = String(r[0] || '').trim()
  if (cat.toLowerCase() !== 'dakpan') continue
  const brand = String(r[1] || '').trim()
  const type = String(r[2] || '').trim()
  const color = String(r[3] || '').trim()
  if (!brand || !type || !color) continue
  const toev = parseToev(r[4])
  // Voor dakpan: lege toev = 0 (basis), want kolom is consistent ingevuld voor varianten.
  const priceAdd = toev === null ? 0 : toev
  const unitPrice = BASE_PRICE + priceAdd
  variants.push({
    id: uniqueId(slug(`${brand}-${type}-${color}`)),
    category: 'dakpannen',
    group: null,
    brand,
    type,
    color,
    priceAdd,
    unitPrice,
  })
}

// Rechterblok (kolom H-L): leien (subgroep "Vezelcementleien" / "Natuurleien")
// en daarna sandwichpanelen (na de SANDWICHPANELEN-kop).
let rightSection = 'leien'
for (let i = 2; i < rows.length; i++) {
  const r = rows[i]
  const colH = String(r[7] || '').trim()
  // Switch naar sandwich-sectie bij de kop
  if (colH.toUpperCase() === 'SANDWICHPANELEN') {
    rightSection = 'sandwich'
    continue
  }
  // Sla sandwich-sub-headerrij over ("Categorie | Merk | DIKTE | Kleur | Prijstoevoeging")
  if (colH.toLowerCase() === 'categorie') continue

  if (rightSection === 'leien') {
    if (!colH) continue
    const brand = String(r[8] || '').trim()
    const type = String(r[9] || '').trim()
    const color = String(r[10] || '').trim()
    if (!brand || !color) continue
    const toev = parseToev(r[11])
    const priceAdd = toev // mag null zijn (prijs volgt)
    variants.push({
      id: uniqueId(slug(`lei-${brand}-${type}-${color}`)),
      category: 'leien',
      group: colH, // Vezelcementleien / Natuurleien
      brand,
      type,
      color,
      priceAdd,
      unitPrice: priceAdd === null ? null : BASE_PRICE + priceAdd,
    })
  } else if (rightSection === 'sandwich') {
    const cat = colH
    const brand = String(r[8] || '').trim()
    const dikte = String(r[9] || '').trim()
    const color = String(r[10] || '').trim()
    // Eén van de cellen moet ingevuld zijn om dit als variant te zien
    if (!brand && !cat && !color) continue
    const toev = parseToev(r[11])
    variants.push({
      id: uniqueId(slug(`sandwich-${cat || brand}-${dikte}-${color}`)),
      category: 'sandwichpanelen',
      group: cat || null,
      brand: brand || cat,
      type: dikte || '—',
      color: color || '—',
      priceAdd: toev,
      unitPrice: toev === null ? null : BASE_PRICE + toev,
    })
  }
}

const out = { basePrice: BASE_PRICE, variants }
const outPath = path.resolve(__dirname, '../src/data/dakbekleding.json')
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
console.log('Geschreven:', outPath)
console.log('Varianten:', variants.length,
  '| dakpannen:', variants.filter(v=>v.category==='dakpannen').length,
  '| leien:', variants.filter(v=>v.category==='leien').length,
  '| sandwich:', variants.filter(v=>v.category==='sandwichpanelen').length)
const pending = variants.filter(v=>v.unitPrice===null).length
console.log('Prijs volgt:', pending)
