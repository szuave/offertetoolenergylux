/* eslint-disable no-console */
import fs from 'fs'

const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

const byLabel = new Map()
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const key = it.label.toLowerCase().replace(/[\s-]+/g, ' ').trim()
      if (!byLabel.has(key)) byLabel.set(key, [])
      byLabel.get(key).push({
        cat: cat.id,
        sub: sub.label,
        id: it.id,
        unit: it.unit,
        price: it.unitPrice,
        label: it.label,
        filter: it.filter,
      })
    }
  }
}

console.log('═══ ITEMS DIE >1× VOORKOMEN (mogelijke duplicates/cross-overs) ═══\n')
for (const arr of byLabel.values()) {
  if (arr.length < 2) continue
  console.log('● ' + arr[0].label)
  for (const x of arr) {
    const flag = x.filter.kind === 'optional' ? x.filter.flagId : x.filter.kind
    console.log(`   - [${x.cat} / ${x.sub}] ${x.unit}, €${x.price}  →  ${flag}`)
  }
  console.log()
}

console.log('\n═══ ITEMS MET "PLAT DAK" IN LABEL MAAR NIET IN PLAT-DAK CATEGORIE ═══\n')
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const lbl = it.label.toLowerCase()
      if (cat.id !== 'plat-dak' && lbl.includes('plat dak')) {
        console.log(`⚠ [${cat.id} / ${sub.label}] ${it.label}`)
      }
    }
  }
}

console.log('\n═══ ITEMS MET "GEVEL" IN LABEL MAAR NIET IN GEVELWERKEN ═══\n')
for (const cat of catalog.categories) {
  for (const sub of cat.subcategories) {
    for (const it of sub.items) {
      const lbl = it.label.toLowerCase()
      if (cat.id !== 'gevelwerken' && /\bgevel/.test(lbl)) {
        console.log(`⚠ [${cat.id} / ${sub.label}] ${it.label}`)
      }
    }
  }
}
