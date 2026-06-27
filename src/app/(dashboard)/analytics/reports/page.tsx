import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertManager } from '@/components/analytics/alert-manager'
import { ReportBuilder } from '@/components/analytics/report-builder'

export const metadata: Metadata = { title: 'Reports & Alerts | WaCRM', description: 'Business intelligence reports and alert management' }

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports & Alerts</h1>
        <p className="mt-1 text-sm text-slate-500">Schedule reports, export data, and configure alert rules</p>
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <ReportBuilder />
        <AlertManager />
      </div>
    </div>
  )
}
