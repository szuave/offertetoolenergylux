import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, selectQuoteState } from '@/store/quote-store'
import { calculateTotals } from '@/lib/calculator'
import { buildChecklist, countBySeverity, hasBlockingErrors } from '@/lib/checklist'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SubtotalsList } from '@/components/summary/SubtotalsList'
import { PricePerM2Indicator } from '@/components/summary/PricePerM2Indicator'
import { DiscountControl } from '@/components/summary/DiscountControl'
import { VatSelector } from '@/components/summary/VatSelector'
import { ExportActions } from '@/components/export/ExportActions'
import { formatEuro } from '@/lib/format'

export function QuoteSummary() {
  const state = useQuoteStore(useShallow(selectQuoteState))

  const totals = useMemo(() => calculateTotals(state), [state])
  const checklist = useMemo(() => buildChecklist(state), [state])
  const checklistCounts = countBySeverity(checklist)
  const blocked = hasBlockingErrors(checklist)

  return (
    <Card className="sticky top-[104px]">
      <CardHeader
        title="Overzicht"
        subtitle={
          <span className="font-mono text-ink-mid">Offertenr. {state.meta.number || '—'}</span>
        }
        badge={
          totals.resolvedItems.length > 0 ? (
            <Badge tone="brand">{totals.resolvedItems.length} lijnen</Badge>
          ) : null
        }
      />
      <CardBody className="space-y-5">
        <PricePerM2Indicator pricePerM2={totals.pricePerM2} />

        <SubtotalsList subtotals={totals.subtotals} />

        <div className="space-y-2 border-t border-ink-100 pt-4">
          <Row label="Subtotaal" value={formatEuro(totals.subtotalExVat)} />
          {totals.discountAmount > 0 && (
            <Row
              label={`Korting (${state.discount.percentage}%)`}
              value={`− ${formatEuro(totals.discountAmount)}`}
              accent="accent"
            />
          )}
          <Row
            label="Totaal excl. BTW"
            value={formatEuro(totals.totalExVat)}
            emphasize
          />
          <Row
            label={`BTW (${Math.round(state.vatRate * 100)}%)`}
            value={formatEuro(totals.vatAmount)}
          />
          <div className="border-t border-ink-100 pt-3 mt-2">
            <Row
              label="Totaal incl. BTW"
              value={formatEuro(totals.totalIncVat)}
              size="lg"
              emphasize
            />
          </div>
        </div>

        <DiscountControl />
        <VatSelector />

        <ExportActions
          blocked={blocked}
          errorCount={checklistCounts.error}
          warningCount={checklistCounts.warning}
          checklist={checklist}
        />
      </CardBody>
    </Card>
  )
}

function Row({
  label,
  value,
  emphasize,
  accent,
  size,
}: {
  label: string
  value: string
  emphasize?: boolean
  accent?: 'accent'
  size?: 'lg'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={
          emphasize
            ? 'text-sm font-medium text-ink-900'
            : 'text-sm text-ink-500'
        }
      >
        {label}
      </span>
      <span
        className={[
          'tabular-nums',
          size === 'lg' ? 'text-2xl font-bold' : emphasize ? 'text-base font-semibold' : 'text-sm',
          accent === 'accent' ? 'text-[#7a8a01]' : 'text-ink-900',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
