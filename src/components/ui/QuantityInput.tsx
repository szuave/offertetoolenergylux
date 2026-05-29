import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Unit } from '@/types/quote'
import { formatUnit } from '@/lib/format'
import { parseLocaleNumber } from '@/lib/parse'
import { cn } from '@/lib/cn'

type Props = {
  value: number
  onChange: (next: number) => void
  unit: Unit
  step?: number
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  id?: string
}

export function QuantityInput({
  value,
  onChange,
  unit,
  step,
  min = 0,
  max = 100000,
  disabled,
  className,
  id,
}: Props) {
  const effectiveStep = step ?? (unit === 'stuk' ? 1 : 0.5)

  // Tijdens het typen tonen we de ruwe tekst (`draft`) zodat een half ingetypte
  // waarde als "3," of "3,50" blijft staan. Bij blur/knoppen synct het veld
  // terug naar de canonieke waarde uit de store.
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (value === 0 ? '' : String(value).replace('.', ','))

  function commit(next: number) {
    const bounded = Math.max(min, Math.min(max, next))
    setDraft(null)
    onChange(Number.isFinite(bounded) ? bounded : 0)
  }

  return (
    <div
      className={cn(
        'inline-flex h-10 items-stretch rounded-lg overflow-hidden bg-white border border-ink-200',
        'focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Verminderen"
        onClick={() => commit(Number((value - effectiveStep).toFixed(2)))}
        disabled={disabled || value <= min}
        className="flex w-9 items-center justify-center text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus size={16} />
      </button>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value
          setDraft(raw)
          const parsed = parseLocaleNumber(raw)
          if (parsed === null) {
            if (raw.trim() === '') onChange(0)
            return
          }
          // Sync de geparste waarde naar de store, maar laat de ruwe tekst staan.
          const bounded = Math.max(min, Math.min(max, parsed))
          onChange(Number.isFinite(bounded) ? bounded : 0)
        }}
        onBlur={() => setDraft(null)}
        className="w-16 text-center text-sm font-medium tabular-nums text-ink-900 bg-transparent focus:outline-none"
        disabled={disabled}
      />
      <span className="flex w-10 items-center justify-center text-xs text-ink-400 border-l border-ink-100 bg-ink-50/40">
        {formatUnit(unit)}
      </span>
      <button
        type="button"
        aria-label="Verhogen"
        onClick={() => commit(Number((value + effectiveStep).toFixed(2)))}
        disabled={disabled || value >= max}
        className="flex w-9 items-center justify-center text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
