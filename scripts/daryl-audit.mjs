/* eslint-disable no-console */
/**
 * Volledige Daryl-mail-audit. Loopt elk punt uit de mail af tegen de
 * huidige code en rapporteert ✓ of ✗ met bewijs.
 */
import fs from 'fs'

const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))
const itemDetails = fs.readFileSync('./src/data/item-details.ts', 'utf8')
const checklists = fs.readFileSync('./src/data/checklists.ts', 'utf8')
const calculator = fs.readFileSync('./src/lib/calculator.ts', 'utf8')
const checklistLib = fs.readFileSync('./src/lib/checklist.ts', 'utf8')
const filterStep = fs.readFileSync('./src/components/wizard/FilterStep.tsx', 'utf8')
const detailStep = fs.readFileSync('./src/components/wizard/DetailStep.tsx', 'utf8')
const configurator = fs.readFileSync('./src/components/configurator/ConfiguratorPanel.tsx', 'utf8')
const alwaysVisible = fs.readFileSync('./src/data/always-visible.ts', 'utf8')

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
function findItemByLabel(substr) {
  const hits = []
  for (const cat of catalog.categories) {
    for (const sub of cat.subcategories) {
      for (const it of sub.items) {
        if (it.label.toLowerCase().includes(substr.toLowerCase())) {
          hits.push({ cat: cat.id, sub: sub.id, ...it })
        }
      }
    }
  }
  return hits
}

const results = []
function check(label, ok, detail) {
  results.push({ label, ok, detail })
}

/* --- Verdere aanvulling --- */
check(
  '1. Crepi RAL-sub-optie',
  itemDetails.includes("'gevelafwerking-crepi-siliconenharspleister': RAL_ONLY_FIELDS"),
  '',
)
check(
  '2. Granietpleister RAL',
  itemDetails.includes("'granietpleister': RAL_ONLY_FIELDS"),
  '',
)
check('3. Aludorpels RAL', itemDetails.includes("'aludorpels': RAL_ONLY_FIELDS"), '')

const houtFilterItems = [
  'verwijderen-osb-plat-dak',
  'verwijderen-kepers-plat-dak',
  'verwijderen-gording-plat-dak',
  'verwijderen-houtconstructie-integraal',
  'leveren-en-plaatsen-gordingen-plat-dak',
  'leveren-en-plaatsen-osb-plat-dak',
]
const houtAllOK = houtFilterItems.every((id) => {
  const it = findItem(id)
  return it?.filter?.flagId === 'plat-dak-houtconstructie'
})
check('4. Plat dak hout-filter → 6 items', houtAllOK, '')

/* --- Hellend dak basis-items altijd zichtbaar (Daryl FEEDBACK punt 1) --- */
const alwaysHellend = [
  'stelling-valbeveiliging-voorgevel',
  'stelling-valbeveiliging-achtergevel',
  'stelling-valbeveiliging-zijkant-links',
  'stelling-valbeveiliging-zijkant-rechts',
  'afvoeren-werfpuin',
  'afvoeren-werfpuin-toxisch-afval',
  'panlatten-op-panafstand-hechten-op-het-onderdak',
  'esthetische-afwerking-hellende-dakrand-zijkant-m',
  'onderdak',
  'nokpan',
  'gevelpan',
  'noordbomen',
]
const allInAlwaysVisible = alwaysHellend.every((id) => alwaysVisible.includes(`'${id}'`))
check('5a. Hellend dak alle 12 basis-items in ALWAYS_VISIBLE_ITEMS', allInAlwaysVisible, '')
const groupsOK =
  alwaysVisible.includes("'verwijderen-dakbekleding'") &&
  alwaysVisible.includes("'loodafwerking'")
check(
  '5b. Multiplechoice groups (verwijderen-dakbekleding + loodafwerking) altijd',
  groupsOK,
  '',
)

/* --- Stelling hints weg --- */
const stelling1 = findItem('stelling-valbeveiliging-voorgevel')
check('6. Stelling-hint weg', !stelling1?.hint, `hint=${stelling1?.hint ?? '(geen)'}`)

/* --- Strippen bakgoten geen sub-opties --- */
check(
  '7. Strippen bakgoten — sub-opties weg',
  /['"]strippen-bakgoten['"]:\s*\[\s*\]/.test(itemDetails),
  '',
)

/* --- Volgorde afvoeren werfpuin achteraan --- */
const werf = catalog.categories
  .find((c) => c.id === 'hellend-dak')
  .subcategories.find((s) => s.id === 'werfinstallatie-afbraak')
const lastTwo = werf.items.slice(-2).map((it) => it.id)
const afvoerAchter = lastTwo.includes('afvoeren-werfpuin') &&
  lastTwo.includes('afvoeren-werfpuin-toxisch-afval')
check('8. Afvoeren werfpuin + toxisch ACHTERAAN werfinstallatie', afvoerAchter, '')

/* --- Afvoeren APART (geen multiplechoice) --- */
const afvoerpuin = findItem('afvoeren-werfpuin')
const afvoertoxisch = findItem('afvoeren-werfpuin-toxisch-afval')
const noMultichoice = !catalog.multipleChoiceGroups.find((g) => g.id === 'afvoeren-afval')
const bothJaNee =
  afvoerpuin?.unit === 'jaNee' && afvoertoxisch?.unit === 'jaNee' &&
  afvoerpuin?.filter?.kind === 'always' && afvoertoxisch?.filter?.kind === 'always'
check('9. Afvoeren werfpuin + toxisch APART (jaNee toggles)', noMultichoice && bothJaNee, '')

/* --- Buitenbekleding bakgoot --- */
const bbg = findItem('buitenbekleding-bakgoot')
check('10a. Buitenbekleding bakgoot — unit lm', bbg?.unit === 'lm', '')
const hasBakHoogte = itemDetails.includes("key: 'bakgoot-hoogte'")
const hasOudBreedte = itemDetails.includes("key: 'bakgoot-breedte'")
const hasHoogteDiepte = itemDetails.includes("key: 'dimensie-hoogte-diepte'")
check('10b. Bakgoot-hoogte (geen bakgoot-breedte) + dimensie hoogte-diepte',
  hasBakHoogte && !hasOudBreedte && hasHoogteDiepte, '')

/* --- Esthetische afwerking oversteken --- */
const eo = itemDetails.includes('ESTHETISCHE_OVERSTEKEN_FIELDS')
const eoBindings = itemDetails.includes("'esthetische-afwerking-oversteken': ESTHETISCHE_OVERSTEKEN_FIELDS")
const noOudeOversteken = !/'esthetische-afwerking-oversteken':\s*\[\s*\.\.\.ESTHETISCHE_AFWERKING_FIELDS,\s*\.\.\.OVERSTEKEN_FIELDS/.test(itemDetails)
check('11. Esthetische afwerking oversteken — oversteek-hoogte + dim hoogte-diepte (geen dakrand-breedte)',
  eo && eoBindings && noOudeOversteken, '')

/* --- Panlatten m² --- */
const panl = findItem('panlatten-op-panafstand-hechten-op-het-onderdak')
check('12. Panlatten op panafstand — m²', panl?.unit === 'm2', '')

/* --- Nieuwe bakgoot timmeren --- */
const bnf = itemDetails.includes('BAKGOTEN_NIEUW_FIELDS')
const bnfBound = itemDetails.includes("'nieuwe-bakgoot-timmeren': BAKGOTEN_NIEUW_FIELDS")
check('13. Nieuwe bakgoot timmeren — geen merk/RAL, hoogte+dim hoogte-diepte', bnf && bnfBound, '')

/* --- Nieuwe oversteken timmeren --- */
const onf = itemDetails.includes('OVERSTEKEN_NIEUW_FIELDS')
const dieptCm = itemDetails.includes("key: 'diepte-cm'")
const onfBound = itemDetails.includes("'nieuwe-oversteken-timmeren-toekomstige-gevelisol': OVERSTEKEN_NIEUW_FIELDS")
check('14. Nieuwe oversteken timmeren — geen merk/RAL/plaat-dim, oversteek-hoogte + dim + diepte cm',
  onf && dieptCm && onfBound, '')

/* --- Onderdak hint A+++ --- */
const ond = findItem('onderdak')
check('15. Onderdak hint A+++', /A\+\+\+/.test(ond?.hint ?? ''), `hint=${ond?.hint}`)

/* --- Nokpan lm + zinnetje --- */
const nokpan = findItem('nokpan')
check('16. Nokpan — unit lm + "geventileerde ondernok"',
  nokpan?.unit === 'lm' && nokpan?.hint?.includes('geventileerde ondernok'), '')

/* --- Dakpan tussen onderdak en nokpan --- */
const dakpanPos = configurator.includes("insertAfter") &&
  configurator.includes("itemId: 'onderdak'") &&
  configurator.includes('<DakbekledingSelector />')
const oudDakpanBoven = configurator.includes('{showCoverSelector && <DakbekledingSelector />}')
check('17. DakbekledingSelector tussen onderdak en nokpan (niet bovenaan)',
  dakpanPos && !oudDakpanBoven, '')

/* --- Monteren zonnepanelen rename --- */
const mz = findItem('monteren-zonnepanelen')
check('18. "Monteren bestaande zonnepanelen"', mz?.label === 'Monteren bestaande zonnepanelen', '')

/* --- Esthetische afwerking schouw tekstveld --- */
const esBlock = itemDetails.match(/'estetische-afwerking-schouw':\s*\[([\s\S]*?)\]/)?.[1] ?? ''
check('19. Esthetische afwerking schouw — tekstveld', esBlock.includes('Beschrijving'), '')

/* --- Metselwerk schouw — 3 opties (voegwerk/verhogen/restoratie) + regie 65€/pp --- */
const vsh = findItem('voegwerk-schouw')
const vhr = findItem('verhogen-schouw')
const rsh = findItem('restoratie-schouw')
const allThree = vsh && vhr && rsh
const regieHint = vsh?.hint?.includes('65') && vsh?.hint?.toLowerCase().includes('regie')
check('20. Metselwerk schouw — voegwerk/verhogen/restoratie + 65€/pp regie',
  allThree && regieHint, '')

/* --- Verholen goten — opmerking weg + ja/nee --- */
const vg = findItem('verholen-goten')
const vgJaNee = itemDetails.includes("'verholen-goten':") &&
  itemDetails.match(/'verholen-goten':\s*\[([\s\S]*?)\]/)?.[1]?.includes("'Ja'")
check('21. Verholen goten — hint weg + ja/nee keuze', !vg?.hint && vgJaNee, '')

/* --- Gootstukken rename --- */
const gs = findItem('gootstukken')
check('22. Gootstukken → "Nieuw - gootstuk Velux"', gs?.label === 'Nieuw - gootstuk Velux', '')

/* --- Verluchtingspaddestoel hint weg --- */
const vp = findItem('verluchtingspaddestoel')
check('23. Verluchtingspaddestoel — hint weg', !vp?.hint, `hint=${vp?.hint ?? '(geen)'}`)

/* --- Dakdoorvoer opties + zinnetje --- */
const dd = findItem('dakdoorvoer')
const ddSub = itemDetails.includes("'dakdoorvoer'") && itemDetails.includes("'Sanitair'") && itemDetails.includes("'Gasketel'")
const ddZin = dd?.hint?.toLowerCase().includes('aangeleverd') && dd?.hint?.toLowerCase().includes('energylux')
check('24. Dakdoorvoer — sanitair/gasketel + zinnetje', ddSub && ddZin, `hint=${dd?.hint}`)

/* --- Zinken hanggoot extra info --- */
const haf = itemDetails.includes('HANGGOOT_AFVOER_FIELDS')
const zhf = itemDetails.includes("'leveren-en-plaatsen-zinken-hanggoot': HANGGOOT_AFVOER_FIELDS")
const opts = itemDetails.includes("'Zink'") && itemDetails.includes("'PVC'") &&
  itemDetails.includes("'Rond'") && itemDetails.includes("'Vierkant'") &&
  itemDetails.includes("'Natuurzink'") && itemDetails.includes("'Antrazink'") &&
  itemDetails.includes("'Koper'")
check('25. Zinken hanggoot — materiaal/vorm/kleur/aantal/tekstveld', haf && zhf && opts, '')

/* --- Plaatsen bestaande hanggoot lowercase --- */
const pbh = findItem('plaatsen-bestaande-hanggoot')
check('26. Plaatsen bestaande hanggoot — lowercase',
  pbh?.label === 'Plaatsen bestaande hanggoot', `label=${pbh?.label}`)

/* --- Afvoerbuizen extra info (hellend dak) --- */
const afv = itemDetails.includes("'afvoerbuizen': HANGGOOT_AFVOER_FIELDS")
check('27. Afvoerbuizen (hellend dak) — materiaal/vorm/kleur/aantal/tekstveld', afv, '')

/* --- "Renovatie-project" heading --- */
check('28. Heading "Renovatie-project"',
  detailStep.includes('Renovatie-project'), '')

/* --- Zonnepanelen checklist 3 supplementen --- */
const zp = checklists.includes('CHECKLIST_ZONNEPANELEN') &&
  checklists.includes("percentage: 20") &&
  checklists.includes("percentage: 25") &&
  checklists.includes("percentage: 12")
check('29. Zonnepanelen-checklist (3 cumulatieve supplementen 20/25/12%)', zp, '')

/* --- Nieuwe oversteek timmeren bug --- */
const nob = findItem('nieuwe-oversteek-timmeren-basis-nieuwe-bekleding')
check('30. Nieuwe oversteek timmeren — filter oversteken (bug-fix)',
  nob?.filter?.flagId === 'oversteken', '')

/* --- Belemmering-checklist onder werfinstallatie --- */
const inlineWerf = configurator.includes("'werf-belemmering'") &&
  configurator.includes("'werfinstallatie-afbraak'")
check('31. Belemmering-checklist onder werfinstallatie/afbraak', inlineWerf, '')

/* --- Gevelwerken ventilatie checklist + blocking --- */
const yesNo = checklists.includes('requiresYesNo: true')
const blocking = checklistLib.includes('gevel-ventilatie-incomplete') &&
  checklistLib.includes("severity: 'error'")
check('32a. Gevelwerken-ventilatie expliciete ja/nee', yesNo, '')
check('32b. Gevelwerken-ventilatie BLOCKING (error in checklist.ts)', blocking, '')

/* --- Aluminium profiel LM --- */
const ap = findItem('aluminium-profiel-op-maat-voor-de-raampartijen-g')
check('33. Aluminium profiel — unit lm', ap?.unit === 'lm', '')

/* --- Plat dak 5 rubrieken --- */
const pd = catalog.categories.find((c) => c.id === 'plat-dak')
const subIds = pd.subcategories.map((s) => s.id).join(', ')
const expected5 = ['werfinstallatie', 'isolatiewerken', 'ambachtelijk-timmerwerk', 'dakdichtingswerken', 'lood-en-zinkwerken']
const all5 = expected5.every((id) => pd.subcategories.find((s) => s.id === id))
check('34. Plat dak — 5 sub-rubrieken', all5, subIds)

/* --- Stelling bij plat dak --- */
const stellingPlat = alwaysVisible.includes("'plat-dak': new Set([...STELLING_ITEM_IDS])")
const stellingPlatRender = configurator.includes('showStellingInPlatDak') &&
  configurator.includes('STELLING_ITEM_IDS')
check('35. Stelling-items bij plat dak (zonder hellend)', stellingPlat && stellingPlatRender, '')

/* --- Plat dak altijd: verwijderen roofing + kiezelsteen --- */
const vbr = findItem('verwijderen-bestaande-roofing')
const kiz = findItem('verwijderen-en-afvoeren-kiezelsteen-op-plat-dak')
check('36. Plat dak altijd: verwijderen bestaande roofing',
  vbr?.filter?.kind === 'always', '')
check('36b. Plat dak altijd: verwijderen kiezelsteen',
  kiz?.filter?.kind === 'always', '')

/* --- Kiezelsteen hint weg --- */
check('37. Kiezelsteen — hint weg', !kiz?.hint, `hint=${kiz?.hint ?? '(geen)'}`)

/* --- Verwijderen dekstenen --- */
const ddk = findItem('verwijderen-dekstenen')
const ddkSub = itemDetails.includes("'verwijderen-dekstenen':") &&
  itemDetails.includes("'Terugplaatsen'") && itemDetails.includes("'Vernieuwen'")
check('38. Verwijderen dekstenen — terugplaatsen/vernieuwen + lm',
  ddk?.unit === 'lm' && ddkSub, '')

/* --- SLS-hout altijd --- */
const sls = findItem('leveren-en-plaatsen-sls-hout-ophoging-dakrand')
check('39. SLS-hout — altijd zichtbaar', sls?.filter?.kind === 'always', '')

/* --- Esthetische afwerking dakrand altijd (plat dak) --- */
const ead = findItem('esthetische-afwerking-dakrand')
check('40. Esthetische afwerking dakrand (plat dak) — altijd zichtbaar',
  ead?.filter?.kind === 'always', '')

/* --- Plat dak houtconstructie 6 items in ambachtelijk timmerwerk --- */
const allHout6Filter = houtFilterItems.every((id) => {
  const it = findItem(id)
  return it?.filter?.flagId === 'plat-dak-houtconstructie'
})
check('41. Plat dak — houtconstructie filter → 6 items', allHout6Filter, '')

/* --- Plat dak isolatie altijd bij filter --- */
const dampscherm = findItem('plat-dak-dampscherm')
const pir10 = findItem('plat-dak-pir-10cm')
const pir12 = findItem('plat-dak-pir-12cm')
const pir14 = findItem('plat-dak-pir-14cm')
const isoOK = dampscherm && pir10 && pir12 && pir14 &&
  dampscherm.filter?.flagId === 'plat-dak-isolatie'
check('42. Plat dak isolatie — dampscherm + PIR 10/12/14 (achter filter)', isoOK, '')

/* --- Koepel achter filter --- */
const koepelItems = ['bestaande-koepel-verwijderen-voor-vernieuwing','leveren-nieuwe-koepel','plaatsen-nieuwe-koepel-tem-90-cm','plaatsen-nieuwe-koepel-90cm','ophoging-koepel']
const koepelOK = koepelItems.every((id) => findItem(id)?.filter?.flagId === 'plat-dak-lichtkoepel')
check('43. Koepel-items achter koepel-filter', koepelOK, '')

/* --- Roofing/EPDM keuze in rubriek + tapgat --- */
const hiddenFlags = filterStep.includes("HIDDEN_FLAGS = new Set(") &&
  filterStep.includes("'roofing'") && filterStep.includes("'epdm'")
const dakdichtKeuze = configurator.includes('<DakdichtingKeuze />')
const epdmTap = findItem('leveren-en-plaatsen-epdm-tapgat')
const roofTap = findItem('leveren-en-plaatsen-roofing-tapgat')
check('44a. Roofing/EPDM — geen filter in stap 2 (HIDDEN_FLAGS)', hiddenFlags, '')
check('44b. DakdichtingKeuze radio in plat-dak dakdichtingswerken', dakdichtKeuze, '')
check('44c. EPDM-tapgat verschijnt bij EPDM-keuze (filter:epdm)',
  epdmTap?.filter?.flagId === 'epdm', '')
check('44d. Roofing-tapgat verschijnt bij Roofing-keuze (filter:roofing)',
  roofTap?.filter?.flagId === 'roofing', '')

/* --- Plat dak afvoerbuis altijd --- */
const pdAfvoer = catalog.categories.find((c) => c.id === 'plat-dak')
  .subcategories.find((s) => s.id === 'lood-en-zinkwerken')
  .items.find((it) => it.id === 'leveren-en-plaatsen-afvoerbuis')
check('45. Plat dak afvoerbuis — altijd zichtbaar in lood-zink',
  pdAfvoer?.filter?.kind === 'always', '')
const afvoerbuisSub = itemDetails.includes("'leveren-en-plaatsen-afvoerbuis': HANGGOOT_AFVOER_FIELDS")
check('45b. Plat dak afvoerbuis — materiaal/vorm/kleur/aantal sub-opties',
  afvoerbuisSub, '')

/* --- Loodafwerking schouw plat dak — stuk --- */
const pdLood = catalog.categories.find((c) => c.id === 'plat-dak')
  .subcategories.find((s) => s.id === 'lood-en-zinkwerken')
  .items.find((it) => it.id === 'loodafwerking-schouw')
check('46. Loodafwerking schouw (plat dak) — stuk', pdLood?.unit === 'stuk', '')

/* --- EIND-checklist +20% --- */
const eindOK = checklists.includes('CHECKLIST_EIND') &&
  checklists.includes("percentage: 20") &&
  checklists.includes("groupRule:") &&
  calculator.includes('eindChecklistAmount')
check('47. EIND-checklist +20% bij 1 aanvink', eindOK, '')

/* --- Prijsvermeerderingen op subtotal BTW excl --- */
const onSubtotaal = calculator.includes('itemsSubtotal') &&
  calculator.includes('percentageOfSubtotal')
check('48. Prijsvermeerderingen op subtotal BTW excl', onSubtotaal, '')

/* ---------- Rapport ---------- */
console.log('═══ DARYL-MAIL AUDIT — alle ' + results.length + ' punten ═══\n')
let ok = 0, fail = 0
for (const r of results) {
  console.log((r.ok ? '✓ ' : '✗ ') + r.label + (r.detail ? '  [' + r.detail + ']' : ''))
  if (r.ok) ok++; else fail++
}
console.log('\n═══ ' + ok + ' OK / ' + fail + ' FAIL ═══')
if (fail > 0) process.exitCode = 1
