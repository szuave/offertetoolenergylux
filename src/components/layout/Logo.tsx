import fullLogoUrl from '/energylux-logo.png?url'
import bannerLogoUrl from '/energylux-logo-banner.png?url'
import { cn } from '@/lib/cn'

type Variant = 'full' | 'banner'

type Props = {
  className?: string
  /** Hoogte in pixels. Standaard 32. */
  height?: number
  /**
   * `full`   = wordmark + tagline (officieel logo, voor PDF en formele plekken)
   * `banner` = wordmark zonder tagline (compacter, voor navbar)
   */
  variant?: Variant
}

const sources: Record<Variant, string> = {
  full: fullLogoUrl,
  banner: bannerLogoUrl,
}

export function Logo({ className, height = 32, variant = 'full' }: Props) {
  return (
    <img
      src={sources[variant]}
      alt="Energylux"
      height={height}
      style={{ height, width: 'auto' }}
      className={cn('block', className)}
    />
  )
}
