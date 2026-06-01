import { cn } from '@/lib/cn'
import { WIZARD_ORDER } from '@/store/quote-store'
import type { WizardStep } from '@/types/quote'

const STEP_LABELS: Record<WizardStep, string> = {
  customer: 'Klant & project',
  filter: 'Filter opties',
  works: 'Detail & afwerking',
}

export function WizardProgress({
  current,
  onJump,
}: {
  current: WizardStep
  onJump: (step: WizardStep) => void
}) {
  const currentIndex = WIZARD_ORDER.indexOf(current)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          Stap {currentIndex + 1} van {WIZARD_ORDER.length}
        </p>
        <p className="text-xs text-ink-mid hidden sm:block">
          {STEP_LABELS[current]}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {WIZARD_ORDER.map((step, idx) => {
          const isActive = idx === currentIndex
          const isDone = idx < currentIndex
          const canJump = idx <= currentIndex
          return (
            <div key={step} className="flex-1 flex items-center gap-2 min-w-0">
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onJump(step)}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  isActive && 'bg-brand-primary',
                  isDone && 'bg-brand-primary/50 hover:bg-brand-primary/70 cursor-pointer',
                  !isActive && !isDone && 'bg-rule',
                )}
                aria-label={`Naar stap ${idx + 1}: ${STEP_LABELS[step]}`}
              />
            </div>
          )
        })}
      </div>

      <div className="hidden sm:grid grid-cols-3 gap-2 text-xs">
        {WIZARD_ORDER.map((step, idx) => {
          const isActive = idx === currentIndex
          return (
            <div
              key={step}
              className={cn(
                'truncate',
                isActive ? 'font-semibold text-ink' : 'text-ink-muted',
              )}
            >
              {idx + 1}. {STEP_LABELS[step]}
            </div>
          )
        })}
      </div>
    </div>
  )
}
