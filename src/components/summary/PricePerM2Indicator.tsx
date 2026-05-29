import { formatEuro } from '@/lib/format'

type Props = {
  pricePerM2: number | null
}

/**
 * Toont de prijs per m² als feitelijk gegeven. De marktwaarde-classificatie
 * (rood/groen/oranje) staat uit tot er echte drempels per categorie zijn —
 * zie `classifyPricePerM2` in `lib/validation.ts` (dormant).
 */
export function PricePerM2Indicator({ pricePerM2 }: Props) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="text-xs uppercase tracking-wider text-ink-muted">Prijs / m²</span>
      {pricePerM2 === null ? (
        <span className="text-xs text-ink-muted">Vul dakopp. in</span>
      ) : (
        <span className="font-display text-base font-semibold text-ink tabular-nums">
          {formatEuro(pricePerM2)}
        </span>
      )}
    </div>
  )
}
