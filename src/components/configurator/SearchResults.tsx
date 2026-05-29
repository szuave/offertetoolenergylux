import { useQuoteStore } from '@/store/quote-store'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { calculateLineTotal } from '@/lib/calculator'
import { formatEuro, formatUnit } from '@/lib/format'
import type { CategoryDef, LineItemDef } from '@/types/quote'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

type Match = { item: LineItemDef; subcategoryLabel: string }

function findMatches(category: CategoryDef, query: string): Match[] {
  const q = normalize(query.trim())
  if (!q) return []
  const terms = q.split(/\s+/)
  const matches: Match[] = []
  for (const sub of category.subcategories) {
    for (const item of sub.items) {
      const haystack = normalize(`${item.label} ${sub.label} ${item.hint ?? ''}`)
      if (terms.every((t) => haystack.includes(t))) {
        matches.push({ item, subcategoryLabel: sub.label })
      }
    }
  }
  return matches
}

export function SearchResults({ category, query }: { category: CategoryDef; query: string }) {
  const matches = findMatches(category, query)

  if (matches.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-rule bg-surface-muted p-6 text-center text-sm text-ink-mid">
        Geen resultaten voor “{query}” in {category.label}.
      </div>
    )
  }

  return (
    <div>
      <div className="text-xs text-ink-mid mb-3">
        {matches.length} resulta{matches.length === 1 ? 'at' : 'ten'} voor “{query}”
      </div>
      <div className="divide-y divide-rule border border-rule rounded-sm bg-surface">
        {matches.map(({ item, subcategoryLabel }) => (
          <SearchRow key={item.id} item={item} subcategoryLabel={subcategoryLabel} />
        ))}
      </div>
    </div>
  )
}

function SearchRow({ item, subcategoryLabel }: Match) {
  const qty = useQuoteStore((s) => s.quantities[item.id] ?? 0)
  const setQuantity = useQuoteStore((s) => s.setQuantity)
  const selectMultipleChoice = useQuoteStore((s) => s.selectMultipleChoice)
  const toggleFlag = useQuoteStore((s) => s.toggleFlag)

  function handleChange(next: number) {
    setQuantity(item.id, next)
    if (next > 0) {
      // Activeer automatisch de bijhorende keuze/flag zodat de lijn meetelt.
      if (item.filter.kind === 'multipleChoice') {
        selectMultipleChoice(item.filter.groupId, item.id)
      } else if (item.filter.kind === 'optional') {
        toggleFlag(item.filter.flagId, true)
      }
    }
  }

  const lineTotal = calculateLineTotal(item, qty)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-surface-muted/50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{item.label}</div>
        <div className="text-xs text-ink-mid mt-0.5">
          {subcategoryLabel}
          {' · '}
          {item.unitPrice !== null
            ? `${formatEuro(item.unitPrice)} / ${formatUnit(item.unit)}`
            : (item.priceNote ?? 'Prijs volgt')}
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <QuantityInput value={qty} onChange={handleChange} unit={item.unit} />
        <div className="text-right min-w-[80px]">
          <div className="text-sm font-semibold text-ink tabular-nums">
            {qty > 0 && item.unitPrice !== null ? formatEuro(lineTotal) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
