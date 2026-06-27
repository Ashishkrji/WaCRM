import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { WorkflowBuilder } from '@/components/workflows/workflow-builder'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = supabaseAdmin()
  const { data } = await db.from('workflows').select('name').eq('id', id).single()
  return { title: `${data?.name ?? 'Workflow'} | WaCRM` }
}

export default async function WorkflowDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const [wfRes, nodesRes, edgesRes] = await Promise.all([
    db.from('workflows').select('*').eq('id', id).eq('user_id', user.id).single(),
    db.from('workflow_nodes').select('*').eq('workflow_id', id),
    db.from('workflow_edges').select('*').eq('workflow_id', id),
  ])

  if (wfRes.error || !wfRes.data) notFound()

  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkflowBuilder
        initial={{
          id: wfRes.data.id,
          name: wfRes.data.name,
          description: wfRes.data.description,
          trigger_type: wfRes.data.trigger_type,
          category: wfRes.data.category,
          nodes: nodesRes.data ?? [],
          edges: edgesRes.data ?? [],
          is_active: wfRes.data.is_active,
          status: wfRes.data.status,
        }}
      />
    </div>
  )
}
