import { CustomerSection } from '@/components/customer/CustomerSection'
import { ProjectMetaSection } from '@/components/configurator/ProjectMetaSection'
import { SectionHeading } from '@/components/ui/SectionHeading'

/** Stap 1 — Klant + project. */
export function CustomerStep() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeading title="Klant" />
        <CustomerSection />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Project" />
        <ProjectMetaSection />
      </section>
    </div>
  )
}
