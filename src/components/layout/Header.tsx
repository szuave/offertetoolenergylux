import { FilePlus2, RotateCcw } from 'lucide-react'
import { useQuoteStore } from '@/store/quote-store'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export function Header() {
  const newQuote = useQuoteStore((s) => s.newQuote)
  const resetQuote = useQuoteStore((s) => s.resetQuote)

  function handleReset() {
    if (window.confirm('Alle ingevulde velden wissen? Deze actie kan niet ongedaan worden gemaakt.')) {
      resetQuote()
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-rule shadow-[0_8px_24px_-16px_rgb(13_27_34_/_0.15)]">
      <div className="max-w-[1480px] mx-auto px-6 lg:px-10 h-[88px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Logo variant="banner" height={42} />
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="h-3 w-px bg-rule" />
            <span className="uppercase tracking-[0.18em] text-ink-muted">Offerte-tool</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={handleReset}
            title="Alle velden wissen"
          >
            Wissen
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FilePlus2 size={14} />}
            onClick={newQuote}
            title="Nieuwe offerte starten — verkopernaam blijft behouden"
          >
            Nieuwe offerte
          </Button>
        </div>
      </div>
    </header>
  )
}
