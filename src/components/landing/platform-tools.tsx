import { Section } from './section'

export function PlatformTools() {
  return (
    <Section id="platform-tools" className="relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
          Platform
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          See the tools that drive{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            real results
          </span>
        </h2>
        <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          MJChatSyncs is more than a shared inbox — watch how the customer service platform, flow builder, chatbot, and workflows all feed into one place.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Card 1: Your Entire Team, One WhatsApp Number. */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white">
              Your Entire Team, One WhatsApp Number.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Multiple agents can handle conversations simultaneously from one shared WhatsApp number. Assign, tag, and track conversations as they move through the pipeline.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 space-y-2 select-none">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold">JD</div>
                <span className="text-[11px] font-medium text-white">John Doe</span>
              </div>
              <span className="text-[9px] bg-blue-600/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">Assigned: Sarah</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-bold">MK</div>
                <span className="text-[11px] font-medium text-white">Mary Kim</span>
              </div>
              <span className="text-[9px] bg-purple-600/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">Assigned: Alex</span>
            </div>
          </div>
        </div>

        {/* Card 2: Watch Campaigns Convert in Real Time */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white">
              Watch Campaigns Convert in Real Time
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Send bulk messages, broadcasts, and templates to your contacts. Track deliveries, reads, and replies as they happen, so you know what's working.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 flex items-center justify-between select-none">
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Campaign Performance</div>
              <div className="text-xl font-extrabold text-white">87.4% <span className="text-[10px] text-emerald-500 font-medium">Read Rate</span></div>
              <div className="w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '87.4%' }} />
              </div>
            </div>
            <svg className="w-16 h-16 text-blue-500" viewBox="0 0 36 36">
              <path className="text-slate-950" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-blue-500" strokeDasharray="87, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>

        {/* Card 3: Build a Sales Bot Without Writing a Line of Code */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white">
              Build a Sales Bot Without Writing a Line of Code
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Drag-and-drop chatbot builder. Map out questions, answers, and conditional routing. The only limit is your business needs — no developers required.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 flex items-center justify-center gap-4 select-none">
            <div className="border border-slate-900 bg-slate-950/80 rounded-lg p-2 text-center text-[10px] w-24">
              <div className="font-bold text-blue-400">Incoming Message</div>
              <div className="text-slate-500 mt-1">"Pricing query"</div>
            </div>
            <svg className="w-8 h-4 text-slate-700" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M0 6h22M18 2l4 4-4 4" />
            </svg>
            <div className="border border-slate-900 bg-slate-950/80 rounded-lg p-2 text-center text-[10px] w-24">
              <div className="font-bold text-purple-400">Trigger Action</div>
              <div className="text-slate-500 mt-1">Send Price List</div>
            </div>
          </div>
        </div>

        {/* Card 4: Send to Your Entire List, in Minutes. */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white">
              Send to Your Entire List, in Minutes.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Import contacts and send personalized messages to thousands of customers at once. Sync data and track status so you're always in control.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 space-y-2 select-none">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Sending Broadcast...</span>
              <span>4,850 / 5,000 sent</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '97%' }} />
            </div>
          </div>
        </div>

        {/* Card 5: An AI That Knows Your Business */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white">
              An AI That Knows Your Business
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Upload your data source and let the AI answer customer questions 24/7 — with no setup, coding, or going off-script.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 space-y-2 select-none">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white">📄 FAQ_Document.pdf</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Trained</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white">🌐 https://mjchatsyncs.com</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Trained</span>
            </div>
          </div>
        </div>

        {/* Card 6: Connect Any Tool — and Let Go */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white">
              Connect Any Tool — and Let Go
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Trigger WhatsApp messages on actions, sync data, and automate workflows with 20+ native integrations or webhooks. Make it speak to your business.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 grid grid-cols-4 gap-2 select-none">
            {['Shopify', 'Razorpay', 'Zapier', 'Webhooks'].map((integration) => (
              <div key={integration} className="border border-slate-900 bg-slate-950/60 rounded p-2 text-center text-[10px] text-white font-semibold">
                {integration}
              </div>
            ))}
          </div>
        </div>

        {/* Card 7: Turn Website Visitors Into WhatsApp Leads */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-300 group shadow-lg md:col-span-2">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-white">
              Turn Website Visitors Into WhatsApp Leads
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Deploy chat widgets directly on your website to trigger WhatsApp chats and capture lead details before they leave your site.
            </p>
          </div>
          {/* Mockup */}
          <div className="mt-6 rounded-xl border border-slate-900 bg-[#070a13]/80 p-4 flex items-center justify-between select-none">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Website Chat Widget</div>
              <div className="text-xs text-white font-medium">Floating widget in the bottom right corner</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg animate-bounce">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
