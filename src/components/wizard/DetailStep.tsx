import { ChecklistsPanel } from '@/components/configurator/ChecklistsPanel'
import { ConfiguratorPanel } from '@/components/configurator/ConfiguratorPanel'
import { NotesSection } from '@/components/configurator/NotesSection'
import { RoofAreaField } from '@/components/configurator/RoofAreaField'
import { SectionHeading } from '@/components/ui/SectionHeading'

/** Stap 3 — Detail: dakbekleding-dropdown, werken invullen, sub-opties, notitie. */
export function DetailStep() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeading title="Renovatie-project" />
        <RoofAreaField />
        <ConfiguratorPanel />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Werf-omstandigheden" />
        <ChecklistsPanel includeIds={['eind-checklist']} />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Notitie" />
        <NotesSection />
      </section>
    </div>
  )
}
