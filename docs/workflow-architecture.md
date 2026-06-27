# Enterprise Workflow Automation Engine — Architecture

## Overview

The WaCRM Workflow Engine is a multi-node, graph-based automation system that connects every CRM module: WhatsApp, AI, Leads, Sales, Marketing, Meetings, Tasks, Notifications, Payments, Proposals, Quotations, and Customer Support.

## File Structure

```
src/
├── lib/
│   └── workflows/
│       ├── engine.ts           # Core execution graph walker
│       ├── ai-decision.ts      # NVIDIA NIM routing decisions
│       ├── approval.ts         # Human approval engine
│       ├── scheduler.ts        # Cron/interval scheduler
│       ├── webhook-manager.ts  # Webhook delivery & validation
│       └── templates.ts        # Pre-built template library
├── app/
│   └── api/
│       └── workflows/
│           ├── route.ts        # CRUD list/create
│           ├── [id]/route.ts   # CRUD get/patch/delete
│           ├── [id]/execute/route.ts  # Manual trigger
│           ├── engine/route.ts # Trigger dispatch endpoint
│           ├── approvals/route.ts     # List pending
│           ├── approvals/[id]/route.ts # Approve/reject
│           ├── schedules/route.ts     # Schedule management
│           ├── webhooks/route.ts      # Webhook management
│           └── cron/route.ts          # Cron processor
├── components/
│   └── workflows/
│       ├── workflow-builder.tsx    # Visual canvas builder
│       ├── approval-manager.tsx    # Approval UI
│       └── template-gallery.tsx   # Template browser
└── app/(dashboard)/
    └── workflows/
        ├── page.tsx           # Workflow list
        ├── new/page.tsx       # Create workflow
        ├── [id]/page.tsx      # Edit workflow
        └── templates/page.tsx # Template gallery
```

## Node Types

| Type       | Purpose |
|------------|---------|
| `trigger`  | Entry point — starts the workflow on a CRM event |
| `condition`| Branches on a boolean check (yes/no) |
| `decision` | NVIDIA AI routes to optimal branch |
| `delay`    | Parks execution for minutes/hours/days/weeks |
| `loop`     | Repeats a sequence |
| `approval` | Pauses for human approval (sequential/parallel/any_one) |
| `action`   | Executes a CRM action (send_message, create_task, etc.) |
| `webhook`  | Delivers to an external HTTP endpoint |
| `ai_node`  | Runs a specialized AI agent (SEO, website, GST, etc.) |
| `end`      | Terminates the workflow |

## Trigger Events

All CRM events that can start a workflow:

- `new_message_received`
- `first_inbound_message`
- `keyword_match`
- `new_contact_created`
- `conversation_assigned`
- `tag_added`
- `deal_stage_changed`
- `invoice_generated`
- `payment_received`
- `task_created` / `task_completed`
- `campaign_started` / `campaign_completed`
- `customer_replied` / `customer_inactive`
- `support_ticket_created`
- `meeting_scheduled` / `meeting_completed`
- `webhook_received`
- `scheduled_time`
- `custom_event`

## Database Schema

Tables added in `028_workflow_engine_extensions.sql`:

- `workflow_nodes` — canvas nodes (position + config)
- `workflow_edges` — connections between nodes
- `workflow_approvals` — approval requests
- `workflow_schedules` — scheduled triggers
- `workflow_webhooks` — webhook configurations
- `workflow_webhook_logs` — delivery audit log
- `workflow_templates` — saved template definitions
- `ai_routing_decisions` — AI decision audit log
- `workflow_pending_delays` — parked delay resumptions
- `workflow_versions` — version history

## Execution Flow

```
Trigger Event
    ↓
runWorkflowsForTrigger() [fire-and-forget]
    ↓
executeWorkflow() → creates execution record
    ↓
walkNodes() → graph DFS traversal
    ↓
Node handlers (condition/action/webhook/ai/approval)
    ↓
Branch to next node(s) via edges
    ↓
finalizeExecution() → update status & step logs
```

## AI Integration (NVIDIA NIM)

The `ai-decision.ts` module uses `nvidia/llama-3.1-nemotron-70b-instruct` to:
1. Detect customer intent (seo_inquiry, website_development, gst_consulting, etc.)
2. Analyze sentiment
3. Choose the optimal workflow branch
4. Log every decision to `ai_routing_decisions`

## Scheduling

The cron endpoint `/api/workflows/cron` should be called every minute by:
- Vercel Cron (vercel.json)
- GitHub Actions scheduled workflow
- External cron service

```json
// vercel.json
{
  "crons": [
    { "path": "/api/workflows/cron", "schedule": "* * * * *" }
  ]
}
```

Set `CRON_SECRET` environment variable to protect the endpoint.

## Pre-built Templates (8 included)

1. **AI Lead Qualification** — Score and route new leads automatically
2. **WhatsApp Welcome Sequence** — Multi-message onboarding series
3. **Payment Reminder Automation** — Invoice follow-up with escalation
4. **Deal Won — Onboarding Kickoff** — Post-deal celebration and task creation
5. **AI-Powered Support Routing** — Intent detection → department routing
6. **Inactive Customer Re-engagement** — 30-day win-back sequence
7. **Proposal Approval & Send** — Internal approval before client delivery
8. **Post-Meeting Follow-Up** — Thank you + task + check-in sequence
