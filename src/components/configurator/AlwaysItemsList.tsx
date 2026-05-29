import { useQuoteStore } from '@/store/quote-store'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { formatEuro, formatUnit } from '@/lib/format'
import type { LineItemDef } from '@/types/quote'
import { calculateLineTotal } from '@/lib/calculator'

type Props = {
  title: string
  items: LineItemDef[]
}

export function AlwaysItemsList({ title, items }: Props) {
  const quantities = useQuoteStore((s) => s.quantities)
  const setQuantity = useQuoteStore((s) => s.setQuantity)

  if (items.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
        {title}
      </h4>
      <div className="divide-y divide-ink-100 border border-ink-100 rounded-lg overflow-hidden bg-white">
        {items.map((item) => {
          const qty = quantities[item.id] ?? 0
          const lineTotal = calculateLineTotal(item, qty)
          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-surface-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-900">{item.label}</div>
                {item.hint && (
                  <div className="text-xs text-ink-400 mt-0.5 leading-snug">{item.hint}</div>
                )}
                <div className="text-xs text-ink-500 mt-1">
                  {item.unitPrice !== null
                    ? `${formatEuro(item.unitPrice)} / ${formatUnit(item.unit)}`
                    : (item.priceNote ?? 'Prijs volgt')}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <QuantityInput
                  value={qty}
                  onChange={(next) => setQuantity(item.id, next)}
                  unit={item.unit}
                />
                <div className="text-right min-w-[88px]">
                  <div className="text-sm font-semibold text-ink-900 tabular-nums">
                    {qty > 0 && item.unitPrice !== null ? formatEuro(lineTotal) : '—'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
