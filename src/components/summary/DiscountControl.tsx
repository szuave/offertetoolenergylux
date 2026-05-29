import { useQuoteStore } from '@/store/quote-store'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'

export function DiscountControl() {
  const discount = useQuoteStore((s) => s.discount)
  const setDiscount = useQuoteStore((s) => s.setDiscount)

  return (
    <div className="py-3 border-t border-rule">
      <Toggle
        checked={discount.enabled}
        onChange={(v) => setDiscount({ enabled: v })}
        label="Beslissingskorting"
        id="discount-enabled"
      />
      {discount.enabled && (
        <div className="grid grid-cols-2 gap-2 mt-3 pl-14">
          <Input
            type="number"
            min={0}
            max={50}
            step={1}
            value={discount.percentage}
            onChange={(e) => {
              const raw = Number(e.target.value)
              const safe = Number.isFinite(raw) ? raw : 0
              setDiscount({ percentage: Math.min(50, Math.max(0, safe)) })
            }}
            trailingAdornment="%"
          />
          <Input
            type="number"
            min={1}
            max={90}
            value={discount.conditionDays}
            onChange={(e) => {
              const raw = Number(e.target.value)
              const safe = Number.isFinite(raw) ? raw : 1
              setDiscount({ conditionDays: Math.min(90, Math.max(1, safe)) })
            }}
            trailingAdornment="dgn"
          />
        </div>
      )}
    </div>
  )
}
