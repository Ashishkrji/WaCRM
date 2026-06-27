import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import Link from 'next/link'
import { ArrowLeft, Clock, Shield, Users, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'Support Settings | WaCRM' }

export default async function SupportSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const [{ data: slaList }, { data: cannedList }] = await Promise.all([
    db.from('sla_policies').select('*').eq('user_id', user.id).order('name'),
    db.from('canned_responses').select('*').eq('user_id', user.id).order('title').limit(20),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/support" className="text-slate-500 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-100">Support Settings</h1>
      </div>

      {/* SLA Policies */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-slate-200">SLA Policies</h2>
          </div>
          <button className="text-xs text-primary hover:underline">+ New Policy</button>
        </div>
        <div className="space-y-3">
          {(slaList ?? []).map(sla => (
            <div key={sla.id} className={`rounded-lg border p-4 ${sla.is_default ? 'border-primary/30 bg-primary/5' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-200 text-sm">{sla.name} {sla.is_default && <span className="ml-2 text-[10px] text-primary border border-primary/30 rounded-full px-1.5 py-0.5">Default</span>}</p>
                  <p className="text-xs text-slate-500 mt-1">Applies to: {(sla.applies_to_priority as string[]).join(', ')}</p>
                </div>
                <button className="text-xs text-slate-500 hover:text-white">Edit</button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div><p className="text-slate-500">First Response</p><p className="text-slate-200 font-medium">{sla.first_response_hours}h</p></div>
                <div><p className="text-slate-500">Resolution</p><p className="text-slate-200 font-medium">{sla.resolution_hours}h</p></div>
                <div><p className="text-slate-500">Escalation</p><p className="text-slate-200 font-medium">{sla.escalation_hours ?? '—'}h</p></div>
              </div>
            </div>
          ))}
          {(slaList ?? []).length === 0 && <p className="text-sm text-slate-600 py-4 text-center">No SLA policies configured</p>}
        </div>
      </div>

      {/* Canned Responses */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-slate-200">Canned Responses</h2>
          </div>
          <button className="text-xs text-primary hover:underline">+ New Response</button>
        </div>
        {(cannedList ?? []).length === 0 ? (
          <p className="text-sm text-slate-600 py-4 text-center">No canned responses yet</p>
        ) : (
          <div className="space-y-2">
            {(cannedList ?? []).map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3 hover:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-200">{r.title}</p>
                  {r.shortcut && <p className="text-[10px] text-slate-600 font-mono">/{r.shortcut}</p>}
                </div>
                <button className="text-xs text-slate-500 hover:text-white">Edit</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
