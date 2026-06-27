import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { getAIConfig, saveProviderConfig, SUPPORTED_PROVIDERS } from '@/lib/admin/ai-config-manager'
import { auditLog } from '@/lib/admin/audit-logger'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const config = await getAIConfig(auth.user.id)
  return NextResponse.json({ config, supported_providers: SUPPORTED_PROVIDERS })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  if (!body?.provider) return NextResponse.json({ error: 'provider required' }, { status: 400 })

  await saveProviderConfig(auth.user.id, body.provider, {
    isEnabled: body.is_enabled,
    priority: body.priority,
    defaultModel: body.default_model,
    temperature: body.temperature,
    maxTokens: body.max_tokens,
    streaming: body.streaming,
    monthlyCostLimit: body.monthly_cost_limit,
    monthlyRequestLimit: body.monthly_request_limit,
  })

  await auditLog({ userId: auth.user.id, action: 'ai.config.updated', module: 'ai_providers', newValue: body })
  return NextResponse.json({ success: true })
}
