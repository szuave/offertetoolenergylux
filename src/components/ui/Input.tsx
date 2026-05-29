import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  leadingAdornment?: ReactNode
  trailingAdornment?: ReactNode
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { leadingAdornment, trailingAdornment, error, className, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'group flex items-center w-full h-11 rounded-lg bg-surface',
        'border border-rule focus-within:border-ink',
        'transition-colors',
        error && 'border-danger focus-within:border-danger',
      )}
    >
      {leadingAdornment && (
        <span className="flex shrink-0 items-center pl-3 text-ink-muted text-sm">
          {leadingAdornment}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-ink',
          'placeholder:text-ink-muted focus:outline-none',
          leadingAdornment && 'pl-2',
          trailingAdornment && 'pr-2',
          className,
        )}
        {...rest}
      />
      {trailingAdornment && (
        <span className="flex shrink-0 items-center pr-3 text-ink-muted text-sm">
          {trailingAdornment}
        </span>
      )}
    </div>
  )
})
