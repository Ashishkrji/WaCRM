import Link from 'next/link'
import { Server, Star, CheckCircle2, BookOpen, ArrowRight, Check } from 'lucide-react'
import { Section } from './section'

export function OpenSourceSection() {
  return (
    <Section id="open-source" className="relative">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
          Open Source
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Fork it, brand it, host it
        </h2>
        <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          MJChatSyncs is the open-source WhatsApp CRM template you take and make your own. Grab the source on{' '}
          <a href="https://github.com/AshishKmj/MJChatSyncs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            GitHub
          </a>{' '}
          and follow the{' '}
          <Link href="/documentation" className="text-blue-400 hover:underline">
            getting started guide
          </Link>
          , or skip straight to{' '}
          <a href="https://hostinger.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            deploying
          </a>{' '}
          on Hostinger Managed Node.js Hosting for a zero-ops deploy.
        </p>
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-12 select-none">
        {/* GitHub Stars */}
        <a
          href="https://github.com/AshishKmj/MJChatSyncs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/40 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
        >
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />
          <span>1.1k stars on GitHub</span>
        </a>

        {/* Live on Hostinger */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-3.5 py-1.5 text-xs font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live on Hostinger</span>
        </div>

        {/* Official API */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/40 px-3.5 py-1.5 text-xs font-medium text-slate-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
          <span>Official WhatsApp® Business API</span>
        </div>
      </div>

      {/* Two Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
        {/* Left Card: Source on GitHub */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-slate-200 border border-slate-800">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-bold text-white">
              Source on GitHub
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Clone or fork the repository, tweak the code, ship your own build. MIT-style freedom with the full CRM underneath.
            </p>

            {/* Code Block */}
            <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 font-mono text-xs text-slate-300 select-all overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">$</span>
                <span>git clone <span className="text-emerald-400">https://github.com/AshishKmj/MJChatSyncs.git</span></span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-slate-600">$</span>
                <span>cd MJChatSyncs && npm install</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-slate-600">$</span>
                <span>npm run dev</span>
              </div>
            </div>
          </div>

          <a
            href="https://github.com/AshishKmj/MJChatSyncs"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            AshishKmj/MJChatSyncs
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Right Card: Deploy on Hostinger */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
                <Server className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 uppercase">
                Recommended
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-white">
              Deploy on Hostinger
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Best fit for this template — connect your forked repo to Managed Node.js Hosting and your CRM is live in a few minutes. No servers to patch.
            </p>

            {/* Checklist */}
            <div className="mt-6 rounded-xl border border-slate-900/80 bg-[#070a13]/60 p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Connect repo</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Auto-deploy on push</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Live in ~30s</span>
              </div>
            </div>
          </div>

          <a
            href="https://hostinger.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Managed Node.js Hosting
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="flex justify-center">
        <Link
          href="/documentation"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-all group"
        >
          <BookOpen className="h-4 w-4" />
          <span>Read the full documentation</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  )
}
