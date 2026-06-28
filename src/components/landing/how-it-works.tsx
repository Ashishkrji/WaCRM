import { Section } from './section'

const STEPS = [
  {
    num: '01',
    title: 'Connect and Configure — No Developer Needed',
    body:
      'Link your WhatsApp number, define your chatbot flows, and set your automation rules — all through a simple visual builder. Most businesses are live within a single afternoon.',
  },
  {
    num: '02',
    title: 'Your Business Runs. Conversations Run on Autopilot.',
    body:
      'Leads get instant replies. Customers get follow-ups. Broadcasts reach your entire list at once. All of it runs in the background while you focus on actually growing.',
  },
  {
    num: '03',
    title: "See Exactly What's Making You Money",
    body:
      "Real-time dashboards show open rates, reply rates, conversions, and drop-offs. Know what's working. Double down on it. Kill what isn't. Every week gets better than the last.",
  },
]

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          How it works
        </h2>
        <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Getting started with{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            MJChatSyncs
          </span>{' '}
          takes minutes, not months.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="relative rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 hover:border-slate-850 transition-all duration-300 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Step {s.num}
                </span>
              </div>
              <h3 className="mt-5 text-base font-bold text-white leading-snug">
                {s.title}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
