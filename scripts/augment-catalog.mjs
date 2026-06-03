/* eslint-disable no-console */
/**
 * Voegt aan catalog.json toe wat NIET expliciet in Excel staat maar wel
 * uit Yasid's mails komt:
 *  - Roofing/EPDM als filters bij plat-dak (mail v2: "moet keuzen zijn")
 *  - Minimum-prijzen op specifieke items
 *
 * Run na elke parse-pricing-v2.mjs.
 */
import fs from 'fs'

const path = './src/data/catalog.json'
const catalog = JSON.parse(fs.readFileSync(path, 'utf8'))

/* ---------- 1. Roofing/EPDM filters bij plat-dak ---------- */
const ROOFING_ITEMS = [
  'leveren-plaatsen-onderlaag-roofing',
  'leveren-en-plaatsen-toplaag-roofing',
  'leveren-en-plaatsen-roofing-tapgat',
]
const EPDM_ITEMS = [
  'leveren-en-plaatsen-epdm',
  'leveren-en-plaatsen-epdm-tapgat',
]

let retagged = 0
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      if (ROOFING_ITEMS.includes(it.id)) {
        it.filter = { kind: 'optional', flagId: 'roofing' }
        retagged++
      } else if (EPDM_ITEMS.includes(it.id)) {
        it.filter = { kind: 'optional', flagId: 'epdm' }
        retagged++
      }
    }
  }
}

// Voeg flags toe aan optionalFlags (na isolatiewerken-binnenkant maar voor
// dakpan-toebehoren — logische plek voor plat-dak filters).
const flagDefs = [
  { id: 'roofing', label: 'Dakdichting roofing' },
  { id: 'epdm', label: 'Dakdichting EPDM' },
]
for (const def of flagDefs) {
  if (!catalog.optionalFlags.find((f) => f.id === def.id)) {
    catalog.optionalFlags.push(def)
  }
}

/* ---------- 2. Minimum-prijzen ---------- */
const MINIMUMS = {
  'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': 1500,
  // Yasid mail v2: toxisch afval = €8/m² met minimum €800. Excel-prijs is
  // €649/stuk; we behouden de Excel-prijs en zetten de minimum als veiligheid.
  'afvoeren-werfpuin-toxisch-afval': 800,
}

let minSet = 0
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      if (MINIMUMS[it.id] !== undefined) {
        it.minimumPrice = MINIMUMS[it.id]
        minSet++
      }
    }
  }
}

fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
console.log(`✓ ${retagged} items omgetagd naar roofing/epdm`)
console.log(`✓ ${minSet} items hebben nu een minimum-prijs`)
console.log(`✓ Flags toegevoegd: ${flagDefs.map((f) => f.id).join(', ')}`)
