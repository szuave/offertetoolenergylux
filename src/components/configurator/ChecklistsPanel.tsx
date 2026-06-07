import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { CHECKLISTS, type ChecklistDef } from '@/data/checklists'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { parseLocaleNumber } from '@/lib/parse'
import { cn } from '@/lib/cn'

/**
 * Daryl 4 juni: 4 prijschecklists die op verschillende plaatsen in de
 * wizard verschijnen. Voor MVP renderen we ze hier samen in stap 3.
 */
export function ChecklistsPanel() {
  const { categoryScope, quantities } = useQuoteStore(
    useShallow((s) => ({
      categoryScope: s.categoryScope,
      quantities: s.quantities,
    })),
  )

  const visible = CHECKLISTS.filter((c) => {
    if (c.appliesWhen.always) return true
    if (c.appliesWhen.categoryId) return categoryScope[c.appliesWhen.categoryId] === true
    if (c.appliesWhen.itemHasQty) return (quantities[c.appliesWhen.itemHasQty] ?? 0) > 0
    return false
  })

  if (visible.length === 0) return null

  return (
    <div className="space-y-4">
      {visible.map((c) => (
        <ChecklistCard key={c.id} checklist={c} />
      ))}
    </div>
  )
}

function ChecklistCard({ checklist }: { checklist: ChecklistDef }) {
  const answers = useQuoteStore((s) => s.checklistAnswers?.[checklist.id] ?? {})
  const setAnswer = useQuoteStore((s) => s.setChecklistAnswer)

  return (
    <Card>
      <CardBody className="space-y-3">
        <div>
          <h3 className="font-display text-base font-bold text-ink">{checklist.label}</h3>
          {checklist.description && (
            <p className="text-xs text-ink-mid mt-0.5">{checklist.description}</p>
          )}
        </div>
        <div className="space-y-2">
          {checklist.items.map((item) => {
            const ans = answers[item.id] ?? {}
            const checked = ans.checked === true
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  checked
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-rule bg-surface',
                )}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setAnswer(checklist.id, item.id, { checked: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 accent-brand-primary cursor-pointer"
                  />
                  <span className="text-sm text-ink leading-tight">{item.label}</span>
                </label>
                {checked && item.input && (
                  <div className="mt-2 pl-7">
                    {item.input.kind === 'aantal' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={ans.amount === undefined ? '' : String(ans.amount).replace('.', ',')}
                          placeholder={item.input.label}
                          onChange={(e) => {
                            const parsed = parseLocaleNumber(e.target.value)
                            setAnswer(checklist.id, item.id, {
                              amount: parsed === null ? 0 : Math.max(0, parsed),
                            })
                          }}
                          trailingAdornment={item.input.unit}
                          className="max-w-[200px]"
                        />
                      </div>
                    ) : (
                      <Input
                        type="text"
                        value={ans.text ?? ''}
                        placeholder={item.input.placeholder}
                        onChange={(e) =>
                          setAnswer(checklist.id, item.id, { text: e.target.value })
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
