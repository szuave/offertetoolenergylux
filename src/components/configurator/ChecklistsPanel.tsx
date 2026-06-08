import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { CHECKLISTS, type ChecklistDef } from '@/data/checklists'
import type { ChecklistItemAnswer } from '@/types/quote'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { parseLocaleNumber } from '@/lib/parse'
import { cn } from '@/lib/cn'

// Stabiele leeg-object referentie zodat de useQuoteStore-selector geen
// nieuw {} per render aanmaakt (zou React error #185 triggeren).
const EMPTY_ANSWERS: Readonly<Record<string, ChecklistItemAnswer>> = Object.freeze({})

/**
 * Daryl 4 juni: 4 prijschecklists die op verschillende plaatsen in de
 * wizard verschijnen.
 *  - "werf-belemmering" wordt inline gerenderd ONDER de werfinstallatie/
 *    afbraak-rubriek (via ConfiguratorPanel).
 *  - "gevel-ventilatie" idem onder de gevelwerken-rubriek.
 *  - "zonnepanelen-supplementen" idem onder de zonnepaneel-items.
 *  - "eind-checklist" staat onderaan stap 3 (algemene werf-checklist).
 *
 * Prop `includeIds`: render alleen die checklist-id's.
 * Prop `excludeIds`: render alle BEHALVE die id's.
 */
type Props = { includeIds?: readonly string[]; excludeIds?: readonly string[] }

export function ChecklistsPanel({ includeIds, excludeIds }: Props = {}) {
  const { categoryScope, quantities } = useQuoteStore(
    useShallow((s) => ({
      categoryScope: s.categoryScope,
      quantities: s.quantities,
    })),
  )

  const visible = CHECKLISTS.filter((c) => {
    if (includeIds && !includeIds.includes(c.id)) return false
    if (excludeIds && excludeIds.includes(c.id)) return false
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
  const answers = useQuoteStore(
    (s) => s.checklistAnswers?.[checklist.id] ?? EMPTY_ANSWERS,
  )
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
            const isYes = item.requiresYesNo
              ? ans.answer === 'ja'
              : ans.checked === true
            const isNo = item.requiresYesNo && ans.answer === 'nee'
            const showInput = isYes
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  isYes
                    ? 'border-brand-primary bg-brand-primary/5'
                    : isNo
                      ? 'border-rule bg-surface-muted/40'
                      : 'border-rule bg-surface',
                )}
              >
                {item.requiresYesNo ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-ink leading-tight flex-1">
                      {item.label}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAnswer(checklist.id, item.id, {
                            answer: 'ja',
                            checked: true,
                          })
                        }
                        className={cn(
                          'h-8 px-3 rounded-md text-xs font-semibold transition-colors',
                          isYes
                            ? 'bg-brand-primary text-white'
                            : 'bg-surface border border-rule text-ink hover:border-brand-primary',
                        )}
                      >
                        Ja
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAnswer(checklist.id, item.id, {
                            answer: 'nee',
                            checked: false,
                          })
                        }
                        className={cn(
                          'h-8 px-3 rounded-md text-xs font-semibold transition-colors',
                          isNo
                            ? 'bg-ink text-white'
                            : 'bg-surface border border-rule text-ink hover:border-ink',
                        )}
                      >
                        Nee
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isYes}
                      onChange={(e) =>
                        setAnswer(checklist.id, item.id, { checked: e.target.checked })
                      }
                      className="mt-0.5 h-4 w-4 accent-brand-primary cursor-pointer"
                    />
                    <span className="text-sm text-ink leading-tight">{item.label}</span>
                  </label>
                )}
                {showInput && item.input && (
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
