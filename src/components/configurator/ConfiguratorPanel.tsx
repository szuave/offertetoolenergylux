import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { pricingConfig } from '@/data/pricing'
import { useQuoteStore } from '@/store/quote-store'
import { isItemActive } from '@/lib/calculator'
import { Card, CardBody } from '@/components/ui/Card'
import { AlwaysItemsList } from '@/components/configurator/AlwaysItemsList'
import { MultipleChoiceSection } from '@/components/configurator/MultipleChoiceSection'
import { OptionalFlagsSection } from '@/components/configurator/OptionalFlagsSection'
import { SearchResults } from '@/components/configurator/SearchResults'
import { cn } from '@/lib/cn'
import type { CategoryDef, LineItemDef } from '@/types/quote'

export function ConfiguratorPanel() {
  const [activeId, setActiveId] = useState(pricingConfig.categories[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const { quantities, groupSelections, flags } = useQuoteStore(
    useShallow((s) => ({
      quantities: s.quantities,
      groupSelections: s.groupSelections,
      flags: s.flags,
    })),
  )

  // Aantal actieve lijnposten per categorie — toont de verkoper waar al
  // iets geconfigureerd is, ook al staat die tab niet open.
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of pricingConfig.categories) {
      let n = 0
      for (const sub of cat.subcategories) {
        for (const item of sub.items) {
          // Tel enkel échte lijnen: actief én hoeveelheid > 0 (consistent met
          // resolveLineItems, zodat de badge het aantal lijnen in het overzicht volgt).
          if (
            isItemActive(item, { quantities, groupSelections, flags }) &&
            (quantities[item.id] ?? 0) > 0
          ) {
            n++
          }
        }
      }
      counts[cat.id] = n
    }
    return counts
  }, [quantities, groupSelections, flags])

  const active = pricingConfig.categories.find((c) => c.id === activeId) ?? pricingConfig.categories[0]

  function switchCategory(id: string) {
    setActiveId(id)
    setQuery('')
  }

  return (
    <div className="space-y-4">
      {/* Categorie-tabs */}
      <div className="flex flex-wrap gap-2">
        {pricingConfig.categories.map((cat) => {
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
          <CategoryConfigurator category={active} />
        ))}
    </div>
  )
}

function CategoryConfigurator({ category }: { category: CategoryDef }) {
  // Optionele (Filteroptie) items aggregeren we over de HELE categorie, per flag.
  // Zo verschijnt elke toggle exact één keer onderaan i.p.v. herhaald per
  // subcategorie — dat voorkomt dat de pagina verspringt bij aanvinken.
  const optionalByFlag = new Map<string, LineItemDef[]>()
  for (const sub of category.subcategories) {
    for (const item of sub.items) {
      if (item.filter.kind === 'optional') {
        const list = optionalByFlag.get(item.filter.flagId) ?? []
        list.push(item)
        optionalByFlag.set(item.filter.flagId, list)
      }
    }
  }
  const optionalFlags = pricingConfig.optionalFlags
    .filter((f) => optionalByFlag.has(f.id))
    .map((flag) => ({ flag, items: optionalByFlag.get(flag.id) ?? [] }))

  return (
    <Card>
      <CardBody className="space-y-8">
        {category.subcategories.map((sub) => {
          const alwaysItems: LineItemDef[] = []
          const multipleChoiceItems = new Map<string, LineItemDef[]>()

          for (const item of sub.items) {
            if (item.filter.kind === 'always') {
              alwaysItems.push(item)
            } else if (item.filter.kind === 'multipleChoice') {
              const list = multipleChoiceItems.get(item.filter.groupId) ?? []
              list.push(item)
              multipleChoiceItems.set(item.filter.groupId, list)
            }
          }

          // Subcategorie zonder basis- of keuze-items overslaan (alles zit dan
          // in de gedeelde opties-sectie onderaan).
          if (alwaysItems.length === 0 && multipleChoiceItems.size === 0) return null

          return (
            <section key={sub.id} className="space-y-6">
              <h3 className="font-display text-base font-bold text-ink border-b border-rule pb-2">
                {sub.label}
              </h3>

              <AlwaysItemsList title="Basis" items={alwaysItems} />

              {pricingConfig.multipleChoiceGroups
                .filter((g) => multipleChoiceItems.has(g.id))
                .map((group) => (
                  <MultipleChoiceSection
                    key={group.id}
                    group={group}
                    items={multipleChoiceItems.get(group.id) ?? []}
                  />
                ))}
            </section>
          )
        })}

        {optionalFlags.length > 0 && (
          <section className="space-y-4">
            <h3 className="font-display text-base font-bold text-ink border-b border-rule pb-2">
              Bijkomende opties
            </h3>
            <OptionalFlagsSection flags={optionalFlags} />
          </section>
        )}
      </CardBody>
    </Card>
  )
}
