import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, selectQuoteState } from '@/store/quote-store'
import { Badge } from '@/components/ui/Badge'
import { RadioCard } from '@/components/ui/RadioCard'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { formatEuro, formatUnit } from '@/lib/format'
import { calculateLineTotal, containerCount } from '@/lib/calculator'
import type { LineItemDef, MultipleChoiceGroupDef } from '@/types/quote'

type Props = {
  group: MultipleChoiceGroupDef
  items: LineItemDef[]
}

/**
 * Items waarvoor de hoeveelheid + lijntotaal automatisch berekend wordt
 * uit de gekozen "Verwijderen dakbekleding" m² (Yasid Excel rij 7/8).
 */
const AFVOER_CONTAINER_ID = 'afvoeren-werfpuin'
const AFVOER_TOXISCH_ID = 'afvoeren-werfpuin-toxisch-afval'
const CONTAINER_PRICE = 650
const TOXISCH_PER_M2 = 8
const TOXISCH_MIN = 800

export function MultipleChoiceSection({ group, items }: Props) {
  const state = useQuoteStore(useShallow(selectQuoteState))
  const selected = state.groupSelections[group.id] ?? null
  const quantities = state.quantities
  const selectChoice = useQuoteStore((s) => s.selectMultipleChoice)
  const setQuantity = useQuoteStore((s) => s.setQuantity)

  const selectedItem = items.find((i) => i.id === selected) ?? null
  const selectedQty = selectedItem ? quantities[selectedItem.id] ?? 0 : 0
  const isAutoContainer = selectedItem?.id === AFVOER_CONTAINER_ID
  const isAutoToxisch = selectedItem?.id === AFVOER_TOXISCH_ID
  const isAuto = isAutoContainer || isAutoToxisch

  const autoCount = isAutoContainer ? containerCount(state) : 0
  const removedM2 = state.quantities[state.groupSelections['verwijderen-dakbekleding'] ?? ''] ?? 0
  const autoToxischTotal = isAutoToxisch
    ? Math.max(removedM2 * TOXISCH_PER_M2, removedM2 > 0 ? TOXISCH_MIN : 0)
    : 0
  const autoContainerTotal = isAutoContainer ? autoCount * CONTAINER_PRICE : 0

  const lineTotal = isAutoContainer
    ? autoContainerTotal
    : isAutoToxisch
      ? autoToxischTotal
      : selectedItem
        ? calculateLineTotal(selectedItem, selectedQty)
        : 0

  function priceLabel(item: LineItemDef) {
    if (item.unitPrice === null) return item.priceNote ?? 'Prijs volgt'
    return `${formatEuro(item.unitPrice)} / ${formatUnit(item.unit)}`
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold text-ink-900">{group.label}</h4>
        {group.required && <Badge tone="brand">Verplicht</Badge>}
      </div>
      {group.description && (
        <p className="text-xs text-ink-500 mb-3 text-balance">{group.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <RadioCard
            key={item.id}
            name={group.id}
            value={item.id}
            checked={selected === item.id}
            onChange={(v) => selectChoice(group.id, v)}
            title={item.label}
            description={item.hint}
            trailing={priceLabel(item)}
          />
        ))}
      </div>

      {selectedItem && (
        <div className="mt-3 p-3 rounded-lg bg-surface-muted border border-ink-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="text-sm">
              {isAuto ? (
                <>
                  <span className="text-ink-500">Auto-berekend voor </span>
                  <span className="font-medium text-ink-900">{selectedItem.label}</span>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {isAutoContainer
                      ? `${autoCount} container${autoCount === 1 ? '' : 's'} × €${CONTAINER_PRICE} (${removedM2} m² dakbekleding ÷ 90)`
                      : `${removedM2} m² × €${TOXISCH_PER_M2} (minimum €${TOXISCH_MIN})`}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-ink-500">Hoeveelheid voor </span>
                  <span className="font-medium text-ink-900">{selectedItem.label}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isAuto && (
                <QuantityInput
                  value={selectedQty}
                  onChange={(next) => setQuantity(selectedItem.id, next)}
                  unit={selectedItem.unit}
                />
              )}
              <div className="text-right min-w-[88px]">
                <div className="text-xs text-ink-400">Lijntotaal</div>
                <div className="text-sm font-semibold text-ink-900 tabular-nums">
                  {selectedItem.unitPrice !== null || isAuto
                    ? formatEuro(lineTotal)
                    : (selectedItem.priceNote ?? 'Prijs volgt')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
