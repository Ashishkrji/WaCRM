import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import Link from 'next/link'
import { FileText, Download, Clock, CheckCircle2, XCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'GST Reports | WaCRM', description: 'GSTR-1 and GSTR-3B filing' }

export default async function GSTReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const { data: returns } = await db.from('gst_returns').select('*').eq('user_id', user.id).order('period_year', { ascending: false }).order('period_month', { ascending: false })

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Build last 6 months for pending
  const periods: Array<{ month: number; year: number; label: string }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1)
    periods.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${months[d.getMonth()]} ${d.getFullYear()}` })
  }

  const GSTR_TYPES = ['GSTR1', 'GSTR3B'] as const

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">GST Returns</h1>
          <p className="text-sm text-slate-500 mt-1">GSTR-1 and GSTR-3B filing tracker</p>
        </div>
      </div>

      {/* Return Status Grid */}
      {GSTR_TYPES.map(type => (
        <div key={type} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">{type}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {periods.map(p => {
              const filed = (returns ?? []).find(r => r.gstr_type === type && r.period_month === p.month && r.period_year === p.year)
              return (
                <div key={`${p.year}-${p.month}`} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
                  <p className="text-xs text-slate-500 mb-2">{p.label}</p>
                  {filed ? (
                    <div className="space-y-1">
                      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" />
                      <p className="text-[10px] text-emerald-400 capitalize">{filed.status}</p>
                      {filed.arn && <p className="text-[10px] text-slate-600">{filed.arn}</p>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Clock className="mx-auto h-5 w-5 text-orange-400" />
                      <Link href={`/gst-reports/generate?type=${type}&month=${p.month}&year=${p.year}`}
                        className="block text-[10px] text-primary hover:underline">Generate</Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Filed Returns History */}
      {(returns ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">ARN</th>
                <th className="px-4 py-3 text-right">Tax Payable</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {(returns ?? []).map(r => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r.gstr_type}</td>
                  <td className="px-4 py-3 text-slate-300">{months[r.period_month - 1]} {r.period_year}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${r.status === 'filed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{r.arn ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-200">₹{Number(r.tax_liability ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="flex items-center gap-1 mx-auto text-xs text-slate-400 hover:text-white">
                      <Download className="h-3 w-3" /> JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
