import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { cn } from '@/lib/cn'

/**
 * Daryl 4 juni: in plaats van twee aparte filters "Dakdichting roofing" en
 * "Dakdichting EPDM" — een verplichte radio-keuze die hier in de
 * Dakdichtingswerken-rubriek van plat dak verschijnt. De gekozen tag
 * activeert automatisch de bijhorende items (onderlaag/toplaag/tapgat).
 */
export function DakdichtingKeuze() {
  const { flags, toggleFlag } = useQuoteStore(
    useShallow((s) => ({
      flags: s.flags,
      toggleFlag: s.toggleFlag,
    })),
  )

  function pick(value: 'roofing' | 'epdm' | null) {
    toggleFlag('roofing', value === 'roofing')
    toggleFlag('epdm', value === 'epdm')
  }

  const current = flags['roofing'] ? 'roofing' : flags['epdm'] ? 'epdm' : null

  return (
    <div className="rounded-lg border border-rule bg-surface p-3 space-y-2">
      <div>
        <h4 className="text-sm font-semibold text-ink">Type dakdichting</h4>
        <p className="text-xs text-ink-mid mt-0.5">
          Kies één type — Roofing of EPDM. De bijhorende items en tapgaten
          verschijnen automatisch.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {([
          { value: 'roofing' as const, label: 'Roofing', desc: 'Onderlaag + toplaag + tapgat' },
          { value: 'epdm' as const, label: 'EPDM', desc: 'Leveren en plaatsen EPDM + EPDM-tapgat' },
        ]).map((opt) => {
          const active = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(active ? null : opt.value)}
              className={cn(
                'text-left p-3 rounded-lg border transition-colors',
                active
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-rule bg-surface hover:border-ink',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 inline-block w-4 h-4 rounded-full border-2 shrink-0',
                    active
                      ? 'border-brand-primary bg-brand-primary'
                      : 'border-ink-300 bg-surface',
                  )}
                />
                <div>
                  <div className="text-sm font-semibold text-ink">{opt.label}</div>
                  <div className="text-xs text-ink-mid mt-0.5">{opt.desc}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
