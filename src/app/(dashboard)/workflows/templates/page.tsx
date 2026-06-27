import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateGallery } from '@/components/workflows/template-gallery'

export const metadata: Metadata = { title: 'Workflow Templates | WaCRM', description: 'Pre-built workflow templates' }

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Workflow Templates</h1>
        <p className="mt-1 text-sm text-slate-500">Start with a pre-built template and customize for your business</p>
      </div>
      <TemplateGallery />
    </div>
  )
}
