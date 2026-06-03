import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { SUPPLEMENTS } from '@/data/supplements'
import { Card, CardBody } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * Werf-supplementen — checklist-vragen die de prijs verhogen
 * (Yasid mail v2). Verkoper vinkt aan wat van toepassing is.
 */
export function WerfSupplementen() {
  const { categoryScope, supplements, toggleSupplement } = useQuoteStore(
    useShallow((s) => ({
      categoryScope: s.categoryScope,
      supplements: s.supplements,
      toggleSupplement: s.toggleSupplement,
    })),
  )

  const relevant = SUPPLEMENTS.filter((s) => categoryScope[s.categoryId])
  if (relevant.length === 0) return null

  return (
    <Card>
      <CardBody className="space-y-3">
        <div>
          <h3 className="font-display text-base font-bold text-ink">
            Werf-checklist
          </h3>
          <p className="text-xs text-ink-mid mt-0.5">
            Bijkomende werf-omstandigheden — vink aan wat van toepassing is.
          </p>
        </div>

        <div className="space-y-2">
          {relevant.map((sup) => {
            const checked = supplements[sup.id] === true
            return (
              <label
                key={sup.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  checked
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-rule bg-surface hover:border-ink',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleSupplement(sup.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-primary cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink leading-tight">
                    {sup.label}
                  </div>
                  <div className="text-xs text-ink-mid mt-0.5 leading-snug">
                    {sup.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
