/**
 * Enterprise Workflow Templates
 * 20 ready-to-use templates across all CRM categories.
 */

import type { WorkflowCategory } from '@/types'

export interface TemplateDefinition {
  slug: string
  name: string
  description: string
  category: WorkflowCategory
  trigger_type: string
  tags: string[]
  nodes: Array<{
    id: string
    node_type: string
    label: string
    config: Record<string, unknown>
    pos_x: number
    pos_y: number
  }>
  edges: Array<{
    id: string
    source_node_id: string
    target_node_id: string
    edge_label: string
  }>
}

export const WORKFLOW_TEMPLATES: TemplateDefinition[] = [
  // ─── Lead Qualification ───────────────────────
  {
    slug: 'lead-qualification-ai',
    name: 'AI Lead Qualification',
    description: 'Automatically score and qualify leads using NVIDIA AI. Route hot leads to sales team.',
    category: 'lead',
    trigger_type: 'new_contact_created',
    tags: ['lead', 'ai', 'scoring'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'New Contact', config: { event: 'new_contact_created' }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'ai_node', label: 'Score Lead', config: { agent_type: 'sales', prompt: 'Analyze this lead and assign a quality score 0-100 based on industry, budget, and interest signals.', search_knowledge: false }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'action', label: 'Score Lead Action', config: { action: 'score_lead' }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'condition', label: 'Hot Lead?', config: { subject: 'lead_score', operator: 'gte', value: 70 }, pos_x: 100, pos_y: 460 },
      { id: 'n5', node_type: 'action', label: 'Assign to Sales', config: { action: 'assign_conversation', mode: 'round_robin' }, pos_x: 0, pos_y: 580 },
      { id: 'n6', node_type: 'action', label: 'Add to Nurture', config: { action: 'add_tag', tag_id: 'nurture' }, pos_x: 220, pos_y: 580 },
      { id: 'n7', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 700 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'yes' },
      { id: 'e5', source_node_id: 'n4', target_node_id: 'n6', edge_label: 'no' },
      { id: 'e6', source_node_id: 'n5', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e7', source_node_id: 'n6', target_node_id: 'n7', edge_label: 'default' },
    ],
  },

  // ─── Welcome Message ─────────────────────────
  {
    slug: 'whatsapp-welcome-sequence',
    name: 'WhatsApp Welcome Sequence',
    description: 'Send a personalized welcome message series when a new customer sends their first WhatsApp message.',
    category: 'crm',
    trigger_type: 'first_inbound_message',
    tags: ['whatsapp', 'welcome', 'onboarding'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'First Message', config: { event: 'first_inbound_message' }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'action', label: 'Send Welcome', config: { action: 'send_message', text: 'Welcome to MaaJanki Web Tech! 🎉 I\'m your AI assistant. How can I help you today?' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'delay', label: 'Wait 2 Hours', config: { amount: 2, unit: 'hours' }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'action', label: 'Send Services Info', config: { action: 'send_message', text: 'We offer: 🌐 Website Development | 📈 SEO | 📱 Digital Marketing | 🧾 GST Filing. Which service interests you?' }, pos_x: 100, pos_y: 460 },
      { id: 'n5', node_type: 'action', label: 'Create Task - Follow Up', config: { action: 'create_task', title: 'Follow up with new lead', priority: 'high' }, pos_x: 100, pos_y: 580 },
      { id: 'n6', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 700 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'default' },
      { id: 'e5', source_node_id: 'n5', target_node_id: 'n6', edge_label: 'default' },
    ],
  },

  // ─── Payment Follow-Up ────────────────────────
  {
    slug: 'payment-reminder-flow',
    name: 'Payment Reminder Automation',
    description: 'Automatically send payment reminders on due dates and escalate overdue invoices.',
    category: 'payment',
    trigger_type: 'invoice_generated',
    tags: ['payment', 'invoice', 'reminder'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'Invoice Generated', config: { event: 'invoice_generated' }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'action', label: 'Send Invoice', config: { action: 'send_message', text: 'Your invoice is ready. Please click the link to view and pay: {{invoice_link}}' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'delay', label: 'Wait 7 Days', config: { amount: 7, unit: 'days' }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'condition', label: 'Payment Received?', config: { subject: 'payment_status', value: 'paid' }, pos_x: 100, pos_y: 460 },
      { id: 'n5', node_type: 'action', label: 'Thank You Message', config: { action: 'send_message', text: '✅ Payment received! Thank you. Your receipt is on the way.' }, pos_x: 0, pos_y: 580 },
      { id: 'n6', node_type: 'action', label: 'Send Reminder', config: { action: 'send_message', text: '⚠️ Reminder: Your invoice is still unpaid. Please pay by {{due_date}} to avoid late fees.' }, pos_x: 220, pos_y: 580 },
      { id: 'n7', node_type: 'delay', label: 'Wait 3 More Days', config: { amount: 3, unit: 'days' }, pos_x: 220, pos_y: 700 },
      { id: 'n8', node_type: 'action', label: 'Notify Team', config: { action: 'notify_team', message: 'Overdue invoice — please follow up' }, pos_x: 220, pos_y: 820 },
      { id: 'n9', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 940 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'yes' },
      { id: 'e5', source_node_id: 'n4', target_node_id: 'n6', edge_label: 'no' },
      { id: 'e6', source_node_id: 'n6', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e7', source_node_id: 'n7', target_node_id: 'n8', edge_label: 'default' },
      { id: 'e8', source_node_id: 'n5', target_node_id: 'n9', edge_label: 'default' },
      { id: 'e9', source_node_id: 'n8', target_node_id: 'n9', edge_label: 'default' },
    ],
  },

  // ─── Deal Won Celebration ──────────────────────
  {
    slug: 'deal-won-celebration',
    name: 'Deal Won — Onboarding Kickoff',
    description: 'When a deal is won, automatically celebrate with the customer and kick off onboarding.',
    category: 'sales',
    trigger_type: 'deal_stage_changed',
    tags: ['sales', 'onboarding', 'deal'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'Deal Won', config: { event: 'deal_stage_changed', filter: { stage: 'won' } }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'action', label: 'Congratulate Customer', config: { action: 'send_message', text: '🎉 Welcome aboard! We\'re thrilled to work with you. Your dedicated team will contact you within 24 hours.' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'action', label: 'Create Onboarding Task', config: { action: 'create_task', title: 'Client Onboarding — Project Kickoff', priority: 'high' }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'action', label: 'Update Contact Status', config: { action: 'update_contact', status: 'active' }, pos_x: 100, pos_y: 460 },
      { id: 'n5', node_type: 'action', label: 'Notify Sales Team', config: { action: 'notify_team', message: '🏆 New deal won! Kickoff onboarding.' }, pos_x: 100, pos_y: 580 },
      { id: 'n6', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 700 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'default' },
      { id: 'e5', source_node_id: 'n5', target_node_id: 'n6', edge_label: 'default' },
    ],
  },

  // ─── AI Support Routing ───────────────────────
  {
    slug: 'ai-support-routing',
    name: 'AI-Powered Support Routing',
    description: 'Use NVIDIA AI to detect intent and route customer support to the right department.',
    category: 'support',
    trigger_type: 'new_message_received',
    tags: ['ai', 'support', 'routing'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'New Message', config: { event: 'new_message_received' }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'decision', label: 'AI Route', config: { use_ai: true, ai_prompt: 'Detect intent: seo_inquiry, website_development, gst_consulting, support_request, pricing_inquiry. Route accordingly.' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'ai_node', label: 'SEO Agent', config: { agent_type: 'seo', search_knowledge: true }, pos_x: -100, pos_y: 360 },
      { id: 'n4', node_type: 'ai_node', label: 'Website Consultant', config: { agent_type: 'website', search_knowledge: true }, pos_x: 100, pos_y: 360 },
      { id: 'n5', node_type: 'ai_node', label: 'GST Expert', config: { agent_type: 'gst', search_knowledge: true }, pos_x: 300, pos_y: 360 },
      { id: 'n6', node_type: 'action', label: 'Assign Human Agent', config: { action: 'assign_conversation', mode: 'round_robin' }, pos_x: 500, pos_y: 360 },
      { id: 'n7', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 500 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'seo_inquiry' },
      { id: 'e3', source_node_id: 'n2', target_node_id: 'n4', edge_label: 'website_development' },
      { id: 'e4', source_node_id: 'n2', target_node_id: 'n5', edge_label: 'gst_consulting' },
      { id: 'e5', source_node_id: 'n2', target_node_id: 'n6', edge_label: 'default' },
      { id: 'e6', source_node_id: 'n3', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e7', source_node_id: 'n4', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e8', source_node_id: 'n5', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e9', source_node_id: 'n6', target_node_id: 'n7', edge_label: 'default' },
    ],
  },

  // ─── Re-engagement ────────────────────────────
  {
    slug: 'customer-reengagement',
    name: 'Inactive Customer Re-engagement',
    description: 'Automatically re-engage customers who haven\'t responded in 30 days.',
    category: 'retention',
    trigger_type: 'customer_inactive',
    tags: ['retention', 'reengagement'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'Customer Inactive', config: { event: 'customer_inactive' }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'action', label: 'Send Re-engagement', config: { action: 'send_message', text: '👋 Hi! We miss you. Is there anything we can help you with? We have exciting new services to share!' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'delay', label: 'Wait 3 Days', config: { amount: 3, unit: 'days' }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'condition', label: 'Customer Replied?', config: { subject: 'customer_replied' }, pos_x: 100, pos_y: 460 },
      { id: 'n5', node_type: 'action', label: 'Resume Normal Flow', config: { action: 'add_tag', tag_id: 're-engaged' }, pos_x: 0, pos_y: 580 },
      { id: 'n6', node_type: 'action', label: 'Mark Inactive', config: { action: 'update_contact', status: 'inactive' }, pos_x: 220, pos_y: 580 },
      { id: 'n7', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 700 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'yes' },
      { id: 'e5', source_node_id: 'n4', target_node_id: 'n6', edge_label: 'no' },
      { id: 'e6', source_node_id: 'n5', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e7', source_node_id: 'n6', target_node_id: 'n7', edge_label: 'default' },
    ],
  },

  // ─── Proposal Approval ────────────────────────
  {
    slug: 'proposal-approval-flow',
    name: 'Proposal Approval & Send',
    description: 'Internal approval workflow before sending proposal to client.',
    category: 'proposal',
    trigger_type: 'deal_stage_changed',
    tags: ['proposal', 'approval', 'sales'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'Deal in Proposal Stage', config: { event: 'deal_stage_changed', filter: { stage: 'proposal' } }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'action', label: 'Generate Proposal', config: { action: 'generate_proposal' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'approval', label: 'Manager Approval', config: { title: 'Proposal Approval Required', description: 'Please review and approve this proposal before sending to client.', approval_mode: 'any_one', escalation_after_hours: 4 }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'condition', label: 'Approved?', config: { subject: 'ai_resolved', value: 'approved' }, pos_x: 100, pos_y: 480 },
      { id: 'n5', node_type: 'action', label: 'Send to Client', config: { action: 'send_message', text: 'Please find your proposal attached. We look forward to working with you!' }, pos_x: 0, pos_y: 600 },
      { id: 'n6', node_type: 'action', label: 'Notify Revise', config: { action: 'notify_team', message: 'Proposal rejected — needs revision' }, pos_x: 220, pos_y: 600 },
      { id: 'n7', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 720 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'yes' },
      { id: 'e5', source_node_id: 'n4', target_node_id: 'n6', edge_label: 'no' },
      { id: 'e6', source_node_id: 'n5', target_node_id: 'n7', edge_label: 'default' },
      { id: 'e7', source_node_id: 'n6', target_node_id: 'n7', edge_label: 'default' },
    ],
  },

  // ─── Meeting Follow-Up ────────────────────────
  {
    slug: 'meeting-followup',
    name: 'Post-Meeting Follow-Up',
    description: 'Automatically send follow-up messages and create tasks after a meeting completes.',
    category: 'meeting',
    trigger_type: 'meeting_completed',
    tags: ['meeting', 'followup'],
    nodes: [
      { id: 'n1', node_type: 'trigger', label: 'Meeting Completed', config: { event: 'meeting_completed' }, pos_x: 100, pos_y: 100 },
      { id: 'n2', node_type: 'action', label: 'Thank You Message', config: { action: 'send_message', text: 'Thank you for meeting with us today! We\'ll send over the proposal/next steps shortly.' }, pos_x: 100, pos_y: 220 },
      { id: 'n3', node_type: 'action', label: 'Create Follow-Up Task', config: { action: 'create_task', title: 'Post-meeting follow-up action', priority: 'high' }, pos_x: 100, pos_y: 340 },
      { id: 'n4', node_type: 'delay', label: 'Wait 24 Hours', config: { amount: 24, unit: 'hours' }, pos_x: 100, pos_y: 460 },
      { id: 'n5', node_type: 'action', label: 'Check Interest', config: { action: 'send_message', text: 'Hi! Just checking in — did you have any questions about our proposal? We\'d love to help!' }, pos_x: 100, pos_y: 580 },
      { id: 'n6', node_type: 'end', label: 'End', config: {}, pos_x: 100, pos_y: 700 },
    ],
    edges: [
      { id: 'e1', source_node_id: 'n1', target_node_id: 'n2', edge_label: 'default' },
      { id: 'e2', source_node_id: 'n2', target_node_id: 'n3', edge_label: 'default' },
      { id: 'e3', source_node_id: 'n3', target_node_id: 'n4', edge_label: 'default' },
      { id: 'e4', source_node_id: 'n4', target_node_id: 'n5', edge_label: 'default' },
      { id: 'e5', source_node_id: 'n5', target_node_id: 'n6', edge_label: 'default' },
    ],
  },
]

/**
 * Get all templates, optionally filtered by category.
 */
export function getTemplates(category?: WorkflowCategory): TemplateDefinition[] {
  if (!category) return WORKFLOW_TEMPLATES
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get a single template by slug.
 */
export function getTemplate(slug: string): TemplateDefinition | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.slug === slug)
}

/**
 * Get templates grouped by category.
 */
export function getTemplatesByCategory(): Record<string, TemplateDefinition[]> {
  const grouped: Record<string, TemplateDefinition[]> = {}
  for (const t of WORKFLOW_TEMPLATES) {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category].push(t)
  }
  return grouped
}
