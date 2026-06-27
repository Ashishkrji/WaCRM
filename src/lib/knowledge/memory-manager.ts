/**
 * AI Contact Memory Manager
 * Reads, writes, and summarizes contact memory for AI agents.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import type { SupabaseClient } from '@supabase/supabase-js'

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''
const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'

export interface MemoryItem {
  id: string
  memory_type: string
  content: string
  source: string
  confidence: number
  created_at: string
}

export interface ContactContext {
  name: string
  phone: string
  email: string | null
  memories: MemoryItem[]
  recentSummary: string | null
  tags: string[]
}

// ─────────────────────────────────────────────
// Load contact context for AI agent
// ─────────────────────────────────────────────

export async function loadContactContext(contactId: string, userId: string): Promise<ContactContext> {
  const db = supabaseAdmin()

  const [contactRes, memoriesRes, summaryRes, tagsRes] = await Promise.all([
    db.from('contacts').select('name, phone, email').eq('id', contactId).single(),
    db.from('contact_memories').select('*').eq('contact_id', contactId).eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(20),
    db.from('conversation_summaries').select('summary').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(1).single(),
    db.from('contact_tags').select('tags(name)').eq('contact_id', contactId).limit(10),
  ])

  return {
    name: contactRes.data?.name ?? 'Customer',
    phone: contactRes.data?.phone ?? '',
    email: contactRes.data?.email ?? null,
    memories: (memoriesRes.data ?? []) as MemoryItem[],
    recentSummary: summaryRes.data?.summary ?? null,
    tags: ((tagsRes.data ?? []) as Array<{ tags: { name: string } }>).map(t => t.tags?.name ?? '').filter(Boolean),
  }
}

// ─────────────────────────────────────────────
// Format context for AI prompt
// ─────────────────────────────────────────────

export function formatContextForPrompt(context: ContactContext): string {
  const lines: string[] = [
    `Customer: ${context.name}`,
    `Phone: ${context.phone}`,
    context.email ? `Email: ${context.email}` : '',
    context.tags.length > 0 ? `Tags: ${context.tags.join(', ')}` : '',
    '',
  ].filter(Boolean)

  if (context.memories.length > 0) {
    lines.push('Known Information:')
    for (const mem of context.memories.slice(0, 10)) {
      lines.push(`  [${mem.memory_type}] ${mem.content}`)
    }
    lines.push('')
  }

  if (context.recentSummary) {
    lines.push(`Previous Conversation Summary: ${context.recentSummary}`)
  }

  return lines.join('\n')
}

// ─────────────────────────────────────────────
// Store a new memory
// ─────────────────────────────────────────────

export async function storeMemory(params: {
  contactId: string
  userId: string
  type: string
  content: string
  source?: string
  confidence?: number
  expiresInDays?: number
  metadata?: Record<string, unknown>
}): Promise<void> {
  const db = supabaseAdmin()
  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86_400_000).toISOString()
    : null

  await db.from('contact_memories').insert({
    contact_id: params.contactId,
    user_id: params.userId,
    memory_type: params.type,
    content: params.content,
    source: params.source ?? 'ai',
    confidence: params.confidence ?? 0.9,
    expires_at: expiresAt,
    metadata: params.metadata ?? {},
  })
}

// ─────────────────────────────────────────────
// Extract memories from conversation
// ─────────────────────────────────────────────

export async function extractAndStoreMemories(
  conversation: string,
  contactId: string,
  userId: string,
): Promise<void> {
  const prompt = `Extract key facts, preferences, and important information from this customer conversation.
Return a JSON array of memory items with fields: type (fact|preference|goal|concern|product_interest), content.
Only extract clear, specific information. Conversation:
${conversation.slice(0, 4000)}`

  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          { role: 'system', content: 'You extract structured memory items from conversations. Always respond with valid JSON array.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!res.ok) return
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '[]'

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return

    const memories = JSON.parse(jsonMatch[0]) as Array<{ type: string; content: string }>

    for (const mem of memories) {
      if (mem.type && mem.content) {
        await storeMemory({ contactId, userId, type: mem.type, content: mem.content, source: 'ai' })
      }
    }
  } catch (err) {
    console.error('[memory] extraction failed:', err)
  }
}

// ─────────────────────────────────────────────
// Summarize conversation
// ─────────────────────────────────────────────

export async function summarizeConversation(params: {
  conversation: string
  contactId: string
  userId: string
  conversationId?: string
}): Promise<string | null> {
  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          { role: 'system', content: 'Summarize the customer conversation in 2-3 sentences. Include: main issue/request, outcome, and any follow-up needed.' },
          { role: 'user', content: params.conversation.slice(0, 6000) },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const summary = data.choices?.[0]?.message?.content ?? null
    if (!summary) return null

    const db = supabaseAdmin()
    await db.from('conversation_summaries').insert({
      contact_id: params.contactId,
      user_id: params.userId,
      conversation_id: params.conversationId,
      summary,
      sentiment: 'neutral',
    })

    return summary
  } catch {
    return null
  }
}
