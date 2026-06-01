/* eslint-disable no-console */
import fs from 'fs'

const path = './src/data/catalog.json'
const catalog = JSON.parse(fs.readFileSync(path, 'utf8'))

const removed = []

/* Fix 1: "Verwijderen sidings buur ... plat dak" weghalen uit Hellend Dak Sarking */
const FIX1_ID = 'verwijderen-sidings-buur-om-isolatie-plat-dak-en'

/* Fix 2: tweede "Ventilatieroosters" in Gevelwerken weg */
const FIX2_ID = 'ventilatieroosters-2'

/* Fix 3: hele "Lood - En Zinkwerken" sub-rubriek in Plat Dak weg
   (8 items die al in de Plat Dak hoofdrubriek staan).
   We bewaren de uniciteit van afvoerbuis (€57/lm) door die te
   verplaatsen naar de hoofdrubriek met een hernoemd label. */
const PD_LOOD_ZINK_SUB_ID = 'lood-en-zinkwerken'  // in cat plat-dak

for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    sub.items = sub.items.filter((it) => {
      if (cat.id === 'hellend-dak' && it.id === FIX1_ID) {
        removed.push(`fix1: [${cat.id}/${sub.id}] ${it.label}`)
        return false
      }
      if (cat.id === 'gevelwerken' && it.id === FIX2_ID) {
        removed.push(`fix2: [${cat.id}/${sub.id}] ${it.label}`)
        return false
      }
      return true
    })
  }
}

// Fix 3: verplaats afvoerbuis-€57 naar hoofdrubriek met label-onderscheid,
// daarna verwijder de hele subrubriek.
const platDak = catalog.categories.find((c) => c.id === 'plat-dak')
if (platDak) {
  const lzSub = platDak.subcategories.find((s) => s.id === PD_LOOD_ZINK_SUB_ID)
  const main = platDak.subcategories.find((s) => s.id === 'plat-dak')
  if (lzSub && main) {
    const afvoerbuis = lzSub.items.find((it) => it.id === 'leveren-en-plaatsen-afvoerbuis-2')
    if (afvoerbuis) {
      // Hernoem zodat de verkoper het verschil ziet
      afvoerbuis.label = 'Leveren en plaatsen afvoerbuis (zware uitvoering)'
      main.items.push(afvoerbuis)
      removed.push(`fix3: afvoerbuis-€57 verplaatst naar hoofdrubriek met label-onderscheid`)
    }
    // Tel duplicaten die weggaan
    for (const it of lzSub.items) {
      if (it.id === 'leveren-en-plaatsen-afvoerbuis-2') continue
      removed.push(`fix3: [${platDak.id}/${lzSub.id}] ${it.label} (duplicaat hoofdrubriek)`)
    }
    // Subrubriek volledig weg
    platDak.subcategories = platDak.subcategories.filter((s) => s.id !== PD_LOOD_ZINK_SUB_ID)
  }
}

fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n')

console.log(`✓ ${removed.length} wijzigingen toegepast:`)
for (const r of removed) console.log('   ·', r)
