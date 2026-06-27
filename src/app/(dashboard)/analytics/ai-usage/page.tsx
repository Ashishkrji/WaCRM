import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIAnalytics } from '@/components/analytics/ai-analytics'

export const metadata: Metadata = { title: 'AI Usage Analytics | WaCRM', description: 'AI provider cost and performance tracking' }

export default async function AIUsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">AI Usage & Cost</h1>
        <p className="mt-1 text-sm text-slate-500">Track AI token usage, costs, and model performance across providers</p>
      </div>
      <AIAnalytics />
    </div>
  )
}
