import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'

export const metadata: Metadata = { title: 'Payment History | WaCRM' }

export default async function PaymentHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const { data: payments } = await db
    .from('payments')
    .select('*, gst_invoices(invoice_number, buyer_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const total = (payments ?? []).filter(p => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0)
  const INR = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  const STATUS_STYLES: Record<string, string> = {
    success: 'text-emerald-400 bg-emerald-500/10', pending: 'text-yellow-400 bg-yellow-500/10', failed: 'text-red-400 bg-red-500/10', refunded: 'text-blue-400 bg-blue-500/10',
  }
  const METHOD_LABELS: Record<string, string> = { cash: 'Cash', upi: 'UPI', neft: 'NEFT', rtgs: 'RTGS', imps: 'IMPS', cheque: 'Cheque', card: 'Card', razorpay: 'Razorpay', stripe: 'Stripe', other: 'Other' }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Payment History</h1>
        <p className="text-sm text-slate-500 mt-1">All received payments across channels</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Received', value: INR(total) },
          { label: 'Transactions', value: (payments ?? []).length },
          { label: 'This Month', value: INR((payments ?? []).filter(p => p.status === 'success' && new Date(p.payment_date).getMonth() === new Date().getMonth()).reduce((s, p) => s + Number(p.amount), 0)) },
          { label: 'Pending', value: INR((payments ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)) },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xl font-bold text-slate-100">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {(payments ?? []).map(p => {
              const inv = p.gst_invoices as { invoice_number: string; buyer_name: string } | null
              return (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {inv ? <><p className="text-xs font-mono text-primary">{inv.invoice_number}</p><p className="text-[10px] text-slate-600">{inv.buyer_name}</p></> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{METHOD_LABELS[p.method] ?? p.method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-200">{INR(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[p.status] ?? ''}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{p.reference_no || p.gateway_payment_id || '—'}</td>
                </tr>
              )
            })}
            {(payments ?? []).length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-600">No payments yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
