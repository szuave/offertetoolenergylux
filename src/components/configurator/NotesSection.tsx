import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody } from '@/components/ui/Card'

export function NotesSection() {
  const notes = useQuoteStore((s) => s.notes)
  const setNotes = useQuoteStore((s) => s.setNotes)

  return (
    <Card>
      <CardBody>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Opmerkingen"
          className="w-full rounded-lg border border-rule px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink resize-y"
        />
      </CardBody>
    </Card>
  )
}
