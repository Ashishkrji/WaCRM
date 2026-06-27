import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExecutiveDashboard } from '@/components/analytics/executive-dashboard'

export const metadata: Metadata = { title: 'Executive Dashboard | WaCRM Analytics', description: 'Real-time business intelligence and KPI overview' }

export default async function ExecutiveDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time overview of your entire business</p>
        </div>
        <p className="text-xs text-slate-600">Updated {new Date().toLocaleTimeString()}</p>
      </div>
      <ExecutiveDashboard />
    </div>
  )
}
