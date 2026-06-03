import { formatEuro } from '@/lib/format'
import { cn } from '@/lib/cn'

type Props = {
  pricePerM2: number | null
}

/**
 * Yasid mail v2: prijscontrole op basis van brutowinstmarge.
 * Kostenratio €245/m². Marge = (prijs/m² − €245) / prijs/m².
 *  - < 15 %  → rood (te laag)
 *  - 15-20 % → oranje (minimum maar onder doel)
 *  - 20-25 % → groen (doel bereikt)
 *  - ≥ 25 %  → donkergroen (ideaal)
 */
const KOSTENRATIO_PER_M2 = 245

function classify(pricePerM2: number): {
  margePct: number
  label: string
  color: string
  badge: string
} {
  const marge = (pricePerM2 - KOSTENRATIO_PER_M2) / pricePerM2
  const pct = marge * 100
  if (pct < 15) {
    return {
      margePct: pct,
      label: 'te lage marge',
      color: 'text-danger',
      badge: 'bg-danger-bg text-danger',
    }
  }
  if (pct < 20) {
    return {
      margePct: pct,
      label: 'minimum',
      color: 'text-warning',
      badge: 'bg-warning-bg text-warning',
    }
  }
  if (pct < 25) {
    return {
      margePct: pct,
      label: 'doel',
      color: 'text-success',
      badge: 'bg-success-bg text-success',
    }
  }
  return {
    margePct: pct,
    label: 'ideaal',
    color: 'text-success',
    badge: 'bg-success-bg text-success font-bold',
  }
}

export function PricePerM2Indicator({ pricePerM2 }: Props) {
  if (pricePerM2 === null) {
    return (
      <div className="flex items-baseline justify-between gap-2 py-1">
        <span className="text-xs uppercase tracking-wider text-ink-muted">Prijs / m²</span>
        <span className="text-xs text-ink-muted">Vul dakopp. in</span>
      </div>
    )
  }
  const cls = classify(pricePerM2)
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-ink-muted">Prijs / m²</span>
        <span className={cn('font-display text-base font-semibold tabular-nums', cls.color)}>
          {formatEuro(pricePerM2)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">
          Bruto-marge (kost €{KOSTENRATIO_PER_M2}/m²)
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide tabular-nums',
            cls.badge,
          )}
        >
          {cls.margePct.toFixed(1)}% · {cls.label}
        </span>
      </div>
    </div>
  )
}
