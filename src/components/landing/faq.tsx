"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Section, SectionHeader } from './section'
import { cn } from '@/lib/utils'

// Answering real objections a small-business owner has before signing
// up. Order matters — setup friction is usually the #1 concern, cost
// #2, data ownership #3.
const QA = [
  {
    q: 'Do I need my own WhatsApp Business API access?',
    a: "Yes. WaCRM plugs into your existing Meta WhatsApp Business setup — you bring the phone number and access token, we provide the CRM tooling around it. Any Meta-approved BSP (Business Solution Provider) works.",
  },
  {
    q: 'Can my whole team share one WhatsApp number?',
    a: 'Yes. Assign conversations to specific agents, track who is responding to what, and hand off threads without losing context. All your agents work from a single shared inbox.',
  },
  {
    q: 'How fast is setup?',
    a: 'Most teams are live in under 30 minutes once their WhatsApp Business number has been approved by Meta. Paste your credentials in Settings, import contacts if you have them, and start replying.',
  },
  {
    q: 'Who owns the data?',
    a: 'You do. Everything lives in your own Supabase project — contacts, conversations, deals, automation logs. Export it anytime; there is no lock-in on the data layer.',
  },
  {
    q: 'Can I send bulk messages and automated replies?',
    a: 'Yes. Broadcasts send Meta-approved templates to segmented contact lists with delivery tracking. Automations run no-code flows triggered by new contacts, keywords, tag changes, and more.',
  },
  {
    q: 'What about message templates?',
    a: 'Templates you create in Meta are synced automatically. Use them from the inbox, broadcasts, or inside an automation step.',
  },
]

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <Section id="faq">
      <SectionHeader
        eyebrow="FAQ"
        title="Questions, answered"
        description="If you cannot find what you are looking for, reach out and we will get back to you."
      />

      <div className="mx-auto max-w-3xl divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
        {QA.map((item, i) => {
          const isOpen = openIdx === i
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-900/70"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-slate-500 transition-transform',
                    isOpen && 'rotate-180 text-emerald-400',
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
