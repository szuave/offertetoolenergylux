/* eslint-disable no-console */
import fs from 'fs'

const catalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'))

// Hand-import van filter-mappings (script kan geen ts importeren)
const SUBCATEGORY_FLAG = {
  'isolatiewerken-sarking': 'sarking',
  'isolatiewerken-binnenkant': 'isolatie-warme-dakzijde',
}
const ITEM_FLAG_OVERRIDE = {
  'gyprocwerken-schildersklaar': 'gyproc-zolder',
  'levering-isolatiematerialen-zolderluik': 'gyproc-zolder',
}

console.log('═══ FILTER → DETAIL audit ═══\n')

// Per categorie + per filter — welke items verschijnen?
for (const cat of catalog.categories) {
  console.log(`\n━━━━━━ ${cat.label.toUpperCase()} ━━━━━━`)

  // Alle filter-ids die in deze categorie iets activeren
  const filterIds = new Set()
  for (const sub of cat.subcategories) {
    const sFlag = SUBCATEGORY_FLAG[sub.id]
    if (sFlag) filterIds.add(sFlag)
    for (const item of sub.items) {
      if (item.filter.kind === 'optional') filterIds.add(item.filter.flagId)
      if (ITEM_FLAG_OVERRIDE[item.id]) filterIds.add(ITEM_FLAG_OVERRIDE[item.id])
    }
  }

  for (const filterId of [...filterIds].sort()) {
    const flagDef = catalog.optionalFlags.find((f) => f.id === filterId)
    const flagLabel = flagDef?.label ?? filterId
    console.log(`\n  ► Filter "${flagLabel}" [${filterId}]`)

    // Simuleer: alleen deze filter staat aan, rest uit
    const flags = { [filterId]: true }

    let totalItems = 0
    for (const sub of cat.subcategories) {
      const sFlag = SUBCATEGORY_FLAG[sub.id]
      const subActive = sFlag === undefined ? true : flags[sFlag] === true

      const hasOptionalItems = sub.items.some((it) => it.filter.kind === 'optional')
      const subHasActiveFilter =
        (sFlag !== undefined && flags[sFlag] === true) ||
        sub.items.some(
          (it) => it.filter.kind === 'optional' && flags[it.filter.flagId],
        ) ||
        !hasOptionalItems

      const visible = []
      for (const item of sub.items) {
        const override = ITEM_FLAG_OVERRIDE[item.id]
        if (override) {
          if (!flags[override]) continue
        } else if (!subActive) {
          continue
        }

        if (item.filter.kind === 'always') {
          if (!subHasActiveFilter && !override) continue
          visible.push(`     · ${item.label} [always]`)
        } else if (item.filter.kind === 'optional') {
          if (!flags[item.filter.flagId]) continue
          visible.push(`     · ${item.label}  ← FILTER MATCH`)
        } else if (item.filter.kind === 'multipleChoice') {
          if (item.filter.groupId === 'dakbekleding') continue
          if (!subHasActiveFilter) continue
          visible.push(`     · ${item.label} [keuze: ${item.filter.groupId}]`)
        }
      }

      if (visible.length > 0) {
        console.log(`   [${sub.label}]`)
        for (const v of visible) console.log(v)
        totalItems += visible.length
      }
    }

    if (totalItems === 0) console.log('     (geen items — filter heeft geen effect?)')
    else console.log(`     → totaal ${totalItems} regels`)
  }
}

console.log('\n═══ EINDE ═══')
