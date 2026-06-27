import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loadMarketingAnalytics } from '@/lib/analytics/queries'

export const metadata: Metadata = { title: 'Marketing Analytics | WaCRM', description: 'Campaign performance and broadcast analytics' }

export default async function MarketingAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await loadMarketingAnalytics(supabase as never)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Marketing Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Broadcast campaigns, delivery rates, and audience engagement</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Campaigns', value: data.total_broadcasts },
          { label: 'Total Recipients', value: data.total_recipients.toLocaleString() },
          { label: 'Delivery Rate', value: `${(data.delivery_rate * 100).toFixed(1)}%` },
          { label: 'Read Rate', value: `${(data.read_rate * 100).toFixed(1)}%` },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-2xl font-bold text-slate-100">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="px-4 py-3 text-left">Campaign</th>
              <th className="px-4 py-3 text-right">Sent</th>
              <th className="px-4 py-3 text-right">Delivered</th>
              <th className="px-4 py-3 text-right">Read</th>
              <th className="px-4 py-3 text-right">Replied</th>
              <th className="px-4 py-3 text-right">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.campaigns.map((c, i) => (
              <tr key={i} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-200">{c.name}</td>
                <td className="px-4 py-3 text-right text-slate-400">{c.sent}</td>
                <td className="px-4 py-3 text-right text-emerald-400">{c.delivered}</td>
                <td className="px-4 py-3 text-right text-blue-400">{c.read}</td>
                <td className="px-4 py-3 text-right text-violet-400">{c.replied}</td>
                <td className="px-4 py-3 text-right text-red-400">{c.failed}</td>
              </tr>
            ))}
            {data.campaigns.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-600">No campaigns yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
