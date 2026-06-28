import {
  MessageSquare,
  Users,
  GitBranch,
  Radio,
  Zap,
  LineChart,
} from 'lucide-react'
import { Section } from './section'

export function FeaturesGrid() {
  return (
    <Section id="features" className="relative">
      {/* Background Glows (Subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
          Everything you need
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          One toolkit for your WhatsApp business
        </h2>
        <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Stop stitching together an inbox, a spreadsheet, and a broadcast tool. MJChatSyncs brings them together — and talks to WhatsApp natively.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Card 1: Shared inbox (Large - 2 cols, 2 rows on desktop) */}
        <div className="md:col-span-2 md:row-span-2 rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between min-h-[400px] hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">
              Shared inbox
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-400 max-w-xl">
              Every WhatsApp conversation in one place. Assign threads to agents, reply as a team, leave internal notes — and never drop a lead because two people thought the other was on it.
            </p>
          </div>

          {/* Mockup Inside Card */}
          <div className="mt-8 rounded-xl border border-slate-900/80 bg-[#070a13]/80 p-4 space-y-3 select-none">
            {/* Row 1: Aisha */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shadow-inner">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Aisha</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Thanks! Received it.</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">2m</span>
            </div>

            {/* Row 2: Diego */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold shadow-inner">
                  D
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Diego</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-medium">Do you ship to Brazil?</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
                <span className="text-[10px] text-slate-500 font-medium">5m</span>
              </div>
            </div>

            {/* Row 3: Yuki */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold shadow-inner">
                  Y
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Yuki</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Price sheet attached.</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">14m</span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact hub */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between min-h-[180px] hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              Contact hub
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Tags, custom fields, notes, automatic deduplication. Import existing contacts from CSV.
            </p>
          </div>
        </div>

        {/* Card 3: Sales pipelines */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between min-h-[180px] hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <GitBranch className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              Sales pipelines
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Drag deals through stages. See what is won, what is slipping, and where revenue is stuck.
            </p>
          </div>
        </div>

        {/* Card 4: Broadcast campaigns */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between min-h-[180px] hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              Broadcast campaigns
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Send Meta-approved templates to segmented lists. Track delivery, reads, and replies in real time.
            </p>
          </div>
        </div>

        {/* Card 5: No-code automations */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between min-h-[180px] hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              No-code automations
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Welcome new contacts, chase unanswered replies, route leads by keyword. Visual flow builder.
            </p>
          </div>
        </div>

        {/* Card 6: Real-time analytics */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between min-h-[180px] hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <LineChart className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              Real-time analytics
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Response times, daily volume, pipeline value. See what is working without building dashboards.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
