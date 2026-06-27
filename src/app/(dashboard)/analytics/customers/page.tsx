import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loadCustomerAnalytics } from '@/lib/analytics/queries'

export const metadata: Metadata = { title: 'Customer Analytics | WaCRM', description: 'Customer retention and engagement analytics' }

export default async function CustomersAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await loadCustomerAnalytics(supabase as never)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Customer Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Customer lifecycle, retention rate, and engagement metrics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Customers', value: data.total_customers },
          { label: 'New This Month', value: data.new_this_month },
          { label: 'Active', value: data.active },
          { label: 'Retention Rate', value: `${(data.retention_rate * 100).toFixed(1)}%` },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-2xl font-bold text-slate-100">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* By Industry + By Country */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">By Industry</h3>
          <div className="space-y-2">
            {data.by_industry.map(i => (
              <div key={i.industry} className="flex justify-between text-xs">
                <span className="text-slate-400">{i.industry}</span>
                <span className="text-slate-200 font-medium">{i.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">By Country</h3>
          <div className="space-y-2">
            {data.by_country.map(c => (
              <div key={c.country} className="flex justify-between text-xs">
                <span className="text-slate-400">{c.country}</span>
                <span className="text-slate-200 font-medium">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
