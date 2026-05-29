import { useQuoteStore } from '@/store/quote-store'
import { cn } from '@/lib/cn'

const VAT_OPTIONS = [
  { value: 0.06, label: '6%', description: 'Renovatie > 10 jaar' },
  { value: 0.21, label: '21%', description: 'Nieuwbouw / standaard' },
] as const

export function VatSelector() {
  const vatRate = useQuoteStore((s) => s.vatRate)
  const setVatRate = useQuoteStore((s) => s.setVatRate)

  return (
    <div>
      <div className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">BTW-tarief</div>
      <div className="grid grid-cols-2 gap-2">
        {VAT_OPTIONS.map((opt) => {
          const active = Math.abs(vatRate - opt.value) < 0.0001
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVatRate(opt.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                active
                  ? 'border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20'
                  : 'border-ink-200 hover:border-ink-300',
              )}
            >
              <span className="text-sm font-semibold text-ink-900">{opt.label}</span>
              <span className="text-xs text-ink-500">{opt.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
