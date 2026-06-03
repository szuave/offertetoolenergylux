/* eslint-disable no-console */
/**
 * Eindcheck: doorloop ELKE rij in Excel met opmerking en verifieer
 * dat de regel ergens in de codebase verwerkt is.
 */
import xlsx from 'xlsx'
import fs from 'fs'

const EXCEL = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'
const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))
const itemDetails = fs.readFileSync('./src/data/item-details.ts', 'utf8')
const calculator = fs.readFileSync('./src/lib/calculator.ts', 'utf8')
const supplements = fs.readFileSync('./src/data/supplements.ts', 'utf8')

const wb = xlsx.readFile(EXCEL)
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })

console.log('═══ EINDAUDIT — elke Excel-opmerking verifiëren ═══\n')

const FACTS = {
  containerCounter: calculator.includes('containerCount') && calculator.includes('CONTAINER_PRICE'),
  toxischPerM2: calculator.includes('TOXISCH_PER_M2'),
  minimumPrijs: calculator.includes('minimumPrice'),
  hellendDakSupplement: supplements.includes('hellend-dak-moeilijke-werf'),
  platDakSupplement: supplements.includes('plat-dak-moeilijke-werf'),
  gevelSupplement: supplements.includes('gevel-moeilijke-gevel'),
  stellingTekstveld: itemDetails.includes('STELLING_FIELDS'),
  koepelLeveranciersprijs: itemDetails.includes('KOEPEL_FIELDS'),
  ralOnly: itemDetails.includes('RAL_ONLY_FIELDS'),
  bakgotenDim: itemDetails.includes('BAKGOTEN_FIELDS'),
  oversteekDim: itemDetails.includes('OVERSTEKEN_FIELDS'),
  mineraleWolKeuze: itemDetails.includes("'minerale-wol'"),
  onderdakConditional: calculator.includes('ITEMS_ALLEEN_BIJ_DAKPAN_OF_LEIEN'),
  dakpanToebehorenAuto: calculator.includes('dakpan-toebehoren') ||
    fs.readFileSync('./src/components/configurator/ConfiguratorPanel.tsx', 'utf8').includes('dakpan-toebehoren'),
  bakgotenHanggotenSplit: calculator.includes('bakgoten-en-hanggoten'),
  jaNeeToggle: fs.readFileSync('./src/components/ui/QuantityInput.tsx', 'utf8').includes("'jaNee'"),
}

let heading = ''
for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  const label = String(r[0] || '').trim()
  const unit = String(r[1] || '').trim()
  const filterRaw = String(r[3] || '').trim()
  if (!label && !unit) continue
  if (label && !unit && (r[2] === '' || r[2] === undefined) && label === label.toUpperCase()) {
    heading = label
  }
  if (!filterRaw) continue

  // Categoriseer de opmerking
  const low = filterRaw.toLowerCase()
  let category = ''
  let status = '✓'
  let detail = ''

  if (low.startsWith('multiplechoice')) {
    category = 'multiplechoice'
  } else if (/^filter\s*optie/.test(low) || low.includes('hoort bij dakpan') || low.includes('altijd  bij keuze dakpan') || low.includes('altijd bij keuze dakpan')) {
    category = 'filter'
    if (low.includes('altijd  bij keuze dakpan') || low.includes('altijd bij keuze dakpan')) {
      detail = FACTS.dakpanToebehorenAuto ? 'auto bij dakpan-keuze' : '⚠ niet auto'
      if (!FACTS.dakpanToebehorenAuto) status = '⚠'
    }
  } else if (low.includes('altijd voorstellen als dakpan of leien')) {
    category = 'conditional'
    detail = FACTS.onderdakConditional ? 'conditional' : '⚠ niet conditional'
    if (!FACTS.onderdakConditional) status = '⚠'
  } else if (low.includes('altijd voorstellen')) {
    category = 'always (basis)'
  } else if (low.startsWith('altijd en tektsveld')) {
    category = 'stelling tekstveld'
    detail = FACTS.stellingTekstveld ? 'tekstveld' : '⚠ geen tekstveld'
    if (!FACTS.stellingTekstveld) status = '⚠'
  } else if (low.includes('ral')) {
    category = 'RAL sub-optie'
    detail = FACTS.ralOnly ? 'RAL field' : '⚠ geen RAL'
    if (!FACTS.ralOnly) status = '⚠'
  } else if (low.startsWith('keuze ')) {
    category = 'keuze sub-optie'
    if (low.includes('6cm') || low.includes('16cm') || low.includes('22cm')) {
      detail = FACTS.mineraleWolKeuze ? 'keuze 6/16/22cm' : '⚠ keuze ontbreekt'
      if (!FACTS.mineraleWolKeuze) status = '⚠'
    }
  } else if (low.startsWith('checklist')) {
    if (low.includes('container') && low.includes('90m')) {
      category = 'container counter'
      detail = FACTS.containerCounter ? '€650/90m²' : '⚠ niet impl'
      if (!FACTS.containerCounter) status = '⚠'
    } else if (low.includes('8 euro per m2') || low.includes('toxisch')) {
      category = 'toxisch €8/m²'
      detail = FACTS.toxischPerM2 ? '€8/m² + min €800' : '⚠ niet impl'
      if (!FACTS.toxischPerM2) status = '⚠'
    } else if (low.includes('werf moeilij') || low.includes('hoger dan 8')) {
      category = 'werf-supplement (plat dak)'
      detail = FACTS.platDakSupplement ? '+7% min €3000' : '⚠'
      if (!FACTS.platDakSupplement) status = '⚠'
    } else if (low.includes('20 euro per m2')) {
      category = 'gevel-supplement (€20/m²)'
      detail = FACTS.gevelSupplement ? '+€20/m²' : '⚠'
      if (!FACTS.gevelSupplement) status = '⚠'
    } else if (low.includes('zolderluik') || low.includes('20 euro meerprijs')) {
      category = 'ja/nee + supplement'
      detail = FACTS.jaNeeToggle ? 'ja/nee toggle' : '⚠'
      if (!FACTS.jaNeeToggle) status = '⚠'
    } else if (low.includes('aanvinken')) {
      category = 'checklist aanvinken'
      detail = FACTS.jaNeeToggle ? 'ja/nee' : '⚠'
    } else if (low.includes('4319')) {
      category = 'werf-supplement (hellend dak)'
      detail = FACTS.hellendDakSupplement ? '+7% min €4319' : '⚠'
      if (!FACTS.hellendDakSupplement) status = '⚠'
    }
  } else if (low.includes('minimum van 1500')) {
    category = 'minimum-prijs'
    detail = FACTS.minimumPrijs ? 'min €1500' : '⚠'
    if (!FACTS.minimumPrijs) status = '⚠'
  } else if (low.includes('offerte opvragen') || low.includes('leveranciersprijs')) {
    category = 'koepel +20%'
    detail = FACTS.koepelLeveranciersprijs ? '+20% marge' : '⚠'
    if (!FACTS.koepelLeveranciersprijs) status = '⚠'
  } else if (low.includes('blanco') || low.includes('voor blanco')) {
    category = 'verholen-goten ja/nee'
    detail = '⚠ qty=0/lm als ja/nee — geen expliciete toggle'
    status = '⚠'
  } else {
    category = 'overig / hint'
  }

  console.log(`  ${status}  rij${(i+1).toString().padStart(3,' ')}  [${(label||heading).slice(0,38).padEnd(38)}]  ${category.padEnd(28)}  ${detail}`)
}

console.log('\n═══ STATUS ═══')
for (const [k, v] of Object.entries(FACTS)) {
  console.log(`  ${v ? '✓' : '✗'}  ${k}`)
}
