import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: [
    'bg-brand-primary text-white',
    'hover:bg-brand-primary-dark active:translate-y-px',
    'disabled:bg-rule disabled:text-ink-muted disabled:hover:bg-rule disabled:active:translate-y-0',
  ].join(' '),
  secondary: [
    'bg-surface text-ink border border-rule',
    'hover:border-ink hover:bg-surface-muted',
    'disabled:bg-surface-muted disabled:text-ink-muted disabled:border-rule',
    'disabled:hover:border-rule disabled:hover:bg-surface-muted',
  ].join(' '),
  ghost: [
    'bg-transparent text-ink-soft',
    'hover:bg-surface-muted hover:text-ink',
    'disabled:text-ink-muted disabled:hover:bg-transparent disabled:hover:text-ink-muted',
  ].join(' '),
  danger: [
    'bg-danger text-white',
    'hover:bg-red-700',
    'disabled:bg-rule disabled:text-ink-muted disabled:hover:bg-rule',
  ].join(' '),
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-lg font-semibold',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {leftIcon && <span className="flex shrink-0 items-center">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex shrink-0 items-center">{rightIcon}</span>}
    </button>
  )
})
