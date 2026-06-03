import { useEffect, useMemo, useRef, useState } from 'react'
import { RAL_COLORS, findRal, type RalColor } from '@/data/ral-colors'
import { cn } from '@/lib/cn'

type Props = {
  id?: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

/**
 * RAL-kleurpicker met autocomplete:
 *  - Verkoper typt een fragment van de code (bv. "7016") of naam ("antraciet")
 *  - Suggesties verschijnen met kleur-swatch, code en NL-naam
 *  - Klik op suggestie → invullen en sluiten
 *  - Bij ↑/↓ navigeren, Enter selecteren, Esc sluiten
 *
 * De volledige RAL Classic-lijst (~213 kleuren) is beschikbaar; "popular"
 * tinten staan bovenaan als er geen zoekterm is.
 */
export function RalPicker({ id, value, onChange, placeholder = 'Typ RAL-nr of naam' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = findRal(value)

  // Lokaal draft: wat de verkoper typt verschilt tijdelijk van de
  // canonieke value tot er geselecteerd of geblurd wordt.
  const display = open ? query : value

  const filtered = useMemo<RalColor[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Geen query → toon populaire kleuren eerst, dan de rest
      const popular = RAL_COLORS.filter((r) => r.popular)
      const rest = RAL_COLORS.filter((r) => !r.popular)
      return [...popular, ...rest]
    }
    return RAL_COLORS.filter((r) => {
      const codeLower = r.code.toLowerCase()
      const nameLower = r.name.toLowerCase()
      return (
        codeLower.includes(q) ||
        nameLower.includes(q) ||
        codeLower.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      )
    })
  }, [query])

  // Sluit bij klik buiten
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        commit(query)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, query])

  // Scroll highlighted item in view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLLIElement>(`[data-idx="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  function openWith(initialQuery: string) {
    setQuery(initialQuery)
    setHighlight(0)
    setOpen(true)
  }

  function commit(raw: string) {
    // Probeer match: exacte code, anders zoals getypt (custom)
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange('')
    } else {
      const exact = findRal(trimmed)
      onChange(exact ? exact.code : trimmed.toUpperCase())
    }
    setOpen(false)
    setQuery('')
  }

  function pick(color: RalColor) {
    onChange(color.code)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        openWith('')
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = filtered[highlight]
      if (picked) pick(picked)
      else commit(query)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          'flex h-9 items-center gap-2 rounded-md border bg-surface px-2 text-sm',
          'border-rule focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15',
        )}
      >
        {selected && !open && (
          <span
            className="inline-block w-5 h-5 rounded-sm border border-rule shrink-0"
            style={{ backgroundColor: selected.hex }}
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          type="text"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlight(0)
            if (!open) setOpen(true)
          }}
          onFocus={() => openWith(value || '')}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted"
          autoComplete="off"
          spellCheck={false}
        />
        {value && !open && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Wissen"
            className="text-ink-muted hover:text-ink text-base leading-none"
          >
            ×
          </button>
        )}
      </div>
      {selected && !open && (
        <div className="mt-0.5 text-[11px] text-ink-mid">{selected.name}</div>
      )}

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-md border border-rule bg-surface shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-ink-mid italic">
              Geen treffer — druk Enter om "{query.toUpperCase()}" te bewaren als custom RAL-code.
            </li>
          ) : (
            filtered.slice(0, 60).map((color, i) => (
              <li
                key={color.code}
                data-idx={i}
                role="option"
                aria-selected={i === highlight}
                onPointerDown={(e) => {
                  e.preventDefault()
                  pick(color)
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 cursor-pointer',
                  i === highlight ? 'bg-brand-primary/10' : 'hover:bg-ink-50',
                )}
              >
                <span
                  className="inline-block w-6 h-6 rounded-sm border border-rule shrink-0"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
                <span className="text-xs font-mono text-ink-mid w-16 shrink-0">{color.code}</span>
                <span className="text-sm text-ink truncate">{color.name}</span>
              </li>
            ))
          )}
          {filtered.length > 60 && (
            <li className="px-3 py-2 text-[11px] text-ink-mid italic border-t border-rule">
              {filtered.length - 60} kleuren verborgen — typ verder om te verfijnen
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
