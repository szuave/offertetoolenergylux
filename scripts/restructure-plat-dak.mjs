/* eslint-disable no-console */
/**
 * Daryl 4 juni: plat-dak moet dezelfde sub-rubriek-structuur krijgen
 * als hellend-dak:
 *   WERFINSTALLATIE / ISOLATIEWERKEN / AMBACHTELIJK TIMMERWERK /
 *   DAKDICHTINGSWERKEN / LOOD-EN-ZINKWERKEN
 *
 * Plus nieuwe items:
 *   - Isolatiewerken altijd: Dampscherm, PIR 10/12/14, Minerale wol
 *   - SLS-hout + Esthetische afwerking dakrand altijd in timmerwerk
 *
 * Items uit de huidige flat 'plat-dak' rubriek verhuizen naar de juiste
 * sub-rubriek; de bestaande 'lood-en-zinkwerken' sub blijft.
 */
import fs from 'fs'

const path = './src/data/catalog.json'
const catalog = JSON.parse(fs.readFileSync(path, 'utf8'))

const platDak = catalog.categories.find((c) => c.id === 'plat-dak')
if (!platDak) {
  console.error('Plat dak categorie niet gevonden!')
  process.exit(1)
}

// Verzamel alle huidige plat-dak items in 1 lijst
const allItems = []
for (const sub of platDak.subcategories) {
  for (const it of sub.items) allItems.push(it)
}

// Mapping item-id → nieuwe sub-rubriek
const ITEM_TO_SUB = {
  // Werfinstallatie / Afbraak
  'verwijderen-bestaande-roofing': 'werfinstallatie',
  'verwijderen-bestaande-epdm-dakdichting': 'werfinstallatie',
  'verwijderen-bestaande-zinken-dakdichting': 'werfinstallatie',
  'verwijderen-osb-plat-dak': 'werfinstallatie',
  'verwijderen-kepers-plat-dak': 'werfinstallatie',
  'verwijderen-gording-plat-dak': 'werfinstallatie',
  'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': 'werfinstallatie',
  'verwijderen-sidings-buur-om-isolatie-plat-dak-en-2': 'werfinstallatie',
  'verwijderen-houtconstructie-integraal': 'werfinstallatie',
  'bestaande-koepel-verwijderen-voor-vernieuwing': 'werfinstallatie',
  'schouw-verwijderen-max-1m': 'werfinstallatie',
  'schouw-verwijderen-max-2m': 'werfinstallatie',
  'asbestschouw-verwijderen': 'werfinstallatie',
  'demonteren-airco-buiten-unit': 'werfinstallatie',
  'verwijderen-dekstenen': 'werfinstallatie',

  // Isolatiewerken
  isolatiewerken: 'isolatiewerken',

  // Ambachtelijk Timmerwerk
  'leveren-en-plaatsen-gordingen-plat-dak': 'ambachtelijk-timmerwerk',
  'leveren-en-plaatsen-osb-plat-dak': 'ambachtelijk-timmerwerk',
  'leveren-en-plaatsen-sls-hout-ophoging-dakrand': 'ambachtelijk-timmerwerk',
  'esthetische-afwerking-dakrand': 'ambachtelijk-timmerwerk',

  // Dakdichtingswerken
  'leveren-plaatsen-onderlaag-roofing': 'dakdichtingswerken',
  'leveren-en-plaatsen-toplaag-roofing': 'dakdichtingswerken',
  'leveren-en-plaatsen-epdm': 'dakdichtingswerken',
  'leveren-nieuwe-koepel': 'dakdichtingswerken',
  'plaatsen-nieuwe-koepel-tem-90-cm': 'dakdichtingswerken',
  'plaatsen-nieuwe-koepel-90cm': 'dakdichtingswerken',
  'ophoging-koepel': 'dakdichtingswerken',

  // Lood-en-Zinkwerken (huidige sub-items blijven onder dezelfde naam)
  'leveren-en-plaatsen-aludakrand': 'lood-en-zinkwerken',
  'leveren-en-plaatsen-zinken-slab': 'lood-en-zinkwerken',
  'loodafwerking-schouw': 'lood-en-zinkwerken',
  'leveren-en-plaatsen-epdm-tapgat': 'lood-en-zinkwerken',
  'leveren-en-plaatsen-roofing-tapgat': 'lood-en-zinkwerken',
  'leveren-en-plaatsen-afvoerbuis': 'lood-en-zinkwerken',
  'leveren-en-plaatsen-verluchtingspaddestoel': 'lood-en-zinkwerken',
  'plaatsen-dakdoorvoer-gasketel-plat-dak': 'lood-en-zinkwerken',
}

const SUB_LABELS = {
  werfinstallatie: 'Werfinstallatie / Afbraak',
  isolatiewerken: 'Isolatiewerken',
  'ambachtelijk-timmerwerk': 'Ambachtelijk Timmerwerk',
  dakdichtingswerken: 'Dakdichtingswerken',
  'lood-en-zinkwerken': 'Lood - En Zinkwerken',
}

// Maak nieuwe sub-rubrieken in volgorde
const newSubs = {
  werfinstallatie: { id: 'werfinstallatie', label: SUB_LABELS.werfinstallatie, items: [] },
  isolatiewerken: { id: 'isolatiewerken', label: SUB_LABELS.isolatiewerken, items: [] },
  'ambachtelijk-timmerwerk': {
    id: 'ambachtelijk-timmerwerk',
    label: SUB_LABELS['ambachtelijk-timmerwerk'],
    items: [],
  },
  dakdichtingswerken: { id: 'dakdichtingswerken', label: SUB_LABELS.dakdichtingswerken, items: [] },
  'lood-en-zinkwerken': {
    id: 'lood-en-zinkwerken',
    label: SUB_LABELS['lood-en-zinkwerken'],
    items: [],
  },
}

let placed = 0
const unmapped = []
for (const it of allItems) {
  const target = ITEM_TO_SUB[it.id]
  if (!target || !newSubs[target]) {
    unmapped.push(it)
    continue
  }
  newSubs[target].items.push(it)
  placed++
}

// Voeg nieuwe isolatie-items toe (Daryl: dampscherm/PIR 10/12/14/minerale wol)
const isolatieNieuw = [
  {
    id: 'plat-dak-dampscherm',
    label: 'Dampscherm',
    unit: 'm2',
    unitPrice: 7,
    filter: { kind: 'optional', flagId: 'plat-dak-isolatie' },
  },
  {
    id: 'plat-dak-pir-10cm',
    label: 'PIR 10 cm',
    unit: 'm2',
    unitPrice: 55,
    filter: { kind: 'optional', flagId: 'plat-dak-isolatie' },
  },
  {
    id: 'plat-dak-pir-12cm',
    label: 'PIR 12 cm',
    unit: 'm2',
    unitPrice: 56,
    filter: { kind: 'optional', flagId: 'plat-dak-isolatie' },
  },
  {
    id: 'plat-dak-pir-14cm',
    label: 'PIR 14 cm',
    unit: 'm2',
    unitPrice: 63,
    filter: { kind: 'optional', flagId: 'plat-dak-isolatie' },
  },
  {
    id: 'plat-dak-minerale-wol',
    label: 'Minerale wol',
    unit: 'm2',
    unitPrice: 15,
    filter: { kind: 'optional', flagId: 'plat-dak-isolatie' },
  },
]
for (const it of isolatieNieuw) {
  if (!newSubs.isolatiewerken.items.find((x) => x.id === it.id)) {
    newSubs.isolatiewerken.items.push(it)
  }
}

// Vervang plat-dak.subcategories door de nieuwe structuur (alleen niet-lege subs)
platDak.subcategories = Object.values(newSubs).filter((s) => s.items.length > 0)

fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n', 'utf8')

console.log(`✓ ${placed} plat-dak items herverdeeld over ${Object.keys(newSubs).length} sub-rubrieken`)
for (const [id, sub] of Object.entries(newSubs)) {
  console.log(`   ${id}: ${sub.items.length} items`)
}
if (unmapped.length > 0) {
  console.log(`⚠ ${unmapped.length} items NIET gemapt:`)
  for (const it of unmapped) console.log(`   · ${it.id} | ${it.label}`)
}
