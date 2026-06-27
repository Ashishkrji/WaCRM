/**
 * BI Report Builder
 * Generates CSV, JSON exports and schedules delivery for saved reports.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import type { BiReport, BiReportConfig } from '@/types'
import {
  loadSalesAnalytics,
  loadCustomerAnalytics,
  loadEmployeeAnalytics,
  loadAIAnalytics,
  loadMarketingAnalytics,
  loadFinancialAnalytics,
} from './queries'

export type ReportFormat = 'json' | 'csv'

export interface GeneratedReport {
  report_id: string
  report_name: string
  format: ReportFormat
  data: unknown
  csv?: string
  generated_at: string
  row_count: number
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export async function generateReport(
  reportId: string,
  userId: string,
  format: ReportFormat = 'json',
): Promise<GeneratedReport | null> {
  const db = supabaseAdmin()

  const { data: report, error } = await db
    .from('bi_reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single()

  if (error || !report) return null

  const r = report as BiReport
  const data = await fetchReportData(r, userId)

  // Update stats
  await db
    .from('bi_reports')
    .update({ last_generated_at: new Date().toISOString(), generate_count: r.generate_count + 1 })
    .eq('id', reportId)

  const rows = Array.isArray(data) ? data : [data]
  const csv = format === 'csv' ? toCSV(rows) : undefined

  return {
    report_id: reportId,
    report_name: r.name,
    format,
    data,
    csv,
    generated_at: new Date().toISOString(),
    row_count: rows.length,
  }
}

// ─────────────────────────────────────────────
// Data fetchers per report type
// ─────────────────────────────────────────────

async function fetchReportData(report: BiReport, userId: string): Promise<unknown> {
  const db = supabaseAdmin()
  const config = report.config as BiReportConfig
  const range = config.date_range && 'preset' in config.date_range
    ? parsePreset(config.date_range.preset)
    : 30

  switch (report.report_type) {
    case 'sales':
      return loadSalesAnalytics(db, range)

    case 'customers':
      return loadCustomerAnalytics(db)

    case 'employees':
      return loadEmployeeAnalytics(db)

    case 'ai':
      return loadAIAnalytics(db, range)

    case 'marketing':
      return loadMarketingAnalytics(db, range)

    case 'financial':
      return loadFinancialAnalytics(db)

    case 'custom': {
      // Raw query from analytics_snapshots with filters
      let query = db
        .from('analytics_snapshots')
        .select((config.columns ?? ['*']).join(','))
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(config.limit ?? 100)

      if (config.date_range && 'from' in config.date_range) {
        query = query.gte('snapshot_date', config.date_range.from)
        if (config.date_range.to) query = query.lte('snapshot_date', config.date_range.to)
      }

      const { data } = await query
      return applyFilters(data ?? [], config)
    }

    default:
      return []
  }
}

// ─────────────────────────────────────────────
// CSV exporter
// ─────────────────────────────────────────────

function toCSV(rows: unknown[]): string {
  if (!rows || rows.length === 0) return ''
  const flat = rows.map((r) => flattenObject(r as Record<string, unknown>))
  const headers = Array.from(new Set(flat.flatMap((r) => Object.keys(r))))
  const csvLines = [
    headers.join(','),
    ...flat.map((r) =>
      headers.map((h) => {
        const v = r[h]
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }).join(',')
    ),
  ]
  return csvLines.join('\n')
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v as Record<string, unknown>, key))
    } else {
      result[key] = Array.isArray(v) ? JSON.stringify(v) : String(v ?? '')
    }
  }
  return result
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parsePreset(preset: string): number {
  switch (preset) {
    case 'last_7_days': return 7
    case 'last_30_days': return 30
    case 'last_90_days': return 90
    case 'last_year': return 365
    default: return 30
  }
}

function applyFilters(data: Record<string, unknown>[], config: BiReportConfig): unknown[] {
  let result = [...data]
  if (config.sort_by) {
    result = result.sort((a, b) => {
      const aVal = a[config.sort_by!] as number
      const bVal = b[config.sort_by!] as number
      return config.sort_dir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }
  if (config.limit) result = result.slice(0, config.limit)
  return result
}
