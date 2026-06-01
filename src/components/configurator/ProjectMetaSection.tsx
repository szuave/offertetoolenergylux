import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'

export function ProjectMetaSection() {
  const meta = useQuoteStore((s) => s.meta)
  const setMetaField = useQuoteStore((s) => s.setMetaField)

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Verkoper" htmlFor="salesperson" required>
            <Input
              id="salesperson"
              value={meta.salesperson}
              onChange={(e) => setMetaField('salesperson', e.target.value)}
              placeholder="Verkoper"
            />
          </Field>
          <Field label="Project-referentie" htmlFor="projectRef">
            <Input
              id="projectRef"
              value={meta.projectReference}
              onChange={(e) => setMetaField('projectReference', e.target.value)}
              placeholder="Project-referentie"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Offertedatum" htmlFor="issueDate">
            <Input
              id="issueDate"
              type="date"
              value={meta.issueDate}
              onChange={(e) => setMetaField('issueDate', e.target.value)}
            />
          </Field>
          <Field label="Geldig tot" htmlFor="validUntil">
            <Input
              id="validUntil"
              type="date"
              value={meta.validUntilDate}
              onChange={(e) => setMetaField('validUntilDate', e.target.value)}
            />
          </Field>
        </div>
      </CardBody>
    </Card>
  )
}
