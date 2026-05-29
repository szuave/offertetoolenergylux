import { useMemo } from 'react'
import { ArrowDown } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, selectQuoteState } from '@/store/quote-store'
import { calculateTotals } from '@/lib/calculator'
import { formatEuro } from '@/lib/format'

/**
 * Vaste totaalbalk onderaan op kleine schermen (tablet/gsm bij de klant).
 * Op laptop (lg+) staat het overzicht al vast in beeld, dan tonen we deze niet.
 */
export function MobileTotalBar() {
  const state = useQuoteStore(useShallow(selectQuoteState))
  const totals = useMemo(() => calculateTotals(state), [state])

  function scrollToOverview() {
    document.getElementById('overzicht')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-rule shadow-[0_-8px_24px_-16px_rgb(13_27_34_/_0.25)]">
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Totaal incl. BTW</div>
          <div className="font-display text-xl font-bold text-ink tabular-nums leading-tight">
            {formatEuro(totals.totalIncVat)}
          </div>
        </div>
        <button
          type="button"
          onClick={scrollToOverview}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-brand-primary text-white text-sm font-semibold active:translate-y-px"
        >
          Naar overzicht
          <ArrowDown size={16} />
        </button>
      </div>
    </div>
  )
}
