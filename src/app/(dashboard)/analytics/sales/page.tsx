import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SalesAnalytics } from '@/components/analytics/sales-analytics'

export const metadata: Metadata = { title: 'Sales Analytics | WaCRM', description: 'Pipeline, revenue and deal analytics' }

export default async function SalesAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Sales Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Pipeline, revenue trends, and deal performance</p>
      </div>
      <SalesAnalytics />
    </div>
  )
}
