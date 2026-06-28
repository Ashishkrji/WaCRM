import {
  Users,
  Calendar,
  MessageSquare,
  Code,
  Plug,
  Megaphone,
  CheckSquare,
  Image,
  Shield,
} from 'lucide-react'
import { Section } from './section'

const CAPABILITIES = [
  {
    title: 'Contact & Segment Management',
    description:
      'Know exactly who your customers are. Tag, segment, and filter contacts by behavior, campaign, or attribute — then reach the right people with the right message at the right time.',
    icon: Users,
  },
  {
    title: 'Drip Campaigns',
    description:
      'Set it once, sell forever. Automated sequences nurture leads, re-engage dormant contacts, and deliver your pitch — on schedule, without your team lifting a finger.',
    icon: Calendar,
  },
  {
    title: 'FAQ Bot',
    description:
      'Answer your most common questions before your team even sees them. Configure question-answer pairs once — the bot handles them around the clock, automatically.',
    icon: MessageSquare,
  },
  {
    title: 'API & Webhooks',
    description:
      'Send WhatsApp messages directly from your server, CRM, or any low-code platform. Full API access, webhook configuration, and developer docs — connect anything that speaks HTTP.',
    icon: Code,
  },
  {
    title: 'Unlimited Integrations',
    description:
      '20+ native integrations out of the box — Shopify, Razorpay, Google Sheets, IndiaMart, JustDial, Calendly, and more. Plus open API and Webhook access to connect any tool, platform, or custom system with no limits.',
    icon: Plug,
  },
  {
    title: 'Click-to-WhatsApp Ads',
    description:
      "Turn your Facebook and Instagram ads into WhatsApp conversations. Leads click your ad, land in WhatsApp, and get your automated reply instantly — while they're still warm.",
    icon: Megaphone,
  },
  {
    title: 'Projects & Tasks',
    description:
      'Stay organized without switching tools. Create, assign, and track follow-up tasks inside MJChatSyncs — so nothing slips, no matter how fast your business moves.',
    icon: CheckSquare,
  },
  {
    title: 'Rich Media',
    description:
      "Professional conversations don't have to be plain text. Send images, videos, documents, and product catalogs. Keep every message engaging and on-brand.",
    icon: Image,
  },
  {
    title: 'Role-Based Access Control',
    description:
      'Give your team the right access — nothing more. Assign roles and permissions so every member sees what they need, and sensitive data stays protected.',
    icon: Shield,
  },
]

export function FullCapabilities() {
  return (
    <Section id="capabilities" className="relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
          Full capability set
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Everything you need to automate{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            WhatsApp
          </span>
        </h2>
        <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Together with the tools above — automated conversations, broadcast, workflows, analytics, and more. Engage customers, nurture leads, and scale without writing code.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon
          return (
            <div
              key={cap.title}
              className="rounded-2xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  {cap.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {cap.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
