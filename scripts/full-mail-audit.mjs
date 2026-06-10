/* eslint-disable no-console */
/**
 * Volledige audit over ALLE mails die de user heeft doorgestuurd.
 * Bij conflict tussen mails wint de LAATSTE (gebruiker-regel).
 *
 * Volgorde van mails (oud → nieuw):
 *  1. Yasid mail 1 — eerste requirements (PDF, filteropties, staffel,
 *     rood/groen prijs/m², dakpan/lei/sandwich keuze met foto +
 *     tech fiche, subtotalen per rubriek, 7-day korting, niets-vergeten)
 *  2. Yasid mail 2 — RENOCHECK Excel + Lozone PDF (referenties)
 *  3. Yasid mail 3 — Opties dakbekleding hellend dak xlsx
 *  4. Yasid mail 4 — filteropties bovenaan, sub-opties RAL/Merk/Dim,
 *     oversteken conditional combo
 *  5. Yasid mail 5 — 29 foto's dakpannen + Stormpan 993 + Vieilli Rood
 *  6. Yasid mail v2 (4 juni) — chronologie, standaard-filter weg,
 *     bakgoten/hanggoten apart, plat dak roofing/EPDM, dimensies a/b/c/d,
 *     prijscontrole rood/groen kostenratio €245
 *  7. Daryl "Verdere Aanvulling" — RAL voor 3 gevel items + plat dak
 *     hout-filter 6 items
 *  8. Daryl FEEDBACK (grote mail) — overrult eerdere mails bij conflict
 */
import fs from 'fs'

const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))
const dakbekleding = JSON.parse(fs.readFileSync('./src/data/dakbekleding.json', 'utf8'))
const itemDetails = fs.readFileSync('./src/data/item-details.ts', 'utf8')
const checklists = fs.readFileSync('./src/data/checklists.ts', 'utf8')
const calculator = fs.readFileSync('./src/lib/calculator.ts', 'utf8')
const checklistLib = fs.readFileSync('./src/lib/checklist.ts', 'utf8')
const alwaysVisible = fs.readFileSync('./src/data/always-visible.ts', 'utf8')
const filterStep = fs.readFileSync('./src/components/wizard/FilterStep.tsx', 'utf8')
const detailStep = fs.readFileSync('./src/components/wizard/DetailStep.tsx', 'utf8')
const configurator = fs.readFileSync('./src/components/configurator/ConfiguratorPanel.tsx', 'utf8')
const pricePerM2 = fs.readFileSync('./src/components/summary/PricePerM2Indicator.tsx', 'utf8')
const dakbekledingSelector = fs.readFileSync('./src/components/configurator/DakbekledingSelector.tsx', 'utf8')
const discountControl = fs.readFileSync('./src/components/summary/DiscountControl.tsx', 'utf8')
const photoMap = fs.readFileSync('./src/data/dakbekleding-photos.ts', 'utf8')
const ralColors = fs.readFileSync('./src/data/ral-colors.ts', 'utf8')

function findItem(id) {
  for (const cat of catalog.categories) {
    for (const sub of cat.subcategories) {
      for (const it of sub.items) {
        if (it.id === id) return { cat: cat.id, sub: sub.id, ...it }
      }
    }
  }
  return null
}

const out = []
function row(mail, label, ok, note = '') {
  out.push({ mail, label, ok, note })
}

/* ════════════════════════════════════════════════════════════════════ */
/* MAIL 1 — Yasid: eerste requirements                                  */
/* ════════════════════════════════════════════════════════════════════ */
row('M1', 'PDF-export bestaat (OfferDocument + ExportActions)',
  fs.existsSync('./src/components/pdf/OfferDocument.tsx'))
row('M1', 'Filteropties als eerste UI-stap (FilterStep is stap 2 in wizard)',
  filterStep.includes('Filter opties'))
row('M1', 'Staffelprijzen', false, 'NIET geïmplementeerd — Yasid heeft staffeldata niet gegeven')
row('M1', 'Prijs/m² rood/groen indicator (brutowinstmarge)',
  pricePerM2.includes('KOSTENRATIO_PER_M2') && pricePerM2.includes('245'))
row('M1', 'Dakpan/lei/sandwichpaneel cascade met foto',
  dakbekledingSelector.includes('VariantThumb') && dakbekledingSelector.includes('getVariantPhoto'))
row('M1', 'Technische fiche bij dakbekleding', false, 'NIET geïmplementeerd — Yasid: "volgt later"')
row('M1', 'Subtotalen per subcategorie',
  calculator.includes('groupSubtotals') && calculator.includes('SubtotalBreakdown'))
row('M1', '7-day korting default',
  discountControl.includes('conditionDays') || fs.readFileSync('./src/store/quote-store.ts', 'utf8').includes('DEFAULT_DISCOUNT_DAYS = 7'))
row('M1', 'Niets-vergeten checklist (buildChecklist genereert errors)',
  checklistLib.includes('buildChecklist') && checklistLib.includes('hasBlockingErrors'))

/* ════════════════════════════════════════════════════════════════════ */
/* MAIL 4 — Yasid: filteropties + sub-opties RAL/merk/dimensie          */
/* Daryl heeft veel hiervan OVERRULED — check laatste status            */
/* ════════════════════════════════════════════════════════════════════ */
row('M4', 'Filteropties bovenaan stap 2 + per categorie',
  filterStep.includes('orderedCategories') && filterStep.includes('Filters bij'))
row('M4', 'RAL-picker met alle Classic kleuren',
  ralColors.includes('RAL 7016') && ralColors.includes('RAL 9005'))
row('M4', 'Sub-opties op esthetische afwerking dakkapel',
  itemDetails.includes("'esthetische-afwerking-zijkant-dakkapel': ESTHETISCHE_AFWERKING_FIELDS"))

/* ════════════════════════════════════════════════════════════════════ */
/* MAIL 5 — Yasid: 29 foto's + Stormpan 993 + Vieilli Rood              */
/* ════════════════════════════════════════════════════════════════════ */
const stormpan993Count = dakbekleding.variants.filter((v) => v.type?.includes('Stormpan Pottelberg 993')).length
const vieilliRood = dakbekleding.variants.find((v) => v.color?.includes('Vieilli'))
row('M5', 'Stormpan 993 varianten toegevoegd (3 verwacht)', stormpan993Count >= 3, `${stormpan993Count} variants`)
row('M5', 'Vieilli Rood toegevoegd', !!vieilliRood, vieilliRood?.color ?? '')
const photoCount = (photoMap.match(/'\/dakbekleding\//g) ?? []).length
row('M5', 'Foto mapping voor dakbekleding (>= 29 verwacht)', photoCount >= 29, `${photoCount} foto-mappings`)

/* ════════════════════════════════════════════════════════════════════ */
/* MAIL v2 — Yasid: chronologie, filters, prijscontrole                 */
/* ════════════════════════════════════════════════════════════════════ */
const hellendFlags = catalog.optionalFlags.map((f) => f.id)
row('Mv2', 'GEEN standaard-dakwerk filter (verwijderd)',
  !hellendFlags.includes('standaard-dakwerk'))
row('Mv2', 'Bakgoten + hanggoten verborgen filter',
  filterStep.includes("'bakgoten-en-hanggoten'") && filterStep.includes('HIDDEN_FLAGS'))
row('Mv2', 'Roofing/EPDM keuze in rubriek (Daryl overrult: zelfs geen filter meer)',
  filterStep.includes("'roofing'") && filterStep.includes("'epdm'"),
  'beide in HIDDEN_FLAGS, DakdichtingKeuze radio toont ze')
row('Mv2', 'Bakgoten dimensies a/b/c/d (Daryl overrult: dim hoogte-diepte)',
  itemDetails.includes('DIMENSIE_COMBO_PER_HOOGTE'))
row('Mv2', 'Prijscontrole rood/groen brutowinstmarge €245/m²',
  pricePerM2.includes('245'))

/* ════════════════════════════════════════════════════════════════════ */
/* DARYL Verdere Aanvulling — RAL + plat dak hout-filter                */
/* ════════════════════════════════════════════════════════════════════ */
row('DVA', 'Crepi-pleister RAL', itemDetails.includes("'gevelafwerking-crepi-siliconenharspleister': RAL_ONLY_FIELDS"))
row('DVA', 'Granietpleister RAL', itemDetails.includes("'granietpleister': RAL_ONLY_FIELDS"))
row('DVA', 'Aludorpels RAL', itemDetails.includes("'aludorpels': RAL_ONLY_FIELDS"))
const houtIds = ['verwijderen-osb-plat-dak', 'verwijderen-kepers-plat-dak', 'verwijderen-gording-plat-dak', 'verwijderen-houtconstructie-integraal', 'leveren-en-plaatsen-gordingen-plat-dak', 'leveren-en-plaatsen-osb-plat-dak']
row('DVA', 'Plat dak hout-filter → 6 items',
  houtIds.every((id) => findItem(id)?.filter?.flagId === 'plat-dak-houtconstructie'))

/* ════════════════════════════════════════════════════════════════════ */
/* DARYL FEEDBACK — grote mail (de allerlaatste, overrult alles)        */
/* ════════════════════════════════════════════════════════════════════ */
const alwaysHellend = ['stelling-valbeveiliging-voorgevel','stelling-valbeveiliging-achtergevel','stelling-valbeveiliging-zijkant-links','stelling-valbeveiliging-zijkant-rechts','afvoeren-werfpuin','afvoeren-werfpuin-toxisch-afval','panlatten-op-panafstand-hechten-op-het-onderdak','esthetische-afwerking-hellende-dakrand-zijkant-m','onderdak','nokpan','gevelpan','noordbomen']
row('DF', '12 hellend-dak basis items in ALWAYS_VISIBLE_ITEMS', alwaysHellend.every((id) => alwaysVisible.includes(`'${id}'`)))
row('DF', 'multipleChoice groups verwijderen-dakbekleding + loodafwerking altijd',
  alwaysVisible.includes("'verwijderen-dakbekleding'") && alwaysVisible.includes("'loodafwerking'"))

const stl = findItem('stelling-valbeveiliging-voorgevel')
row('DF', 'Stelling-hint weg', !stl?.hint)

row('DF', 'Strippen bakgoten — sub-opties weg',
  /['"]strippen-bakgoten['"]:\s*\[\s*\]/.test(itemDetails))

const werf = catalog.categories.find((c) => c.id === 'hellend-dak').subcategories.find((s) => s.id === 'werfinstallatie-afbraak')
const lastIds = werf.items.slice(-2).map((it) => it.id)
row('DF', 'Afvoeren werfpuin + toxisch achteraan werfinstallatie',
  lastIds.includes('afvoeren-werfpuin') && lastIds.includes('afvoeren-werfpuin-toxisch-afval'))

const noMc = !catalog.multipleChoiceGroups.find((g) => g.id === 'afvoeren-afval')
const awp = findItem('afvoeren-werfpuin')
row('DF', 'Afvoeren APART (jaNee toggles, geen multipleChoice)',
  noMc && awp?.unit === 'jaNee' && awp?.filter?.kind === 'always')

const bbg = findItem('buitenbekleding-bakgoot')
row('DF', 'Buitenbekleding bakgoot → unit lm', bbg?.unit === 'lm')
row('DF', 'Buitenbekleding bakgoot — bakgoot-hoogte + dim hoogte-diepte',
  itemDetails.includes("key: 'bakgoot-hoogte'") && !itemDetails.includes("key: 'bakgoot-breedte'") && itemDetails.includes("key: 'dimensie-hoogte-diepte'"))

row('DF', 'Esthetische afwerking oversteken — oversteek-hoogte + dim',
  itemDetails.includes('ESTHETISCHE_OVERSTEKEN_FIELDS'))

row('DF', 'Panlatten op panafstand — m²', findItem('panlatten-op-panafstand-hechten-op-het-onderdak')?.unit === 'm2')

row('DF', 'Nieuwe bakgoot timmeren — geen merk/RAL, hoogte+dim',
  itemDetails.includes("'nieuwe-bakgoot-timmeren': BAKGOTEN_NIEUW_FIELDS"))

row('DF', 'Nieuwe oversteken timmeren — geen merk/RAL/plaat-dim + diepte cm',
  itemDetails.includes("'nieuwe-oversteken-timmeren-toekomstige-gevelisol': OVERSTEKEN_NIEUW_FIELDS") && itemDetails.includes("key: 'diepte-cm'"))

const ond = findItem('onderdak')
row('DF', 'Onderdak hint = A+++ zinnetje', /A\+\+\+/.test(ond?.hint ?? ''))

const nokpan = findItem('nokpan')
row('DF', 'Nokpan unit lm + "geventileerde ondernok"',
  nokpan?.unit === 'lm' && nokpan?.hint?.includes('geventileerde ondernok'))

row('DF', 'DakbekledingSelector TUSSEN onderdak en nokpan',
  configurator.includes("itemId: 'onderdak'") && configurator.includes('<DakbekledingSelector />') && !configurator.includes('{showCoverSelector && <DakbekledingSelector />}'))

row('DF', '"Monteren bestaande zonnepanelen"',
  findItem('monteren-zonnepanelen')?.label === 'Monteren bestaande zonnepanelen')

row('DF', 'Esthetische afwerking schouw — Beschrijving tekstveld',
  /'estetische-afwerking-schouw':\s*\[[\s\S]*?Beschrijving/.test(itemDetails))

row('DF', 'Voegwerk/Verhogen/Restoratie schouw als items + €65/pp regie',
  !!findItem('voegwerk-schouw') && !!findItem('verhogen-schouw') && !!findItem('restoratie-schouw') && findItem('voegwerk-schouw')?.hint?.includes('65') && findItem('voegwerk-schouw')?.hint?.toLowerCase().includes('regie'))

const vg = findItem('verholen-goten')
row('DF', 'Verholen goten — hint weg + ja/nee keuze',
  !vg?.hint && /'verholen-goten':\s*\[\s*{\s*kind:\s*'select'/.test(itemDetails))

row('DF', 'Gootstukken → "Nieuw - gootstuk Velux"',
  findItem('gootstukken')?.label === 'Nieuw - gootstuk Velux')

row('DF', 'Verluchtingspaddestoel — hint weg', !findItem('verluchtingspaddestoel')?.hint)

const dd = findItem('dakdoorvoer')
row('DF', 'Dakdoorvoer — Sanitair/Gasketel + zinnetje',
  itemDetails.includes("'Sanitair'") && itemDetails.includes("'Gasketel'") && dd?.hint?.toLowerCase().includes('aangeleverd') && dd?.hint?.toLowerCase().includes('energylux'))

row('DF', 'Zinken hanggoot — materiaal/vorm/kleur/aantal/tekst',
  itemDetails.includes("'leveren-en-plaatsen-zinken-hanggoot': HANGGOOT_AFVOER_FIELDS") && itemDetails.includes("'Antrazink'") && itemDetails.includes("'Koper'"))

row('DF', 'Plaatsen bestaande hanggoot — lowercase',
  findItem('plaatsen-bestaande-hanggoot')?.label === 'Plaatsen bestaande hanggoot')

row('DF', 'Afvoerbuizen hellend dak — extra info',
  itemDetails.includes("'afvoerbuizen': HANGGOOT_AFVOER_FIELDS"))

row('DF', '"Renovatie-project" heading', detailStep.includes('Renovatie-project'))

row('DF', 'Zonnepanelen checklist (3 supplementen 20/25/12%)',
  checklists.includes('CHECKLIST_ZONNEPANELEN') && checklists.includes('percentage: 20') && checklists.includes('percentage: 25') && checklists.includes('percentage: 12'))

row('DF', 'Nieuwe oversteek timmeren bug — filter:optional:oversteken',
  findItem('nieuwe-oversteek-timmeren-basis-nieuwe-bekleding')?.filter?.flagId === 'oversteken')

row('DF', 'Belemmering-checklist onder werfinstallatie/afbraak rubriek',
  configurator.includes("'werf-belemmering'") && configurator.includes("'werfinstallatie-afbraak'"))

row('DF', 'Gevelwerken ventilatie — expliciete ja/nee + blocking',
  checklists.includes('requiresYesNo: true') && checklistLib.includes('gevel-ventilatie-incomplete'))

row('DF', 'Aluminium profiel → lm',
  findItem('aluminium-profiel-op-maat-voor-de-raampartijen-g')?.unit === 'lm')

const pd = catalog.categories.find((c) => c.id === 'plat-dak')
row('DF', 'Plat dak — 5 sub-rubrieken',
  ['werfinstallatie','isolatiewerken','ambachtelijk-timmerwerk','dakdichtingswerken','lood-en-zinkwerken'].every((id) => pd.subcategories.find((s) => s.id === id)))

row('DF', 'Stelling bij plat dak (cross-category render)',
  alwaysVisible.includes("'plat-dak': new Set([...STELLING_ITEM_IDS])") && configurator.includes('showStellingInPlatDak'))

row('DF', 'Plat dak altijd: verwijderen bestaande roofing + kiezelsteen',
  findItem('verwijderen-bestaande-roofing')?.filter?.kind === 'always' && findItem('verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')?.filter?.kind === 'always')

row('DF', 'Kiezelsteen — hint weg (minimum intern blijft)',
  !findItem('verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')?.hint && findItem('verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')?.minimumPrice === 1500)

row('DF', 'Verwijderen dekstenen — terugplaatsen/vernieuwen + lm',
  findItem('verwijderen-dekstenen')?.unit === 'lm' && itemDetails.includes("'Terugplaatsen'") && itemDetails.includes("'Vernieuwen'"))

row('DF', 'Plat dak Hout/Timmerwerk — SLS-hout altijd',
  findItem('leveren-en-plaatsen-sls-hout-ophoging-dakrand')?.filter?.kind === 'always')

row('DF', 'Plat dak Hout/Timmerwerk — Esthetische afwerking dakrand altijd',
  findItem('esthetische-afwerking-dakrand')?.filter?.kind === 'always')

row('DF', 'Plat dak isolatie achter filter — dampscherm + PIR 10/12/14',
  !!findItem('plat-dak-dampscherm') && !!findItem('plat-dak-pir-10cm') && !!findItem('plat-dak-pir-12cm') && !!findItem('plat-dak-pir-14cm'))

row('DF', 'Koepel-items achter koepel-filter',
  ['bestaande-koepel-verwijderen-voor-vernieuwing','leveren-nieuwe-koepel','plaatsen-nieuwe-koepel-tem-90-cm','plaatsen-nieuwe-koepel-90cm','ophoging-koepel'].every((id) => findItem(id)?.filter?.flagId === 'plat-dak-lichtkoepel'))

row('DF', 'EPDM-tapgat verschijnt bij EPDM-keuze',
  findItem('leveren-en-plaatsen-epdm-tapgat')?.filter?.flagId === 'epdm')
row('DF', 'Roofing-tapgat verschijnt bij Roofing-keuze',
  findItem('leveren-en-plaatsen-roofing-tapgat')?.filter?.flagId === 'roofing')

const pdAfvoer = pd.subcategories.find((s) => s.id === 'lood-en-zinkwerken').items.find((it) => it.id === 'leveren-en-plaatsen-afvoerbuis')
row('DF', 'Plat dak afvoerbuis ALTIJD zichtbaar + extra info',
  pdAfvoer?.filter?.kind === 'always' && itemDetails.includes("'leveren-en-plaatsen-afvoerbuis': HANGGOOT_AFVOER_FIELDS"))

const pdLood = pd.subcategories.find((s) => s.id === 'lood-en-zinkwerken').items.find((it) => it.id === 'loodafwerking-schouw')
row('DF', 'Loodafwerking schouw plat dak — stuk', pdLood?.unit === 'stuk')

row('DF', 'EIND-checklist +20% bij 1 aanvink',
  checklists.includes('CHECKLIST_EIND') && checklists.includes('percentage: 20') && checklists.includes('groupRule:') && calculator.includes('eindChecklistAmount'))

row('DF', 'Prijsvermeerderingen op subtotal BTW excl',
  calculator.includes('itemsSubtotal') && calculator.includes('percentageOfSubtotal'))

/* ════════════════════════════════════════════════════════════════════ */
/* Rapport                                                              */
/* ════════════════════════════════════════════════════════════════════ */
const groups = {}
for (const r of out) {
  if (!groups[r.mail]) groups[r.mail] = []
  groups[r.mail].push(r)
}

const MAIL_LABELS = {
  M1: '── MAIL 1 (Yasid, eerste requirements) ──',
  M4: '── MAIL 4 (Yasid, filteropties + sub-opties) ──',
  M5: '── MAIL 5 (Yasid, foto\'s + Stormpan 993 + Vieilli) ──',
  Mv2: '── MAIL v2 (Yasid 4 juni) ──',
  DVA: '── DARYL Verdere Aanvulling ──',
  DF: '── DARYL FEEDBACK (grote mail, overrult vorige) ──',
}

console.log('═══ ALLE MAILS — volledige audit (laatste mail wint bij conflict) ═══\n')
let ok = 0, fail = 0
for (const key of ['M1','M4','M5','Mv2','DVA','DF']) {
  console.log(MAIL_LABELS[key])
  for (const r of groups[key] ?? []) {
    console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.label + (r.note ? '  [' + r.note + ']' : ''))
    if (r.ok) ok++; else fail++
  }
  console.log()
}
console.log('═══ TOTAAL: ' + ok + ' OK / ' + fail + ' niet/wachten op input ═══')
