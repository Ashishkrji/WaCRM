import type {
  AutomationStepConfig,
  AutomationStepType,
  AutomationTriggerConfig,
  AutomationTriggerType,
} from '@/types'

export type TemplateSlug =
  | 'welcome_message'
  | 'out_of_office'
  | 'lead_qualifier'
  | 'follow_up_reminder'
  | 'sales_autopilot'
  | 'real_estate_followup'
  | 'ecommerce_cart'
  | 'coaching_inquiry'
  | 'agency_lead'

export interface TemplateStepSeed {
  step_type: AutomationStepType
  step_config: AutomationStepConfig
  branch?: 'yes' | 'no' | null
  /** Index (within this seed list) of the Condition parent, if nested. */
  parent_index?: number | null
}

export interface AutomationTemplateDefinition {
  slug: TemplateSlug
  name: string
  description: string
  trigger_type: AutomationTriggerType
  trigger_config: AutomationTriggerConfig
  steps: TemplateStepSeed[]
}

export const AUTOMATION_TEMPLATES: Record<TemplateSlug, AutomationTemplateDefinition> = {
  welcome_message: {
    slug: 'welcome_message',
    name: 'Welcome Message',
    description: 'Auto-reply to first-time contacts with a greeting.',
    // first_inbound_message (added in PR #33) catches both brand-new
    // contacts AND manually-added/imported contacts on their first-ever
    // reply, which is what a user setting up a "welcome" automation
    // almost always wants. new_contact_created would miss the
    // manually-imported case.
    trigger_type: 'first_inbound_message',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text: "Hi! 👋 Thanks for reaching out. We'll get back to you shortly.",
        },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: '' },
      },
    ],
  },
  out_of_office: {
    slug: 'out_of_office',
    name: 'Out of Office',
    description: 'Auto-reply during off-hours so nobody is left waiting.',
    trigger_type: 'new_message_received',
    trigger_config: {},
    steps: [
      {
        step_type: 'condition',
        step_config: {
          subject: 'time_of_day',
          operand: '18:00-09:00',
        },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Thanks for your message! Our team is offline right now (9am–6pm) and will reply first thing tomorrow.",
        },
        parent_index: 0,
        branch: 'yes',
      },
    ],
  },
  lead_qualifier: {
    slug: 'lead_qualifier',
    name: 'Lead Qualifier',
    description: 'Ask qualification questions to filter inbound leads.',
    trigger_type: 'keyword_match',
    trigger_config: {
      keywords: ['pricing', 'quote', 'buy'],
      match_type: 'contains',
    },
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Great — happy to help with pricing! Quick question: roughly how many seats are you looking for?",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 10, unit: 'minutes' },
      },
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
    ],
  },
  follow_up_reminder: {
    slug: 'follow_up_reminder',
    name: 'Follow-up Reminder',
    description: 'Send a nudge if a contact has not replied within 24 hours.',
    trigger_type: 'new_message_received',
    trigger_config: {},
    steps: [
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Just circling back — did you have any other questions for us? Happy to help!",
        },
      },
    ],
  },
  sales_autopilot: {
    slug: 'sales_autopilot',
    name: 'Sales Autopilot',
    description: 'Assign agent, welcome lead, follow-up, and create a pipeline deal.',
    trigger_type: 'new_contact_created',
    trigger_config: {},
    steps: [
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Hi there! 👋 Thanks for reaching out. An agent has been assigned to you and will review your request shortly.",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Just checking in to see if you got everything you needed! Let us know if you want to proceed.",
        },
      },
      {
        step_type: 'create_deal',
        step_config: { pipeline_id: '', stage_id: '', title: 'Autopilot Deal', value: 0 },
      },
    ],
  },
  real_estate_followup: {
    slug: 'real_estate_followup',
    name: 'Real Estate Follow-up',
    description: 'Automate site visit reminders and property lead tracking.',
    trigger_type: 'new_contact_created',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_message',
        step_config: { text: "Hi! Thanks for showing interest in our properties. When would you like to schedule a site visit?" },
      },
      {
        step_type: 'wait',
        step_config: { amount: 2, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: { text: "Just a quick reminder! Let me know if you are still interested in a site visit this week." },
      },
    ],
  },
  ecommerce_cart: {
    slug: 'ecommerce_cart',
    name: 'Abandoned Cart Recovery',
    description: 'Send automated reminders for abandoned carts.',
    trigger_type: 'keyword_match',
    trigger_config: { keywords: ['cart', 'checkout'], match_type: 'contains' },
    steps: [
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'hours' },
      },
      {
        step_type: 'send_message',
        step_config: { text: "Hi! We noticed you left something in your cart. Use code SAVE10 for 10% off if you checkout today!" },
      },
    ],
  },
  coaching_inquiry: {
    slug: 'coaching_inquiry',
    name: 'Student Admission Flow',
    description: 'Manage student inquiries and send fee reminders.',
    trigger_type: 'first_inbound_message',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_message',
        step_config: { text: "Welcome! Are you looking for admission details or fee structures?" },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: '' },
      },
    ],
  },
  agency_lead: {
    slug: 'agency_lead',
    name: 'Agency Lead Nurture',
    description: 'Nurture client leads and automatically assign to sales reps.',
    trigger_type: 'new_contact_created',
    trigger_config: {},
    steps: [
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
      {
        step_type: 'send_message',
        step_config: { text: "Thanks for reaching out to our agency! One of our growth experts will be with you shortly." },
      },
      {
        step_type: 'create_deal',
        step_config: { pipeline_id: '', stage_id: '', title: 'New Agency Lead', value: 0 },
      },
    ],
  },
}

export function getTemplate(slug: string): AutomationTemplateDefinition | null {
  return AUTOMATION_TEMPLATES[slug as TemplateSlug] ?? null
}
