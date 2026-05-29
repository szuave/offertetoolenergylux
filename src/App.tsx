import { useEffect } from 'react'
import { useQuoteStore } from '@/store/quote-store'
import { Header } from '@/components/layout/Header'
import { CustomerSection } from '@/components/customer/CustomerSection'
import { ProjectMetaSection } from '@/components/configurator/ProjectMetaSection'
import { ConfiguratorPanel } from '@/components/configurator/ConfiguratorPanel'
import { NotesSection } from '@/components/configurator/NotesSection'
import { QuoteSummary } from '@/components/summary/QuoteSummary'
import { MobileTotalBar } from '@/components/summary/MobileTotalBar'
import { SectionHeading } from '@/components/ui/SectionHeading'

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
          <div className="space-y-10 min-w-0">
            <section className="space-y-4">
              <SectionHeading step={1} title="Klant" />
              <CustomerSection />
            </section>

            <section className="space-y-4">
              <SectionHeading step={2} title="Project" />
              <ProjectMetaSection />
            </section>

            <section className="space-y-4">
              <SectionHeading step={3} title="Werken" />
              <ConfiguratorPanel />
            </section>

            <section className="space-y-4">
              <SectionHeading step={4} title="Notitie" />
              <NotesSection />
            </section>
          </div>

          <aside id="overzicht" className="lg:min-w-[360px] lg:pt-[47px] scroll-mt-20">
            <QuoteSummary />
          </aside>
        </div>
      </main>

      <MobileTotalBar />
    </div>
  )
}
