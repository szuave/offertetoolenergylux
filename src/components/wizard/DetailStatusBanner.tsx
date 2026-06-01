import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, selectQuoteState } from '@/store/quote-store'
import { calculateTotals } from '@/lib/calculator'
import { buildChecklist, countBySeverity } from '@/lib/checklist'
import { cn } from '@/lib/cn'

/**
 * Live status-strookje bovenaan stap 3 — toont hoeveel lijnen al ingevuld
 * zijn en hoeveel errors/warnings er nog openstaan.
 */
export function DetailStatusBanner() {
  const state = useQuoteStore(useShallow(selectQuoteState))
  const totals = calculateTotals(state)
  const checklist = buildChecklist(state)
  const counts = countBySeverity(checklist)
  const works = totals.resolvedItems.length

  const hasErrors = counts.error > 0
  const tone = hasErrors ? 'error' : counts.warning > 0 ? 'warning' : 'ok'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 rounded-lg border',
        tone === 'error' && 'border-danger/30 bg-danger-bg',
        tone === 'warning' && 'border-warning/30 bg-warning-bg',
        tone === 'ok' && 'border-rule bg-surface',
      )}
    >
      <div className="text-sm font-medium text-ink">
        {works === 0
          ? 'Nog geen hoeveelheden ingevuld'
          : `${works} ${works === 1 ? 'lijn' : 'lijnen'} ingevuld`}
      </div>
      <div className="text-xs">
        {hasErrors ? (
          <strong className="text-danger">
            {counts.error} fout{counts.error === 1 ? '' : 'en'}
            {counts.warning > 0 && ` · ${counts.warning} waarschuwing${counts.warning === 1 ? '' : 'en'}`}
          </strong>
        ) : counts.warning > 0 ? (
          <strong className="text-warning">
            {counts.warning} waarschuwing{counts.warning === 1 ? '' : 'en'}
          </strong>
        ) : (
          <span className="text-success font-medium">Alles in orde</span>
        )}
      </div>
    </div>
  )
}
