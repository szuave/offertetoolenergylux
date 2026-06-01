import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, WIZARD_ORDER, selectQuoteState } from '@/store/quote-store'
import { WizardProgress } from '@/components/wizard/WizardProgress'
import { CustomerStep } from '@/components/wizard/CustomerStep'
import { FilterStep } from '@/components/wizard/FilterStep'
import { DetailStep } from '@/components/wizard/DetailStep'
import { blockingReason, canAdvanceFrom } from '@/components/wizard/wizard-validation'
import { cn } from '@/lib/cn'
import type { WizardStep } from '@/types/quote'

export function WizardShell() {
  const { wizardStep, setWizardStep } = useQuoteStore(
    useShallow((s) => ({
      wizardStep: s.wizardStep,
      setWizardStep: s.setWizardStep,
    })),
  )
  const state = useQuoteStore(useShallow(selectQuoteState))

  const idx = WIZARD_ORDER.indexOf(wizardStep)
  const isFirst = idx === 0
  const isLast = idx === WIZARD_ORDER.length - 1
  const canAdvance = canAdvanceFrom(wizardStep, state)
  const block = blockingReason(wizardStep, state)

  function goPrev() {
    if (isFirst) return
    setWizardStep(WIZARD_ORDER[idx - 1] as WizardStep)
  }

  function goNext() {
    if (isLast || !canAdvance) return
    setWizardStep(WIZARD_ORDER[idx + 1] as WizardStep)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function jumpTo(step: WizardStep) {
    setWizardStep(step)
  }

  return (
    <div className="space-y-8">
      <WizardProgress current={wizardStep} onJump={jumpTo} />

      <div>
        {wizardStep === 'customer' && <CustomerStep />}
        {wizardStep === 'filter' && <FilterStep />}
        {wizardStep === 'works' && <DetailStep />}
      </div>

      <div className="border-t border-rule pt-6 flex items-center justify-between gap-4">
        {!isFirst ? (
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center h-11 px-4 rounded-lg border border-rule text-ink bg-surface hover:border-ink text-sm font-medium transition-colors"
          >
            Vorige
          </button>
        ) : (
          <span />
        )}

        <div className="flex-1 min-w-0 text-center">
          {!canAdvance && block && (
            <p className="text-xs text-ink-mid">{block}</p>
          )}
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
            className={cn(
              'inline-flex items-center h-11 px-5 rounded-lg text-sm font-semibold transition-colors',
              canAdvance
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                : 'bg-rule text-ink-muted cursor-not-allowed',
            )}
          >
            Volgende
          </button>
        )}
      </div>
    </div>
  )
}
