import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { generateReport } from '@/lib/analytics/report-builder'

// GET /api/analytics/reports
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('bi_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}

// POST /api/analytics/reports — create report config OR generate report
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { action, report_id, format, name, report_type, config, export_format } = body

  // Generate an existing report
  if (action === 'generate' && report_id) {
    const result = await generateReport(report_id, user.id, format ?? 'json')
    if (!result) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    if (format === 'csv') {
      return new Response(result.csv ?? '', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${result.report_name}.csv"`,
        },
      })
    }
    return NextResponse.json({ result })
  }

  // Create a new report config
  if (!name || !report_type) {
    return NextResponse.json({ error: 'name and report_type required' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('bi_reports')
    .insert({ user_id: user.id, name, report_type, config: config ?? {}, export_format: export_format ?? 'pdf' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ report: data }, { status: 201 })
}
