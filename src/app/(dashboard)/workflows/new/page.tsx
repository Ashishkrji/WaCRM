import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkflowBuilder } from '@/components/workflows/workflow-builder'

export const metadata: Metadata = {
  title: 'Workflow Builder | WaCRM',
  description: 'Build and automate enterprise workflows',
}

export default async function NewWorkflowPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkflowBuilder />
    </div>
  )
}
