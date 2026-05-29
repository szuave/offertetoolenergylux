import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function SectionHeading({
  step,
  title,
  description,
  className,
}: {
  step?: number
  title: string
  description?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline gap-3 pb-2 border-b border-rule', className)}>
      {step !== undefined && (
        <span className="font-mono text-xs text-ink-muted shrink-0">
          {String(step).padStart(2, '0')}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="font-display text-lg font-bold text-ink leading-tight tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-ink-mid mt-0.5 max-w-2xl leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
