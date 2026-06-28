import { Plug, Users, Zap } from 'lucide-react'
import { Section, SectionHeader } from './section'

const STEPS = [
  {
    num: '01',
    icon: Plug,
    title: 'Connect your WhatsApp number',
    body:
      'Paste your phone number ID and access token from Meta. Works with any Meta-approved WhatsApp Business API provider.',
  },
  {
    num: '02',
    icon: Users,
    title: 'Bring in your contacts',
    body:
      'Import a CSV, or let incoming messages build your contact list automatically. Tags and custom fields are ready from day one.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Reply, automate, measure',
    body:
      'Use the shared inbox with your team, set up flows for repeat work, and track what is actually moving the needle in your analytics.',
  },
]

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeader
        eyebrow="How it works"
        title="Live in under 30 minutes"
        description="Most teams are up and running before their first coffee refill. No onboarding calls required."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.num}
              className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className="text-xl font-bold tracking-tight text-slate-800 tabular-nums"
                  aria-hidden
                >
                  {s.num}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {s.body}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
