import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { pricingConfig } from '@/data/pricing'
import { useQuoteStore } from '@/store/quote-store'
import {
  isDakpanChosen,
  isDakpanOfLeienChosen,
  isFlagActive,
  isItemActive,
  isSubcategoryActive,
  ITEMS_ALLEEN_BIJ_DAKPAN,
  ITEMS_ALLEEN_BIJ_DAKPAN_OF_LEIEN,
} from '@/lib/calculator'
import { isGroupAlwaysVisible, isItemAlwaysVisible } from '@/data/always-visible'
import { itemFlagOverride, subcategoryFlag } from '@/data/filter-mappings'
import { Card, CardBody } from '@/components/ui/Card'
import { AlwaysItemsList } from '@/components/configurator/AlwaysItemsList'
import { MultipleChoiceSection } from '@/components/configurator/MultipleChoiceSection'
import { SearchResults } from '@/components/configurator/SearchResults'
import { DakbekledingSelector } from '@/components/configurator/DakbekledingSelector'
import { cn } from '@/lib/cn'
import type { CategoryDef, FlagMap, LineItemDef } from '@/types/quote'

// De keuze "Nieuwe dakbekleding" wordt afgehandeld door de eigen
// DakbekledingSelector (cascading dropdown). De oude multipleChoice-stubs
// uit de prijslijst-Excel verbergen we hier.
const COVER_GROUP_ID = 'dakbekleding'

export function ConfiguratorPanel() {
  const { quantities, groupSelections, flags, categoryScope, cover } = useQuoteStore(
    useShallow((s) => ({
      quantities: s.quantities,
      groupSelections: s.groupSelections,
      flags: s.flags,
      categoryScope: s.categoryScope,
      cover: s.cover,
    })),
  )

  // Enkel de categorieën die de verkoper in stap 2 aangevinkt heeft.
  const visibleCategories = useMemo(
    () => pricingConfig.categories.filter((c) => categoryScope[c.id] === true),
    [categoryScope],
  )

  const [activeId, setActiveId] = useState(visibleCategories[0]?.id ?? '')
  const [query, setQuery] = useState('')

  // Sync — als de gekozen tab nu buiten scope valt, terugvallen op de eerste.
  if (
    visibleCategories.length > 0 &&
    !visibleCategories.some((c) => c.id === activeId)
  ) {
    setActiveId(visibleCategories[0]!.id)
  }

  // Aantal actieve lijnposten per categorie — toont de verkoper waar al
  // iets geconfigureerd is, ook al staat die tab niet open.
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of visibleCategories) {
      let n = 0
      for (const sub of cat.subcategories) {
        for (const item of sub.items) {
          if (
            isItemActive(item, { quantities, groupSelections, flags, cover }) &&
            (quantities[item.id] ?? 0) > 0
          ) {
            n++
          }
        }
      }
      counts[cat.id] = n
    }
    return counts
  }, [visibleCategories, quantities, groupSelections, flags])

  const active = visibleCategories.find((c) => c.id === activeId) ?? visibleCategories[0]

  if (visibleCategories.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-sm text-ink-mid">
          Geen categorie aangevinkt in stap 2.
        </CardBody>
      </Card>
    )
  }

  function switchCategory(id: string) {
    setActiveId(id)
    setQuery('')
  }

  return (
    <div className="space-y-4">
      {/* Categorie-tabs — enkel zichtbaar als er meer dan één scope is. */}
      {visibleCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleCategories.map((cat) => {
            const isActive = cat.id === active?.id
            const count = countsByCategory[cat.id] ?? 0
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => switchCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-surface text-ink border-rule hover:border-ink',
                )}
              >
                {cat.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-semibold',
                      isActive ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Zoekbalk */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Zoek in ${active?.label ?? 'werken'}…`}
          className="w-full h-11 rounded-lg border border-rule bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Zoekopdracht wissen"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {active &&
        (query.trim() ? (
          <Card>
            <CardBody>
              <SearchResults category={active} query={query} />
            </CardBody>
          </Card>
        ) : (
          <CategoryConfigurator
            category={active}
            flags={flags}
            quantities={quantities}
            cover={cover}
          />
        ))}
    </div>
  )
}

function CategoryConfigurator({
  category,
  flags,
  quantities,
  cover,
}: {
  category: CategoryDef
  flags: FlagMap
  quantities: Record<string, number>
  cover: { variantId: string | null; areaM2: number }
}) {
  const showCoverSelector = category.id === 'hellend-dak'
  const dakpanGekozen = isDakpanChosen({ cover })
  const dakpanOfLeienGekozen = isDakpanOfLeienChosen({ cover })

  // Per subcategorie filteren we wat zichtbaar is op basis van de filteropties
  // uit stap 2 — items in Excel-volgorde, basis-items en flag-items door elkaar
  // zoals ze in de Excel staan (Yasid's mail 4).
  const renderedSubs = category.subcategories
    .map((sub) => {
      const subActive = isSubcategoryActive(sub.id, flags)

      // Conform Yasid's eis: enkel items van aangeduide filters tonen.
      // Basis-items ("always") verschijnen pas als er minstens één filter
      // in deze rubriek aanstaat, of als de rubriek géén filters heeft
      // (pure-basis zoals Gevelwerken — werkt op categorie-niveau alleen),
      // of als verkoper er al een hoeveelheid voor invulde.
      const subFlag = subcategoryFlag(sub.id)
      const hasOptionalItems = sub.items.some((it) => it.filter.kind === 'optional')
      const subHasActiveFilter =
        (subFlag !== null && flags[subFlag] === true) ||
        sub.items.some(
          (it) => it.filter.kind === 'optional' && isFlagActive(it.filter.flagId, flags),
        ) ||
        !hasOptionalItems

      const visibleItems: LineItemDef[] = []
      const multipleChoiceItems = new Map<string, LineItemDef[]>()

      for (const item of sub.items) {
        // Daryl 4 juni: bepaalde items moeten ALTIJD zichtbaar zijn binnen
        // de scope — onafhankelijk van filters of dakbekleding-keuze.
        const isAlwaysVisible = isItemAlwaysVisible(item.id, category.id)

        // Item met eigen filter-override (bv. gyproc-zolder) staat los van
        // de subcategorie-filter.
        const override = itemFlagOverride(item.id)
        if (!isAlwaysVisible) {
          if (override) {
            if (!flags[override]) continue
          } else if (!subActive) {
            continue
          }

          // Yasid Excel: Onderdak alleen tonen bij dakpan/leien-keuze;
          // (geldt niet als het item in ALWAYS_VISIBLE_ITEMS staat).
          if (ITEMS_ALLEEN_BIJ_DAKPAN_OF_LEIEN.has(item.id) && !dakpanOfLeienGekozen) {
            continue
          }
          if (ITEMS_ALLEEN_BIJ_DAKPAN.has(item.id) && !dakpanGekozen) {
            continue
          }
        }

        if (item.filter.kind === 'always') {
          const hasQty = (quantities[item.id] ?? 0) > 0
          if (!isAlwaysVisible && !subHasActiveFilter && !hasQty && !override) continue
          visibleItems.push(item)
        } else if (item.filter.kind === 'optional') {
          if (isAlwaysVisible) {
            visibleItems.push(item)
            continue
          }
          // Dakpan-toebehoren wordt automatisch geactiveerd door de
          // dakpan-keuze, niet door een aparte filter-toggle.
          if (item.filter.flagId === 'dakpan-toebehoren') {
            if (!dakpanGekozen) continue
            visibleItems.push(item)
            continue
          }
          if (!isFlagActive(item.filter.flagId, flags)) continue
          visibleItems.push(item)
        } else if (item.filter.kind === 'multipleChoice') {
          if (item.filter.groupId === COVER_GROUP_ID) continue
          // Daryl 4 juni: bepaalde multipleChoice groepen (verwijderen-
          // dakbekleding, loodafwerking) zijn altijd zichtbaar bij hellend
          // dak — ook zonder filter aan.
          const groupAlwaysVisible = isGroupAlwaysVisible(
            item.filter.groupId,
            category.id,
          )
          if (!groupAlwaysVisible && !subHasActiveFilter) continue
          const list = multipleChoiceItems.get(item.filter.groupId) ?? []
          list.push(item)
          multipleChoiceItems.set(item.filter.groupId, list)
        }
      }

      if (visibleItems.length === 0 && multipleChoiceItems.size === 0) return null

      return { sub, visibleItems, multipleChoiceItems }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <div className="space-y-6">
      {showCoverSelector && <DakbekledingSelector />}

      {renderedSubs.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8 text-sm text-ink-mid">
            Geen werken zichtbaar voor deze categorie.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-8">
            {renderedSubs.map(({ sub, visibleItems, multipleChoiceItems }) => (
              <section key={sub.id} className="space-y-6">
                <h3 className="font-display text-base font-bold text-ink border-b border-rule pb-2">
                  {sub.label}
                </h3>

                <AlwaysItemsList items={visibleItems} />

                {pricingConfig.multipleChoiceGroups
                  .filter((g) => g.id !== COVER_GROUP_ID && multipleChoiceItems.has(g.id))
                  .map((group) => (
                    <MultipleChoiceSection
                      key={group.id}
                      group={group}
                      items={multipleChoiceItems.get(group.id) ?? []}
                    />
                  ))}
              </section>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
