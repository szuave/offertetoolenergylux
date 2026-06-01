import { useEffect } from 'react'
import { useQuoteStore } from '@/store/quote-store'
import { Header } from '@/components/layout/Header'
import { WizardShell } from '@/components/wizard/WizardShell'
import { QuoteSummary } from '@/components/summary/QuoteSummary'
import { MobileTotalBar } from '@/components/summary/MobileTotalBar'

export default function App() {
  const ensureNumber = useQuoteStore((s) => s.ensureNumber)
  useEffect(() => {
    ensureNumber()
  }, [ensureNumber])

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-10 pt-10 pb-28 lg:pt-12 lg:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Offerte opmaken
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div className="min-w-0">
            <WizardShell />
          </div>

          <aside id="overzicht" className="lg:min-w-[360px] lg:pt-2 scroll-mt-20">
            <QuoteSummary />
          </aside>
        </div>
      </main>

      <MobileTotalBar />
    </div>
  )
}
