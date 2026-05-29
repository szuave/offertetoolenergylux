import { cn } from '@/lib/cn'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  description?: string
  id?: string
  className?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, id, className, disabled }: Props) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-primary' : 'bg-ink-200',
        )}
      >
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span
          aria-hidden
          className={cn(
            'inline-block h-5 w-5 bg-white rounded-full shadow transform transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && <span className="text-sm font-medium text-ink-900">{label}</span>}
          {description && <span className="text-xs text-ink-500 leading-snug">{description}</span>}
        </span>
      )}
    </label>
  )
}
