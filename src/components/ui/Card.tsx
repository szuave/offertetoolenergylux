import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-rule',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

type CardHeaderProps = {
  title: string
  subtitle?: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, icon, badge, actions, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 px-6 py-5 border-b border-rule',
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-surface-muted border border-rule text-ink">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-ink truncate tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-ink-mid mt-0.5 text-balance leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

export function CardBody({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

export function CardFooter({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('px-6 py-4 border-t border-rule bg-surface-muted/60', className)}>
      {children}
    </div>
  )
}
