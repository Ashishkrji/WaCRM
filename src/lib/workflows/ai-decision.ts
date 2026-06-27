/**
 * AI Decision Engine
 *
 * Uses NVIDIA NIM to make intelligent routing decisions during workflow execution.
 * Detects intent, sentiment, lead score, and routes to the optimal branch.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import type { WorkflowContext } from './engine'

export interface AIDecisionInput {
  context: WorkflowContext
  nodeConfig: Record<string, unknown>
  workflowId: string
  userId: string
  executionId: string
}

export interface AIDecisionResult {
  chosen_branch: string
  intent: string
  sentiment: string
  confidence: number
  reasoning: string
  routing_target?: string
}

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1'
const DEFAULT_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

/**
 * Make an AI-powered routing decision based on the workflow context.
 * Falls back to 'default' branch on any error.
 */
export async function makeAIDecision(input: AIDecisionInput): Promise<AIDecisionResult> {
  const t0 = Date.now()
  const apiKey = process.env.NVIDIA_API_KEY
  const model = String(input.nodeConfig.model ?? DEFAULT_MODEL)

  const fallback: AIDecisionResult = {
    chosen_branch: 'default',
    intent: 'unknown',
    sentiment: 'neutral',
    confidence: 0,
    reasoning: 'AI decision skipped (no API key or error)',
  }

  if (!apiKey) {
    console.warn('[ai-decision] NVIDIA_API_KEY not set — using fallback')
    return fallback
  }

  const prompt = buildDecisionPrompt(input)

  try {
    const res = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an enterprise CRM AI decision engine. 
Analyze the customer context and workflow configuration, then return a JSON object with:
- chosen_branch: the routing branch to take (e.g. "seo_agent", "sales_team", "human_escalation", "default")
- intent: the detected customer intent (e.g. "seo_inquiry", "website_quote", "support_request")
- sentiment: "positive", "neutral", "negative"
- confidence: a float 0.0–1.0
- reasoning: brief explanation
- routing_target: specific team or agent to route to (optional)

Respond ONLY with valid JSON.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      console.error('[ai-decision] NVIDIA API error:', res.status)
      return fallback
    }

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as AIDecisionResult

    const result: AIDecisionResult = {
      chosen_branch: parsed.chosen_branch ?? 'default',
      intent: parsed.intent ?? 'unknown',
      sentiment: parsed.sentiment ?? 'neutral',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0))),
      reasoning: parsed.reasoning ?? '',
      routing_target: parsed.routing_target,
    }

    // Log to Supabase
    await logDecision(input, model, result, data, Date.now() - t0)

    return result
  } catch (err) {
    console.error('[ai-decision] failed:', err)
    return fallback
  }
}

/**
 * Detect intent from a customer message (standalone, used in chat flow)
 */
export async function detectIntent(
  message: string,
  userId: string,
  contactId?: string,
): Promise<{ intent: string; sentiment: string; confidence: number; routing: string }> {
  const apiKey = process.env.NVIDIA_API_KEY

  const fallback = { intent: 'general', sentiment: 'neutral', confidence: 0.5, routing: 'default' }
  if (!apiKey) return fallback

  try {
    const res = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Classify this customer message for an Indian digital agency (MaaJanki Web Tech).
Return JSON: { intent, sentiment, confidence, routing }
Intent options: seo_inquiry, website_development, gst_consulting, support_request, pricing_inquiry, meeting_request, payment_query, general
Sentiment: positive|neutral|negative
Routing: seo_agent|website_consultant|gst_consultant|sales_team|support_team|default`,
          },
          { role: 'user', content: message },
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return fallback
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    return {
      intent: parsed.intent ?? 'general',
      sentiment: parsed.sentiment ?? 'neutral',
      confidence: Number(parsed.confidence ?? 0.5),
      routing: parsed.routing ?? 'default',
    }
  } catch {
    return fallback
  }
}

/**
 * Analyze customer sentiment from conversation history
 */
export async function analyzeSentiment(
  messages: Array<{ role: string; content: string }>,
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string }> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey || messages.length === 0) return { sentiment: 'neutral', score: 0.5, summary: '' }

  try {
    const res = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment of this conversation. Return JSON: { sentiment: "positive"|"negative"|"neutral", score: 0.0-1.0, summary: "one sentence" }`,
          },
          {
            role: 'user',
            content: messages.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n'),
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return { sentiment: 'neutral', score: 0.5, summary: '' }
    const data = await res.json()
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}')
    return {
      sentiment: parsed.sentiment ?? 'neutral',
      score: Number(parsed.score ?? 0.5),
      summary: parsed.summary ?? '',
    }
  } catch {
    return { sentiment: 'neutral', score: 0.5, summary: '' }
  }
}

/**
 * Generate AI-powered business insights from aggregated data
 */
export async function generateBusinessInsights(
  userId: string,
  metrics: Record<string, unknown>,
): Promise<Array<{ title: string; body: string; sentiment: string; action?: string; priority: number }>> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a business intelligence AI for an Indian digital agency.
Analyze the metrics and generate 3–5 actionable insights.
Return JSON array: [{ title, body, sentiment: "positive"|"negative"|"neutral"|"warning", action, priority: 1-5 }]
Priority 1 = most urgent. Be specific, actionable, and concise.`,
          },
          { role: 'user', content: `Business metrics:\n${JSON.stringify(metrics, null, 2)}` },
        ],
        temperature: 0.4,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return []
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? '{"insights":[]}'
    const parsed = JSON.parse(raw)
    const insights = Array.isArray(parsed) ? parsed : (parsed.insights ?? [])
    return insights.slice(0, 5)
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildDecisionPrompt(input: AIDecisionInput): string {
  const { context, nodeConfig } = input
  const parts = [
    `Customer message: ${String(context.vars.message_text ?? 'No message')}`,
    `Contact ID: ${context.contact_id ?? 'Unknown'}`,
    `Trigger: ${context.trigger_event}`,
    `Variables: ${JSON.stringify(context.vars)}`,
    `Node config: ${JSON.stringify(nodeConfig)}`,
    `Available branches: ${JSON.stringify((nodeConfig.branches as string[]) ?? ['default', 'yes', 'no'])}`,
  ]
  return parts.join('\n')
}

async function logDecision(
  input: AIDecisionInput,
  model: string,
  result: AIDecisionResult,
  rawResponse: unknown,
  latencyMs: number,
): Promise<void> {
  try {
    const db = supabaseAdmin()
    await db.from('ai_routing_decisions').insert({
      user_id: input.userId,
      workflow_id: input.workflowId,
      execution_id: input.executionId,
      contact_id: input.context.contact_id ?? null,
      input_context: {
        message: input.context.vars.message_text,
        trigger: input.context.trigger_event,
        vars: input.context.vars,
      },
      model,
      intent: result.intent,
      sentiment: result.sentiment,
      confidence: result.confidence,
      decision: result.chosen_branch,
      raw_response: rawResponse as Record<string, unknown>,
      latency_ms: latencyMs,
    })
  } catch (err) {
    console.error('[ai-decision] logging failed:', err)
  }
}
