/* eslint-disable no-console */
import fs from 'fs'

const path = './src/data/catalog.json'
const catalog = JSON.parse(fs.readFileSync(path, 'utf8'))

/* ---------- Nieuwe filters ---------- */
const NEW_FLAGS = [
  // Plat dak
  { id: 'plat-dak-standaard-afbraak', label: 'Standaard afbraak plat dak' },
  { id: 'plat-dak-houtconstructie',  label: 'Houtconstructie plat dak' },
  { id: 'plat-dak-isolatie',         label: 'Isolatie plat dak' },
  { id: 'plat-dak-roofing',          label: 'Dakdichting roofing' },
  { id: 'plat-dak-epdm',             label: 'Dakdichting EPDM' },
  { id: 'plat-dak-lichtkoepel',      label: 'Lichtkoepel' },
  { id: 'plat-dak-schouw',           label: 'Schouw plat dak' },
  { id: 'plat-dak-dakrand-afwerking',label: 'Dakrand-afwerking' },
  { id: 'plat-dak-lood-zink',        label: 'Lood- en zinkwerken plat dak' },
  { id: 'plat-dak-airco',            label: 'Airco' },
  { id: 'plat-dak-sidings-buur',     label: 'Sidings buur (plat dak)' },
  // Gevelwerken
  { id: 'gevel-sidings-isolatie',    label: 'Sidings + gevelisolatie' },
  { id: 'gevel-dorpels-pleister',    label: 'Dorpels & pleister' },
  { id: 'gevel-ventilatie',          label: 'Ventilatie & sanitair' },
]

for (const f of NEW_FLAGS) {
  if (!catalog.optionalFlags.find((x) => x.id === f.id)) {
    catalog.optionalFlags.push(f)
  }
}

/* ---------- Item-mapping ---------- */
const ITEM_MAP = {
  // Plat dak — rubriek "plat-dak"
  'verwijderen-bestaande-roofing': 'plat-dak-roofing',
  'verwijderen-bestaande-epdm-dakdichting': 'plat-dak-epdm',
  'verwijderen-bestaande-zinken-dakdichting': 'plat-dak-lood-zink',
  'verwijderen-osb-plat-dak': 'plat-dak-houtconstructie',
  'verwijderen-kepers-plat-dak': 'plat-dak-houtconstructie',
  'verwijderen-gording-plat-dak': 'plat-dak-houtconstructie',
  'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': 'plat-dak-standaard-afbraak',
  'verwijderen-sidings-buur-om-isolatie-plat-dak-en-2': 'plat-dak-sidings-buur',
  'verwijderen-houtconstructie-integraal': 'plat-dak-houtconstructie',
  'bestaande-koepel-verwijderen-voor-vernieuwing': 'plat-dak-lichtkoepel',
  'schouw-verwijderen-max-1m': 'plat-dak-schouw',
  'schouw-verwijderen-max-2m': 'plat-dak-schouw',
  'asbestschouw-verwijderen': 'plat-dak-schouw',
  'demonteren-airco-buiten-unit': 'plat-dak-airco',
  'leveren-en-plaatsen-gordingen-plat-dak': 'plat-dak-houtconstructie',
  'leveren-en-plaatsen-osb-plat-dak': 'plat-dak-houtconstructie',
  'isolatiewerken': 'plat-dak-isolatie',
  'leveren-en-plaatsen-sls-hout-ophoging-dakrand': 'plat-dak-dakrand-afwerking',
  'esthetische-afwerking-dakrand': 'plat-dak-dakrand-afwerking',
  'ophoging-koepel': 'plat-dak-lichtkoepel',
  'leveren-plaatsen-onderlaag-roofing': 'plat-dak-roofing',
  'leveren-en-plaatsen-toplaag-roofing': 'plat-dak-roofing',
  'leveren-en-plaatsen-epdm': 'plat-dak-epdm',
  'leveren-nieuwe-koepel': 'plat-dak-lichtkoepel',
  'plaatsen-nieuwe-koepel-tem-90-cm': 'plat-dak-lichtkoepel',
  'plaatsen-nieuwe-koepel-90cm': 'plat-dak-lichtkoepel',
  'leveren-en-plaatsen-aludakrand': 'plat-dak-dakrand-afwerking',
  'leveren-en-plaatsen-zinken-slab': 'plat-dak-lood-zink',
  'loodafwerking-schouw': 'plat-dak-schouw',
  'leveren-en-plaatsen-epdm-tapgat': 'plat-dak-epdm',
  'leveren-en-plaatsen-roofing-tapgat': 'plat-dak-roofing',
  'leveren-en-plaatsen-afvoerbuis': 'plat-dak-lood-zink',
  'leveren-en-plaatsen-verluchtingspaddestoel': 'plat-dak-lood-zink',
  'plaatsen-dakdoorvoer-gasketel-plat-dak': 'plat-dak-lood-zink',

  // Plat dak — rubriek "lood-en-zinkwerken"
  'leveren-en-plaatsen-aludakrand-2': 'plat-dak-dakrand-afwerking',
  'leveren-en-plaatsen-zinken-slab-2': 'plat-dak-lood-zink',
  'loodafwerking-schouw-2': 'plat-dak-schouw',
  'leveren-en-plaatsen-epdm-tapgat-2': 'plat-dak-epdm',
  'leveren-en-plaatsen-roofing-tapgat-2': 'plat-dak-roofing',
  'leveren-en-plaatsen-afvoerbuis-2': 'plat-dak-lood-zink',
  'leveren-en-plaatsen-verluchtingspaddestoel-2': 'plat-dak-lood-zink',
  'plaatsen-dakdoorvoer-gasketel-plat-dak-2': 'plat-dak-lood-zink',

  // Gevelwerken
  'verwijderen-sidings-gevel': 'gevel-sidings-isolatie',
  'gevelisolatie-eps': 'gevel-sidings-isolatie',
  'gevelafwerking-crepi-siliconenharspleister': 'gevel-sidings-isolatie',
  'leveren-en-plaatsen-aludorpels': 'gevel-dorpels-pleister',
  'granietpleister': 'gevel-dorpels-pleister',
  'aludorpels': 'gevel-dorpels-pleister',
  'ventilatieroosters': 'gevel-ventilatie',
  'waterkraan-in-muur-aanwezig': 'gevel-ventilatie',
  'ventilatieroosters-2': 'gevel-ventilatie',
  'waterkraan-in-muur-aanwezig-moet-verlengd-worden': 'gevel-ventilatie',
}

/* ---------- Toepassen ---------- */
let touched = 0
let untouched = []
for (const cat of catalog.categories) {
  if (cat.id !== 'plat-dak' && cat.id !== 'gevelwerken') continue
  for (const sub of cat.subcategories) {
    for (const item of sub.items) {
      const flagId = ITEM_MAP[item.id]
      if (!flagId) {
        untouched.push(`${cat.id} → ${sub.id} → ${item.id}`)
        continue
      }
      item.filter = { kind: 'optional', flagId }
      touched++
    }
  }
}

fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n')

console.log(`✓ ${touched} items omgetagd naar optional met flag.`)
console.log(`  ${NEW_FLAGS.length} nieuwe flags toegevoegd.`)
if (untouched.length) {
  console.log(`\n⚠ ${untouched.length} items zonder mapping:`)
  for (const u of untouched) console.log('  ·', u)
}
