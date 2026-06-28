import Link from 'next/link'
import { Section } from './section'

export function CtaBanner() {
  return (
    <Section className="py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-[#0c101d] px-8 py-12 sm:px-16 sm:py-16 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Text & Buttons */}
          <div className="lg:col-span-9 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              More leads. Faster follow-up.
              <span className="block mt-1 text-blue-500">
                More revenue.
              </span>
            </h2>
            <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Start with Starter at ₹2,999/month and build it yourself — get expert setup with Growth at ₹9,999/month — or let our team run everything with Managed at ₹29,999/month.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/pricing"
                className="w-full sm:w-auto text-center font-semibold text-white bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all text-sm"
              >
                View Pricing
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto text-center font-medium text-slate-300 hover:text-white px-8 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 transition-all text-sm"
              >
                Explore Managed Service
              </Link>
            </div>
          </div>

          {/* Right Column: Icon Illustration */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Chat bubble outline */}
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  {/* Sync arrows inside */}
                  <path d="M8 12a4 4 0 0 1 7-2.5L16 10" />
                  <path d="M16 10h-3" />
                  <path d="M16 10V7" />
                  <path d="M16 12a4 4 0 0 1-7 2.5L8 14" />
                  <path d="M8 14h3" />
                  <path d="M8 14v3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
