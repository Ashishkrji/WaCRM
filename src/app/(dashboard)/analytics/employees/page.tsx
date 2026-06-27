import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loadEmployeeAnalytics } from '@/lib/analytics/queries'
import { Trophy, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Employee Analytics | WaCRM', description: 'Team performance and leaderboard' }

export default async function EmployeesAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { leaderboard } = await loadEmployeeAnalytics(supabase as never)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Employee Performance</h1>
        <p className="mt-1 text-sm text-slate-500">Team leaderboard, deal performance, and task completion</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">Deals Won</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Tasks Done</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {leaderboard.map((emp, i) => (
              <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-500">
                  {i === 0 ? <Trophy className="h-4 w-4 text-yellow-400" /> : i + 1}
                </td>
                <td className="px-4 py-3 font-medium text-slate-200">{emp.name}</td>
                <td className="px-4 py-3 text-slate-500 capitalize">{emp.role}</td>
                <td className="px-4 py-3 text-right text-slate-400">{emp.assigned_leads}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-medium">{emp.won_deals}</td>
                <td className="px-4 py-3 text-right text-slate-300">₹{emp.revenue_generated.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-slate-400">{emp.tasks_completed}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-800">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${emp.performance_score}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-primary">{emp.performance_score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leaderboard.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-600">No employee data yet</div>
        )}
      </div>
    </div>
  )
}
