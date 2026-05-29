import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { parseLocaleNumber } from '@/lib/parse'

export function ProjectMetaSection() {
  const meta = useQuoteStore((s) => s.meta)
  const setMetaField = useQuoteStore((s) => s.setMetaField)

  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Dakoppervlakte" htmlFor="roofArea" required>
            <Input
              id="roofArea"
              type="text"
              inputMode="decimal"
              value={meta.roofAreaM2 === 0 ? '' : String(meta.roofAreaM2).replace('.', ',')}
              onChange={(e) => {
                const parsed = parseLocaleNumber(e.target.value)
                setMetaField('roofAreaM2', parsed === null ? 0 : Math.max(0, parsed))
              }}
              placeholder="Dakoppervlakte"
              trailingAdornment="m²"
            />
          </Field>
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
