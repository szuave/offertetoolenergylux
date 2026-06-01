import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export type RichOption = {
  value: string
  /** Hoofdtekst die in de knop én in de optie verschijnt (bv. "Stormpan Pottelberg 44"). */
  label: string
  /** Bijkomende tekst rechts in de optie (bv. "€53–€75 · 8 kleuren"). */
  meta?: ReactNode
  /** Visueel element links in de optie (foto-thumb, kleurstaal, of placeholder). */
  visual?: ReactNode
  /** Optionele compactere variant van `visual` voor in de trigger-knop. */
  triggerVisual?: ReactNode
  /** Vrije zone onder de label — voor een tweede regel detail. */
  sublabel?: ReactNode
  disabled?: boolean
}

type Props = {
  label: string
  value: string
  options: RichOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  emptyHint?: string
}

export function RichSelect({
  label,
  value,
  options,
  onChange,
  placeholder = '— kies —',
  disabled,
  emptyHint,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  // Sluiten bij klik buiten + Escape
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isEmpty = options.length === 0

  return (
    <div className="flex flex-col gap-1.5" ref={wrapRef}>
      <span className="text-xs font-medium text-ink-mid uppercase tracking-wider">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && !isEmpty && setOpen((v) => !v)}
          disabled={disabled || isEmpty}
          className={cn(
            'group w-full inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-rule',
            'text-left text-sm text-ink',
            'hover:border-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-brand-primary/15',
            (disabled || isEmpty) && 'opacity-50 cursor-not-allowed hover:border-rule',
            open && 'border-ink',
          )}
        >
          {(selected?.triggerVisual ?? selected?.visual) && (
            <span className="shrink-0">{selected!.triggerVisual ?? selected!.visual}</span>
          )}
          <span className="flex-1 min-w-0 truncate">
            {selected ? selected.label : <span className="text-ink-muted">{isEmpty && emptyHint ? emptyHint : placeholder}</span>}
          </span>
          <ChevronDown
            size={16}
            className={cn('text-ink-muted shrink-0 transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && !isEmpty && (
          <div
            className="absolute z-20 mt-1.5 left-0 right-0 max-h-80 overflow-auto rounded-lg border border-rule bg-surface shadow-[0_12px_32px_-12px_rgb(13_27_34_/_0.25)]"
            role="listbox"
          >
            <ul className="py-1">
              {options.map((opt) => {
                const isActive = opt.value === value
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      disabled={opt.disabled}
                      onClick={() => {
                        if (opt.disabled) return
                        onChange(opt.value)
                        setOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm border-l-2',
                        'hover:bg-surface-muted focus:bg-surface-muted focus:outline-none',
                        isActive ? 'bg-brand-primary/5 border-brand-primary' : 'border-transparent',
                        opt.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                      )}
                    >
                      {opt.visual && <span className="shrink-0">{opt.visual}</span>}
                      <span className="flex-1 min-w-0">
                        <span className={cn('block leading-tight text-ink', isActive ? 'font-semibold' : 'font-medium')}>{opt.label}</span>
                        {opt.sublabel && (
                          <span className="block text-xs text-ink-mid leading-tight mt-0.5">{opt.sublabel}</span>
                        )}
                      </span>
                      {opt.meta && (
                        <span className="shrink-0 text-xs text-ink-mid tabular-nums">{opt.meta}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
