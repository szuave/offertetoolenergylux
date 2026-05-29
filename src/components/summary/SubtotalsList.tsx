import { formatEuro } from '@/lib/format'
import type { SubtotalBreakdown } from '@/types/quote'

export function SubtotalsList({ subtotals }: { subtotals: SubtotalBreakdown[] }) {
  if (subtotals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm text-ink-500 text-center">
        Nog niets geselecteerd.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {subtotals.map((sub) => (
        <div key={`${sub.categoryId}-${sub.subcategoryId}`}>
          <div className="flex items-baseline justify-between py-1.5">
            <div className="min-w-0">
              <div className="text-xs text-ink-400">{sub.categoryLabel}</div>
              <div className="text-sm font-medium text-ink-900 truncate">
                {sub.subcategoryLabel}
              </div>
            </div>
            <div className="text-sm font-semibold text-ink-900 tabular-nums">
              {formatEuro(sub.amount)}
            </div>
          </div>
          <ul className="ml-3 border-l border-ink-100 pl-3 py-1 space-y-1">
            {sub.items.map((line) => (
              <li key={line.def.id} className="flex justify-between text-xs text-ink-500 gap-2">
                <span className="truncate">{line.def.label}</span>
                <span className="tabular-nums shrink-0">{formatEuro(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
