import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, selectQuoteState } from '@/store/quote-store'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { formatEuro, formatUnit } from '@/lib/format'
import type { LineItemDef } from '@/types/quote'
import { calculateLineTotal, containerCount } from '@/lib/calculator'
import { ItemDetailsForm } from '@/components/configurator/ItemDetailsForm'
import { countMissingDetails, getDetailFields } from '@/data/item-details'

type Props = {
  items: LineItemDef[]
}

const AUTO_PRICE_ITEMS = new Set([
  'afvoeren-werfpuin',
  'afvoeren-werfpuin-toxisch-afval',
])

export function AlwaysItemsList({ items }: Props) {
  const state = useQuoteStore(useShallow(selectQuoteState))
  const setQuantity = useQuoteStore((s) => s.setQuantity)
  const { quantities, details } = state

  if (items.length === 0) return null

  // Voor de auto-berekende afvoer-items: lijntotaal volgt uit een formule
  // (containerCount × €650 voor werfpuin; m² × €8 min €800 voor toxisch).
  const removedM2 = (() => {
    const REMOVAL_IDS = [
      'verwijderen-dakpannen',
      'verwijderen-asbestleien',
      'verwijderen-asbestonderdak',
      'verwijderen-sandwichpanelen',
      'verwijderen-singles',
    ]
    const chosen = state.groupSelections['verwijderen-dakbekleding']
    return chosen && REMOVAL_IDS.includes(chosen) ? state.quantities[chosen] ?? 0 : 0
  })()

  function autoTotal(itemId: string): { value: number; hint: string } | null {
    if (itemId === 'afvoeren-werfpuin') {
      const c = containerCount(state)
      return {
        value: c * 650,
        hint: `${c} container${c === 1 ? '' : 's'} × €650 (${removedM2} m² dakbekleding ÷ 90)`,
      }
    }
    if (itemId === 'afvoeren-werfpuin-toxisch-afval') {
      const raw = removedM2 * 8
      const total = Math.max(raw, removedM2 > 0 ? 800 : 0)
      return {
        value: total,
        hint: `${removedM2} m² × €8 (minimum €800)`,
      }
    }
    return null
  }

  return (
    <ul className="divide-y divide-rule/60">
      {items.map((item) => {
        const qty = quantities[item.id] ?? 0
        const isAuto = AUTO_PRICE_ITEMS.has(item.id)
        const auto = isAuto && qty > 0 ? autoTotal(item.id) : null
        const lineTotal = auto ? auto.value : calculateLineTotal(item, qty)
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
                  {isAuto
                    ? (auto ? auto.hint : 'Auto-berekend zodra dakbekleding-keuze')
                    : item.unitPrice !== null
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
                    {qty > 0 && (isAuto ? auto && auto.value > 0 : item.unitPrice !== null)
                      ? formatEuro(lineTotal)
                      : '—'}
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
