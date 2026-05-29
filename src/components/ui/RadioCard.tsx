import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

type Props = {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  title: string
  description?: ReactNode
  trailing?: ReactNode
  disabled?: boolean
}

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  trailing,
  disabled,
}: Props) {
  return (
    <label
      className={cn(
        'group relative flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all',
        checked
          ? 'border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20'
          : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50/40',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          checked
            ? 'bg-brand-primary border-brand-primary text-white'
            : 'border-ink-300 bg-white',
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-ink-900">{title}</span>
        {description && (
          <span className="block text-xs text-ink-500 mt-0.5 leading-snug">{description}</span>
        )}
      </span>
      {trailing && <span className="shrink-0 text-sm text-ink-700 font-medium">{trailing}</span>}
    </label>
  )
}
