/* eslint-disable no-console */
/**
 * Parseert Yasid's "Velux artikelen-2.xlsx" naar gestructureerde data.
 *
 * Excel-structuur: per Velux-MAAT (CK01, CK02, CK04, ...) een sectie met
 * verschillende kolomgroepen:
 *   Kol A — maatcode (CK01)
 *   Kol B-D — Velux basistype (Velux/Integra + product-code + prijs)
 *   Kol E-F — Gootstuk (code + prijs)
 *   Kol G-I — Manueel verduisteringsscherm (DKL...) + kleur + prijs
 *   Kol J-L — Zonne-energie verduisteringsgordijn (DSL...) + kleur + prijs
 *   Kol M-O — Buitenste zonnescherm Integra zonne-energie (MSL...) + kleur + prijs
 *   Kol P-R — Rolluik zonne-energie (SSL...) + kleur + prijs
 *
 * Een maat-sectie loopt over meerdere rijen (zoveel als nodig voor alle
 * varianten). De maatcode staat alleen op de eerste rij.
 */
import xlsx from 'xlsx'
import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wb = xlsx.readFile('C:/Users/uidlo/Downloads/Velux artikelen-2.xlsx')
const sheet = wb.Sheets['veluxaanbod']
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

// Helper: nummer parsen (Excel kan 364.65000000000003 geven)
function num(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.').trim())
  if (!Number.isFinite(n)) return null
  // Afronden op 2 decimalen om floating-point ruis te vermijden
  return Math.round(n * 100) / 100
}
function str(v) {
  return String(v ?? '').trim()
}

// Maat-codes herkennen (CK01, CK02, FK06, MK04 ...)
function isMaatCode(s) {
  return /^[A-Z]{2}\d{2,3}$/.test(s)
}

// Per maat 4 categorieën verzamelen
const maten = []
let current = null

for (let i = 1; i < rows.length; i++) {
  const r = rows[i]
  const a = str(r[0])
  if (isMaatCode(a)) {
    current = {
      code: a,
      basis: [],       // Velux + Integra basismodellen
      gootstuk: [],    // Gootstukken
      verduister: [],  // Manueel verduisteringsscherm
      zonneGordijn: [],// Zonne-energie verduisteringsgordijn
      buitenZon: [],   // Buitenste zonnescherm
      rolluik: [],     // Rolluik zonne-energie
    }
    maten.push(current)
  }
  if (!current) continue

  // Yasid 11 juni: ALLE modellen opnemen, ook die zonder prijs. Verkoper
  // moet het bestaan van het model zien, maar krijgt "(Prijs volgt)" zodat
  // duidelijk is dat Yasid de prijs nog moet leveren.

  // Basis (kol B-D): label B + code C + prijs D
  // UK10-fix: Yasid heeft daar de Type-cel leeg gelaten, val terug op 'Velux'.
  const basisLabel = str(r[1])
  const basisCode = str(r[2])
  const basisPrijs = num(r[3])
  if (basisCode) {
    current.basis.push({ type: basisLabel || 'Velux', code: basisCode, prijs: basisPrijs })
  }

  // Gootstuk (kol E-F): code E + prijs F
  const gsCode = str(r[4])
  const gsPrijs = num(r[5])
  if (gsCode) {
    current.gootstuk.push({ code: gsCode, prijs: gsPrijs })
  }

  // Verduisteringsscherm (kol G-I): code G + kleur H + prijs I
  const vdCode = str(r[6])
  const vdKleur = str(r[7])
  const vdPrijs = num(r[8])
  if (vdCode) {
    current.verduister.push({ code: vdCode, kleur: vdKleur, prijs: vdPrijs })
  }

  // Zonne-energie verduisteringsgordijn (kol J-L)
  const zgCode = str(r[9])
  const zgKleur = str(r[10])
  const zgPrijs = num(r[11])
  if (zgCode) {
    current.zonneGordijn.push({ code: zgCode, kleur: zgKleur, prijs: zgPrijs })
  }

  // Buitenste zonnescherm Integra (kol M-O)
  const bzCode = str(r[12])
  const bzKleur = str(r[13])
  const bzPrijs = num(r[14])
  if (bzCode) {
    current.buitenZon.push({ code: bzCode, kleur: bzKleur, prijs: bzPrijs })
  }

  // Rolluik zonne-energie (kol P-R)
  const rlCode = str(r[15])
  const rlKleur = str(r[16])
  const rlPrijs = num(r[17])
  if (rlCode) {
    current.rolluik.push({ code: rlCode, kleur: rlKleur, prijs: rlPrijs })
  }
}

// Output stats
console.log(`Velux maten gevonden: ${maten.length}`)
for (const m of maten) {
  console.log(`  ${m.code}: ${m.basis.length} basis, ${m.gootstuk.length} gootstuk, ${m.verduister.length} verduister, ${m.zonneGordijn.length} zonne-gordijn, ${m.buitenZon.length} buiten-zon, ${m.rolluik.length} rolluik`)
}

// Schrijf naar src/data/velux-data.json
const outPath = path.resolve(__dirname, '../src/data/velux-data.json')
fs.writeFileSync(outPath, JSON.stringify({ maten }, null, 2) + '\n', 'utf8')
console.log(`\n✓ Geschreven: ${outPath}`)
