import Link from 'next/link'
import { Link2, Smartphone, Zap, BarChart3, CheckCircle2 } from 'lucide-react'
import { Section } from './section'

export function MetaIntegration() {
  return (
    <Section id="meta-integration" className="relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 xl:gap-16 items-center max-w-6xl mx-auto">
        {/* Left Column: Header & CTA */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
          <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase mb-4">
            Meta Business Integration
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Built on the official{' '}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              WhatsApp Business API
            </span>
          </h2>
          <p className="mt-6 text-sm sm:text-base text-slate-400 leading-relaxed max-w-md">
            MJChatSyncs connects to the official WhatsApp Business API through Meta Business. Every message you send — broadcasts, chatbot replies, order updates — is delivered with enterprise-grade reliability and full Meta compliance. No workarounds. No grey-area tools.
          </p>
          <div className="mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Right Column: 2x2 Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Card 1: Official WhatsApp Business API */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10">
              <Link2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">
              Official WhatsApp Business API
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Direct connection through Meta Business — enterprise-grade delivery, full compliance, and 99.9% message reliability. Your messages arrive, every time.
            </p>
          </div>

          {/* Card 2: Click-to-WhatsApp Ads */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">
              Click-to-WhatsApp Ads
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Your Facebook and Instagram ads drop leads straight into a WhatsApp conversation — with an automated reply waiting before they even finish reading your ad.
            </p>
          </div>

          {/* Card 3: Build Chatbots Without Code */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">
              Build Chatbots Without Code
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Launch sales bots, support bots, and lead qualification flows in minutes — with a drag-and-drop builder that requires zero developer involvement.
            </p>
          </div>

          {/* Card 4: Real-Time Campaign Analytics */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">
              Real-Time Campaign Analytics
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              See exactly what's driving revenue. Track deliveries, read, replied, and conversion rates live — and retarget warm leads before they cool off.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Partner Badge */}
      <div className="mt-16 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-xs font-semibold text-blue-400">
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
          <span>Official Meta Business Partner</span>
        </div>
      </div>
    </Section>
  )
}
