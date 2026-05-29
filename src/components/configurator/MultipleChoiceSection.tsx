import { useQuoteStore } from '@/store/quote-store'
import { Badge } from '@/components/ui/Badge'
import { RadioCard } from '@/components/ui/RadioCard'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { formatEuro, formatUnit } from '@/lib/format'
import { calculateLineTotal } from '@/lib/calculator'
import type { LineItemDef, MultipleChoiceGroupDef } from '@/types/quote'

type Props = {
  group: MultipleChoiceGroupDef
  items: LineItemDef[]
}

export function MultipleChoiceSection({ group, items }: Props) {
  const selected = useQuoteStore((s) => s.groupSelections[group.id] ?? null)
  const quantities = useQuoteStore((s) => s.quantities)
  const selectChoice = useQuoteStore((s) => s.selectMultipleChoice)
  const setQuantity = useQuoteStore((s) => s.setQuantity)

  const selectedItem = items.find((i) => i.id === selected) ?? null
  const selectedQty = selectedItem ? quantities[selectedItem.id] ?? 0 : 0
  const lineTotal = selectedItem ? calculateLineTotal(selectedItem, selectedQty) : 0

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
              <span className="text-ink-500">Hoeveelheid voor </span>
              <span className="font-medium text-ink-900">{selectedItem.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <QuantityInput
                value={selectedQty}
                onChange={(next) => setQuantity(selectedItem.id, next)}
                unit={selectedItem.unit}
              />
              <div className="text-right min-w-[88px]">
                <div className="text-xs text-ink-400">Lijntotaal</div>
                <div className="text-sm font-semibold text-ink-900 tabular-nums">
                  {selectedItem.unitPrice !== null
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
