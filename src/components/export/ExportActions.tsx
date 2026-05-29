import { useMemo, useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore, selectQuoteState } from '@/store/quote-store'
import { calculateTotals } from '@/lib/calculator'
import type { ChecklistItem } from '@/lib/checklist'
import { Button } from '@/components/ui/Button'
import { ChecklistPanel } from '@/components/export/ChecklistPanel'

type Props = {
  blocked: boolean
  errorCount: number
  warningCount: number
  checklist: ChecklistItem[]
}

export function ExportActions({ blocked, errorCount, warningCount, checklist }: Props) {
  const quoteState = useQuoteStore(useShallow(selectQuoteState))
  const totals = useMemo(() => calculateTotals(quoteState), [quoteState])
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChecklist, setShowChecklist] = useState(true)

  /** Lazy-load de PDF-stack: react-pdf is ~1MB, we laden hem pas op klik. */
  async function renderPdfBlob(): Promise<Blob> {
    const [{ pdf }, { OfferDocument }, { pdfAssets }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/pdf/OfferDocument'),
      import('@/components/pdf/assets'),
    ])
    return pdf(<OfferDocument quote={quoteState} totals={totals} assets={pdfAssets} />).toBlob()
  }

  function buildFilename(): string {
    const safeLastName = (quoteState.customer.lastName || 'klant')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'klant'
    return `Energylux-offerte-${quoteState.meta.number}-${safeLastName}.pdf`
  }

  async function handleExport() {
    setError(null)
    setIsExporting(true)
    try {
      const blob = await renderPdfBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = buildFilename()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (err) {
      console.error('PDF export failed', err)
      setError('PDF genereren mislukt. Probeer opnieuw of contacteer de beheerder.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handlePreview() {
    setError(null)
    setIsExporting(true)
    try {
      const blob = await renderPdfBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      console.error('PDF preview failed', err)
      setError('PDF tonen mislukt. Probeer opnieuw.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-3 pt-2 border-t border-ink-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
          Controle
        </span>
        <button
          type="button"
          onClick={() => setShowChecklist((v) => !v)}
          className="text-xs text-brand-primary hover:underline"
        >
          {showChecklist ? 'Verbergen' : 'Tonen'} ({checklist.length})
        </button>
      </div>

      {showChecklist && <ChecklistPanel items={checklist} />}

      {error && (
        <div className="text-xs text-danger bg-danger-bg rounded-md p-2">{error}</div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleExport}
          disabled={blocked || isExporting}
          leftIcon={
            isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />
          }
          className="w-full"
        >
          {isExporting ? 'Bezig…' : 'PDF downloaden'}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handlePreview}
          disabled={blocked || isExporting}
          leftIcon={<FileText size={14} />}
          className="w-full"
        >
          Voorbeeld in nieuw tabblad
        </Button>
      </div>

      {blocked ? (
        <p className="text-xs text-danger text-center">
          {errorCount} {errorCount > 1 ? 'velden' : 'veld'} nog in te vullen
        </p>
      ) : warningCount > 0 ? (
        <p className="text-xs text-ink-muted text-center">
          {warningCount} {warningCount > 1 ? 'aandachtspunten' : 'aandachtspunt'}
        </p>
      ) : null}
    </div>
  )
}
