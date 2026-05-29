import { useQuoteStore } from '@/store/quote-store'
import { Toggle } from '@/components/ui/Toggle'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { calculateLineTotal } from '@/lib/calculator'
import { formatEuro, formatUnit } from '@/lib/format'
import type { LineItemDef, OptionalFlagDef } from '@/types/quote'

type FlagBundle = {
  flag: OptionalFlagDef
  items: LineItemDef[]
}

export function OptionalFlagsSection({ flags }: { flags: FlagBundle[] }) {
  const activeFlags = useQuoteStore((s) => s.flags)
  const quantities = useQuoteStore((s) => s.quantities)
  const toggleFlag = useQuoteStore((s) => s.toggleFlag)
  const setQuantity = useQuoteStore((s) => s.setQuantity)

  if (flags.length === 0) return null

  return (
    <div>
      <div className="space-y-3">
        {flags.map(({ flag, items }) => {
          const enabled = Boolean(activeFlags[flag.id])
          return (
            <div
              key={flag.id}
              className="rounded-lg border border-ink-100 bg-white overflow-hidden"
            >
              <div className="p-4">
                <Toggle
                  checked={enabled}
                  onChange={(v) => toggleFlag(flag.id, v)}
                  label={flag.label}
                  description={flag.description}
                  id={`flag-${flag.id}`}
                />
              </div>
              {enabled && (
                <div className="border-t border-ink-100 bg-surface-muted/40 px-4 py-3 space-y-2">
                  {items.map((item) => {
                    const qty = quantities[item.id] ?? 0
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-ink-900">{item.label}</div>
                          <div className="text-xs text-ink-500">
                            {item.unitPrice !== null
                              ? `${formatEuro(item.unitPrice)} / ${formatUnit(item.unit)}`
                              : (item.priceNote ?? 'Prijs volgt')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <QuantityInput
                            value={qty}
                            onChange={(next) => setQuantity(item.id, next)}
                            unit={item.unit}
                          />
                          <div className="text-right min-w-[80px]">
                            <div className="text-sm font-semibold text-ink-900 tabular-nums">
                              {qty > 0 && item.unitPrice !== null
                                ? formatEuro(calculateLineTotal(item, qty))
                                : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
