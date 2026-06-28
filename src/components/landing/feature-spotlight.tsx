import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Section } from './section'
import { cn } from '@/lib/utils'

interface FeatureSpotlightProps {
  eyebrow: string
  title: string
  body: string
  bullets?: string[]
  /** Right-side by default; flip to put the visual on the left. */
  reverse?: boolean
  visual: ReactNode
  anchorId?: string
}

/**
 * Reusable alternating feature section (copy on one side, product
 * miniature on the other). Three instances on the page so we use the
 * same component to keep spacing + typography consistent.
 */
export function FeatureSpotlight({
  eyebrow,
  title,
  body,
  bullets,
  reverse,
  visual,
  anchorId,
}: FeatureSpotlightProps) {
  return (
    <Section id={anchorId} className="py-16 sm:py-20">
      <div
        className={cn(
          'grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16',
          reverse && 'lg:[&>*:first-child]:order-2',
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            {body}
          </p>
          {bullets && bullets.length > 0 && (
            <ul className="mt-5 space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>{visual}</div>
      </div>
    </Section>
  )
}
