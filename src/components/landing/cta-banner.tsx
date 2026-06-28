import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Section } from './section'

/**
 * Last push before the footer. Visually distinct (border, gradient
 * background) so it doesn't read as "just another section".
 */
export function CtaBanner() {
  return (
    <Section className="py-16 sm:py-20">
      <div
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/70 px-6 py-16 text-center sm:px-12 sm:py-20"
        style={{
          background:
            'radial-gradient(800px circle at 50% -40%, rgb(16 185 129 / 0.18), transparent 60%), linear-gradient(to bottom, rgb(15 23 42 / 0.9), rgb(15 23 42 / 0.7))',
        }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to stop switching between tools?
        </h2>
        <p className="mt-4 text-base text-slate-400">
          Bring your WhatsApp conversations, contacts, and deals into one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </Section>
  )
}
