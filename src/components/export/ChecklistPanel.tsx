import type { ChecklistItem, ChecklistSeverity } from '@/lib/checklist'
import { cn } from '@/lib/cn'

const dotColor: Record<ChecklistSeverity, string> = {
  error: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-brand-primary',
}

export function ChecklistPanel({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
        Alles in orde
      </div>
    )
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5 text-xs text-ink-soft">
          <span
            className={cn('mt-1 inline-block w-1.5 h-1.5 rounded-full shrink-0', dotColor[item.severity])}
          />
          <span className="leading-snug">{item.message}</span>
        </li>
      ))}
    </ul>
  )
}
