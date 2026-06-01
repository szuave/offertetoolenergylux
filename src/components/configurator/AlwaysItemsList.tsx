import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { formatEuro, formatUnit } from '@/lib/format'
import type { LineItemDef } from '@/types/quote'
import { calculateLineTotal } from '@/lib/calculator'
import { ItemDetailsForm } from '@/components/configurator/ItemDetailsForm'
import { countMissingDetails, getDetailFields } from '@/data/item-details'

type Props = {
  items: LineItemDef[]
}

export function AlwaysItemsList({ items }: Props) {
  const { quantities, details, setQuantity } = useQuoteStore(
    useShallow((s) => ({
      quantities: s.quantities,
      details: s.details,
      setQuantity: s.setQuantity,
    })),
  )

  if (items.length === 0) return null

  return (
    <ul className="divide-y divide-rule/60">
      {items.map((item) => {
        const qty = quantities[item.id] ?? 0
        const lineTotal = calculateLineTotal(item, qty)
        const hasDetails = getDetailFields(item.id) !== null
        const missing = hasDetails && qty > 0
          ? countMissingDetails(item.id, details[item.id] ?? {})
          : 0
        return (
          <li key={item.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-sm font-medium text-ink">{item.label}</div>
                  {missing > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-warning-bg text-warning">
                      onvolledig
                    </span>
                  )}
                </div>
                {item.hint && (
                  <div className="text-xs text-ink-mid mt-0.5 leading-snug">{item.hint}</div>
                )}
                <div className="text-xs text-ink-muted mt-0.5 tabular-nums">
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
                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-semibold text-ink tabular-nums">
                    {qty > 0 && item.unitPrice !== null ? formatEuro(lineTotal) : '—'}
                  </div>
                </div>
              </div>
            </div>
            {hasDetails && qty > 0 && <ItemDetailsForm itemId={item.id} />}
          </li>
        )
      })}
    </ul>
  )
}
