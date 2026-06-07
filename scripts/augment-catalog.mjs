/* eslint-disable no-console */
/**
 * Voegt aan catalog.json toe wat NIET expliciet in Excel staat maar wel
 * uit Yasid's mails komt of voor de UX nodig is:
 *
 *  - Plat-dak sub-filters (Yasid mail v2: "standaard weg" — alle andere
 *    filters mogen blijven; user-feedback bevestigt dit). Yasid noemt
 *    expliciet roofing/EPDM als "moeten keuzen zijn".
 *  - Gevelwerken sub-filters voor 10-items rubriek (UX-keuze, niet
 *    expliciet uitgesloten in Yasid's mail).
 *  - Minimum-prijzen op specifieke items.
 *
 * Run na elke parse-pricing-v2.mjs.
 */
import fs from 'fs'

const path = './src/data/catalog.json'
const catalog = JSON.parse(fs.readFileSync(path, 'utf8'))

/* ---------- 1. Plat-dak sub-filters ---------- */
const PLAT_DAK_FLAGS = [
  { id: 'plat-dak-houtconstructie', label: 'Houtconstructie plat dak' },
  { id: 'plat-dak-isolatie',        label: 'Isolatie plat dak' },
  { id: 'roofing',                  label: 'Dakdichting roofing' },
  { id: 'epdm',                     label: 'Dakdichting EPDM' },
  { id: 'plat-dak-lichtkoepel',     label: 'Lichtkoepel' },
  { id: 'plat-dak-schouw',          label: 'Schouw plat dak' },
  { id: 'plat-dak-dakrand',         label: 'Dakrand-afwerking' },
  { id: 'plat-dak-lood-zink',       label: 'Lood- en zinkwerken plat dak' },
  { id: 'plat-dak-airco',           label: 'Airco' },
  { id: 'plat-dak-sidings-buur',    label: 'Sidings buur (plat dak)' },
]

const PLAT_DAK_ITEM_MAP = {
  // Roofing-tracé
  'verwijderen-bestaande-roofing': 'roofing',
  'leveren-plaatsen-onderlaag-roofing': 'roofing',
  'leveren-en-plaatsen-toplaag-roofing': 'roofing',
  'leveren-en-plaatsen-roofing-tapgat': 'roofing',
  // EPDM-tracé
  'verwijderen-bestaande-epdm-dakdichting': 'epdm',
  'leveren-en-plaatsen-epdm': 'epdm',
  'leveren-en-plaatsen-epdm-tapgat': 'epdm',
  // Houtconstructie
  'verwijderen-osb-plat-dak': 'plat-dak-houtconstructie',
  'verwijderen-kepers-plat-dak': 'plat-dak-houtconstructie',
  'verwijderen-gording-plat-dak': 'plat-dak-houtconstructie',
  'verwijderen-houtconstructie-integraal': 'plat-dak-houtconstructie',
  'leveren-en-plaatsen-gordingen-plat-dak': 'plat-dak-houtconstructie',
  'leveren-en-plaatsen-osb-plat-dak': 'plat-dak-houtconstructie',
  // Isolatie
  'isolatiewerken': 'plat-dak-isolatie',
  // Lichtkoepel
  'bestaande-koepel-verwijderen-voor-vernieuwing': 'plat-dak-lichtkoepel',
  'ophoging-koepel': 'plat-dak-lichtkoepel',
  'leveren-nieuwe-koepel': 'plat-dak-lichtkoepel',
  'plaatsen-nieuwe-koepel-tem-90-cm': 'plat-dak-lichtkoepel',
  'plaatsen-nieuwe-koepel-90cm': 'plat-dak-lichtkoepel',
  // Schouw plat dak
  'schouw-verwijderen-max-1m': 'plat-dak-schouw',
  'schouw-verwijderen-max-2m': 'plat-dak-schouw',
  'asbestschouw-verwijderen': 'plat-dak-schouw',
  'loodafwerking-schouw': 'plat-dak-schouw',
  // Dakrand
  'leveren-en-plaatsen-sls-hout-ophoging-dakrand': 'plat-dak-dakrand',
  'esthetische-afwerking-dakrand': 'plat-dak-dakrand',
  'leveren-en-plaatsen-aludakrand': 'plat-dak-dakrand',
  // Lood-zink (resterende plat-dak lood-zink items)
  'verwijderen-bestaande-zinken-dakdichting': 'plat-dak-lood-zink',
  'leveren-en-plaatsen-zinken-slab': 'plat-dak-lood-zink',
  'leveren-en-plaatsen-afvoerbuis': 'plat-dak-lood-zink',
  'leveren-en-plaatsen-verluchtingspaddestoel': 'plat-dak-lood-zink',
  'plaatsen-dakdoorvoer-gasketel-plat-dak': 'plat-dak-lood-zink',
  // Airco
  'demonteren-airco-buiten-unit': 'plat-dak-airco',
  // Sidings buur
  'verwijderen-sidings-buur-om-isolatie-plat-dak-en-2': 'plat-dak-sidings-buur',
  // 'Verwijderen en afvoeren kiezelsteen' blijft basis — geen logische filter
}

/* ---------- 2. Gevelwerken sub-filters ---------- */
const GEVEL_FLAGS = [
  { id: 'gevel-sidings-isolatie', label: 'Sidings + gevelisolatie' },
  { id: 'gevel-dorpels-pleister', label: 'Dorpels & pleister' },
  { id: 'gevel-ventilatie',       label: 'Ventilatie & sanitair' },
]

const GEVEL_ITEM_MAP = {
  'verwijderen-sidings-gevel': 'gevel-sidings-isolatie',
  'gevelisolatie-eps': 'gevel-sidings-isolatie',
  'gevelafwerking-crepi-siliconenharspleister': 'gevel-sidings-isolatie',
  'leveren-en-plaatsen-aludorpels': 'gevel-dorpels-pleister',
  'granietpleister': 'gevel-dorpels-pleister',
  'blauwe-steen': 'gevel-dorpels-pleister',
  'aludorpels': 'gevel-dorpels-pleister',
  'ventilatieroosters': 'gevel-ventilatie',
  'waterkraan-in-muur-aanwezig-moet-verlengd-worden': 'gevel-ventilatie',
  'aluminium-profiel-op-maat-voor-de-raampartijen-g': 'gevel-ventilatie',
}

/* ---------- Toepassen ---------- */
let retagged = 0
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const platFlag = PLAT_DAK_ITEM_MAP[it.id]
      const gevelFlag = GEVEL_ITEM_MAP[it.id]
      if (platFlag) {
        it.filter = { kind: 'optional', flagId: platFlag }
        retagged++
      } else if (gevelFlag) {
        it.filter = { kind: 'optional', flagId: gevelFlag }
        retagged++
      }
    }
  }
}

// Flags toevoegen (in volgorde) zodat ze in stap 2 onderaan bij Plat Dak
// en Gevelwerken verschijnen.
const allFlags = [...PLAT_DAK_FLAGS, ...GEVEL_FLAGS]
for (const def of allFlags) {
  if (!catalog.optionalFlags.find((f) => f.id === def.id)) {
    catalog.optionalFlags.push(def)
  }
}

/* ---------- Minimum-prijzen ---------- */
const MINIMUMS = {
  'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': 1500,
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

/* ---------- Daryl 4 juni: bug-fix "Nieuwe oversteek timmeren - basis"
   miste een filter en verscheen altijd. Plaats achter oversteken-flag. */
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      if (it.id === 'nieuwe-oversteek-timmeren-basis-nieuwe-bekleding') {
        it.filter = { kind: 'optional', flagId: 'oversteken' }
      }
    }
  }
}

/* ---------- Daryl 4 juni: Afvoeren werfpuin + toxisch zijn voortaan
   2 APARTE ja/nee toggles (geen multiplechoice meer). Beide kunnen
   tegelijk aan staan. Aantal/lijntotaal wordt auto-berekend via
   resolveSpecialLine in de calculator (containerCount × €650 voor
   werfpuin, removed-m² × €8 min €800 voor toxisch). */
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      if (it.id === 'afvoeren-werfpuin' || it.id === 'afvoeren-werfpuin-toxisch-afval') {
        it.filter = { kind: 'always' }
        it.unit = 'jaNee'
        // Prijs blijft 1 als placeholder; calculator gebruikt zijn eigen
        // formule via resolveSpecialLine.
      }
    }
  }
}
// Multipleсhoice group "afvoeren-afval" weghalen — niet meer relevant.
catalog.multipleChoiceGroups = catalog.multipleChoiceGroups.filter(
  (g) => g.id !== 'afvoeren-afval',
)

/* ---------- Daryl 4 juni: item-overrides ---------- */
const OVERRIDES = {
  // Stelling-items: Daryl wil dat de hint over "Altijd en tektsveld voorzien"
  // weg gaat. Het tekstveld zelf blijft (via item-details).
  'stelling-valbeveiliging-voorgevel': { hint: null },
  'stelling-valbeveiliging-achtergevel': { hint: null },
  'stelling-valbeveiliging-zijkant-links': { hint: null },
  'stelling-valbeveiliging-zijkant-rechts': { hint: null },

  // Onderdak: hint vervangen door de marketing-zin.
  onderdak: {
    hint: 'Hoogkwalitatief Klasse A+++ onderdak zodat jouw dak Extra duurzaam beschermd is tegen waterinfiltratie',
  },

  // Nokpan: stuk → lm + zinnetje "geventileerde ondernok".
  nokpan: { unit: 'lm', hint: 'geventileerde ondernok' },

  // Monteren zonnepanelen: label aanpassen.
  'monteren-zonnepanelen': { label: 'Monteren bestaande zonnepanelen' },

  // Gootstukken: label aanpassen.
  gootstukken: { label: 'Nieuw - gootstuk Velux' },

  // Plaatsen BESTAANDE hanggoot: "bestaande" niet in hoofdletters.
  'plaatsen-bestaande-hanggoot': { label: 'Plaatsen bestaande hanggoot' },

  // Verholen goten: hint weg (kwam in PDF).
  'verholen-goten': { hint: null },

  // Verluchtingspaddestoel: hint weg.
  verluchtingspaddestoel: { hint: null },

  // Verwijderen kiezelsteen plat dak: hint weg (minimum blijft via minimumPrice).
  'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak': { hint: null },

  // Aluminium profiel raampartijen: m² → lm.
  'aluminium-profiel-op-maat-voor-de-raampartijen-g': { unit: 'lm' },

  // Loodafwerking schouw (plat dak): lm → stuk.
  'loodafwerking-schouw': { unit: 'stuk' },

  // Panlatten op panafstand: lm → m².
  'panlatten-op-panafstand-hechten-op-het-onderdak': { unit: 'm2' },

  // Buitenbekleding bakgoot: m² → lm.
  'buitenbekleding-bakgoot': { unit: 'lm' },
}

let overridden = 0
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const o = OVERRIDES[it.id]
      if (!o) continue
      if (o.label !== undefined) it.label = o.label
      if (o.unit !== undefined) it.unit = o.unit
      if (o.hint === null) delete it.hint
      else if (o.hint !== undefined) it.hint = o.hint
      overridden++
    }
  }
}

/* ---------- Daryl 4 juni: nieuwe items ---------- */
function findSub(catId, subId) {
  const cat = catalog.categories.find((c) => c.id === catId)
  return cat?.subcategories.find((s) => s.id === subId)
}
function addItemAfter(sub, anchorId, newItem) {
  if (!sub) return false
  if (sub.items.find((it) => it.id === newItem.id)) return false
  const idx = sub.items.findIndex((it) => it.id === anchorId)
  if (idx < 0) sub.items.push(newItem)
  else sub.items.splice(idx + 1, 0, newItem)
  return true
}

const SCHOUW_REGIE_HINT = 'Prijs in regie 65€/pp exclusief materiaal'

// 3 nieuwe schouw-items in dakdichtingswerken van hellend dak, na het
// bestaande "Metselwerk schouw" (id metselwerk-schouw-2).
const newSchouwItems = [
  { id: 'voegwerk-schouw', label: 'Voegwerk schouw', unit: 'm2', unitPrice: null,
    priceNote: 'Op regie', hint: SCHOUW_REGIE_HINT,
    filter: { kind: 'optional', flagId: 'schouw' } },
  { id: 'verhogen-schouw', label: 'Verhogen schouw', unit: 'm2', unitPrice: null,
    priceNote: 'Op regie', hint: SCHOUW_REGIE_HINT,
    filter: { kind: 'optional', flagId: 'schouw' } },
  { id: 'restoratie-schouw', label: 'Restoratie schouw', unit: 'm2', unitPrice: null,
    priceNote: 'Op regie', hint: SCHOUW_REGIE_HINT,
    filter: { kind: 'optional', flagId: 'schouw' } },
]
const dakdichtSub = findSub('hellend-dak', 'dakdichtingswerken')
let newCount = 0
for (const it of newSchouwItems) {
  if (addItemAfter(dakdichtSub, 'metselwerk-schouw-2', it)) newCount++
}

// Verwijderen dekstenen — bij plat dak / plat-dak rubriek, altijd zichtbaar
// (Daryl: "VERWIJDEREN DEKSTENEN MET OPTIES: TERUGPLAATSEN OF VERNIEUWEN
//  + LOPENDE METER").
const dekstenen = {
  id: 'verwijderen-dekstenen',
  label: 'Verwijderen dekstenen',
  unit: 'lm',
  unitPrice: 1,
  filter: { kind: 'always' },
}
const platDakSub = findSub('plat-dak', 'plat-dak')
if (platDakSub && !platDakSub.items.find((it) => it.id === 'verwijderen-dekstenen')) {
  // Achteraan in werfinstallatie-deel van plat-dak rubriek
  const anchorIdx = platDakSub.items.findIndex((it) => it.id === 'verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')
  if (anchorIdx >= 0) platDakSub.items.splice(anchorIdx + 1, 0, dekstenen)
  else platDakSub.items.push(dekstenen)
  newCount++
}

fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
console.log(`✓ ${retagged} items omgetagd naar plat-dak/gevel filters`)
console.log(`✓ ${minSet} items hebben een minimum-prijs`)
console.log(`✓ ${overridden} items met Daryl-overrides (label/unit/hint)`)
console.log(`✓ ${newCount} nieuwe items toegevoegd`)
console.log(`✓ ${allFlags.length} flags toegevoegd: ${allFlags.map((f) => f.id).join(', ')}`)
