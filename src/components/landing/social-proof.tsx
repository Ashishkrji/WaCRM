import { Star } from 'lucide-react'
import { Section } from './section'

const STATS = [
  { value: '10,000+', label: 'Businesses Served' },
  { value: '50M+', label: 'Messages Sent' },
  { value: '98%', label: 'Uptime Guarantee' },
  { value: '4.9/5', label: 'Customer Rating' },
]

const SMALL_TESTIMONIALS = [
  {
    text: 'Our broadcast campaigns now reach 50,000+ customers in minutes. Open rates went from 12% to 78% on WhatsApp.',
    author: 'Priya Mehta',
    role: 'Marketing Lead, StyleKart',
    initials: 'PM',
  },
  {
    text: 'We replaced three separate tools with MJChatSyncs. The integration with our CRM was seamless and saved us hours daily.',
    author: 'David Chen',
    role: 'COO, GlobalRetail Inc',
    initials: 'DC',
  },
  {
    text: 'Student enrollment inquiries are now handled 24/7 without any manual effort. Our team can finally focus on teaching.',
    author: 'Anita Desai',
    role: 'Operations Director, EduLearn Academy',
    initials: 'AD',
  },
  {
    text: 'Order confirmations and delivery updates on WhatsApp reduced our support tickets by 50%. Customers love the instant updates.',
    author: 'Michael Torres',
    role: 'Co-Founder, FreshBites Delivery',
    initials: 'MT',
  },
  {
    text: 'The analytics dashboard gives us real-time insight into every campaign. We optimized our messaging and doubled conversions.',
    author: 'Sneha Kapoor',
    role: 'VP of Customer Success, FinServe Solutions',
    initials: 'SK',
  },
]

export function SocialProof() {
  return (
    <Section id="social-proof" className="relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/5 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
          Social Proof
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Trusted by{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-450 bg-clip-text text-transparent">
            10,000+ businesses
          </span>
        </h2>
        <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          See why growing businesses choose MJChatSyncs to automate their WhatsApp communication.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-16">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 text-center shadow-md hover:border-slate-800 transition-colors"
          >
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-slate-500 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto items-start">
        {/* Left Column: One Large Testimonial */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-900 bg-[#0d1222]/65 p-6 sm:p-8 flex flex-col justify-between min-h-[350px] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
          <div>
            {/* Stars */}
            <div className="flex items-center gap-1 mb-6 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-base sm:text-lg font-medium text-white leading-relaxed italic">
              "MJChatSyncs tripled our lead response rate within the first week. The automation workflows are incredibly easy to set up."
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shadow-inner">
              RS
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Rajesh Sharma</h4>
              <p className="text-[11px] text-slate-500">Founder & CEO, TechSolutions Pvt Ltd</p>
            </div>
          </div>
        </div>

        {/* Right Column: Masonry Grid of Smaller Testimonials */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-6">
            {SMALL_TESTIMONIALS.filter((_, i) => i % 2 === 0).map((t) => (
              <div
                key={t.author}
                className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all duration-300 shadow-lg"
              >
                <p className="text-xs leading-relaxed text-slate-300 italic">
                  "{t.text}"
                </p>
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-450 text-[10px] font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.author}</h4>
                    <p className="text-[9px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            {SMALL_TESTIMONIALS.filter((_, i) => i % 2 !== 0).map((t) => (
              <div
                key={t.author}
                className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all duration-300 shadow-lg"
              >
                <p className="text-xs leading-relaxed text-slate-300 italic">
                  "{t.text}"
                </p>
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-450 text-[10px] font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.author}</h4>
                    <p className="text-[9px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
