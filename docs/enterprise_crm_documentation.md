# Enterprise CRM Module Documentation — WaCRM

This comprehensive reference manual documents the design, data flows, permission configurations, database architecture, and extension interfaces for the WaCRM Enterprise CRM modules.

---

## 1. CRM Architecture Diagram
The high-level integration diagram below shows how the Next.js App Router synchronizes activities in real time between the Meta WhatsApp Cloud API, Supabase (relational CRM operations), MongoDB Atlas (AI context, memory, and analytics), and the NVIDIA AI NIM engine.

```mermaid
graph TD
    %% Define Nodes
    Client[WhatsApp Client]
    Meta[Meta Cloud API]
    Next[Next.js App Router / VPS]
    Supa[Supabase Postgres DB]
    Mongo[MongoDB Atlas AI DB]
    Nvidia[NVIDIA AI NIM Engine]
    WebClient[Teammate Web Dashboard]

    %% Connections
    Client <-->|WhatsApp Message| Meta
    Meta <-->|JSON Webhook POST / send API| Next
    Next <-->|SQL Queries / Realtime Channels| Supa
    Next <-->|JSON Documents / Vector RAG| Mongo
    Next <-->|Streaming Chat / Embeddings API| Nvidia
    Next <-->|Server-Sent Events / SSE| WebClient
```

---

## 2. Inbox Flow
The inbox routing system governs how a message is received, checked for collision triggers, updated for presence, assigned to agents, and resolved.

```mermaid
graph TD
    %% Nodes
    A[Inbound WhatsApp Message] --> B{Is Conversation Open?}
    B -->|No| C[Initialize Conversation & set Unassigned]
    B -->|Yes| D[Find Conversation Status]
    
    C --> E[Verify Agent Presence & Lock Status]
    D --> E
    
    E --> F{Is Agent Typing in Thread?}
    F -->|Yes| G[Display Collision Alert banner & Lock Composer]
    F -->|No| H[Leave Composer Active]
    
    G --> I{Is Admin Overriding Lock?}
    I -->|Yes| H
    I -->|No| J[Reject non-admin keystrokes]
    
    H --> K[Draft Reply manually or request AI Suggestion]
    K --> L[Message Sent to Meta Cloud API]
    L --> M[Update SLA metrics & last_activity_at]
```

---

## 3. Lead Pipeline Diagram
The sales pipeline monitors customer progress from acquisition to deal closing, integrating weighted revenue calculations (Value × Probability) per stage.

```mermaid
graph LR
    %% Lead Stages Flow
    New[New Lead] --> Contacted[Contacted]
    Contacted --> Qualified[Qualified]
    Qualified --> PropSent[Proposal Sent]
    PropSent --> Neg[Negotiation]
    Neg --> MeetSched[Meeting Scheduled]
    MeetSched --> Won[Won]
    MeetSched --> Lost[Lost]
    MeetSched --> Hold[On Hold]

    %% Pipeline Calculations Callout
    subgraph Revenue Forecast System
        StageTotal["Column Header Stage Total: SUM(deal_value)"]
        WeightedForecast["Weighted Expected Revenue: SUM(deal_value × probability %)"]
    end
```

---

## 4. Customer Timeline Diagram
The unified activity timeline aggregates relational business logs from Supabase and semantic AI intelligence from MongoDB, compiling them into a single chronological feed.

```mermaid
graph TD
    %% Sources
    subgraph Supabase Relational Events
        Msg[WhatsApp Messages]
        Call[Call Bookings]
        Meet[Meetings Scheduled]
        Prop[Proposals Sent]
        Inv[Invoices Generated]
        Pay[Payments Cleared]
        Task[Tasks Created/Closed]
    end

    subgraph MongoDB AI Context
        Note[Internal Discussion Notes]
        Sum[AI Conversation Summaries]
        Rec[AI Next-Step Recommendations]
        Score[AI Lead Prediction Scores]
    end

    %% Aggregator
    Msg & Call & Meet & Prop & Inv & Pay & Task & Note & Sum & Rec & Score --> Aggregator[Chronological Timeline Feed]
    Aggregator --> View[Customer Profile Dashboard]
```

---

## 5. Task Flow
The task system automates follow-ups, alerts team members, and tracks completion rates to prevent conversation drift and SLA breaches.

```mermaid
graph TD
    %% Nodes
    A[Create Task manually or via AI intent trigger] --> B[Assign to Agent / Teammate]
    B --> C[Set Priority: Low / Medium / High]
    C --> D[Set Due Date & Optional Recurrence: Daily / Weekly / Monthly]
    D --> E{Is Task Overdue?}
    
    E -->|Yes| F[Trigger Live Alert in Notification Bell]
    E -->|No| G[Keep Active in Checklist]
    
    F --> H[Flag SLA Warning / Breach status]
    G --> I[Agent Marks Task Completed]
    H --> I
    
    I --> J[Bump contact.last_activity_at]
    J --> K{Is Task Recurring?}
    K -->|Yes| L[Generate Next Occurred Task Instance]
    K -->|No| M[Close Task Archive]
```

---

## 6. Permission Matrix
WaCRM utilizes Role-Based Access Control (RBAC) to define what pages, controls, and fields team members can view or modify. Below is the default system configuration matrix:

| CRM Module / Action | Super Admin | Admin | Manager | Sales Executive | Support Executive | Marketing | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Shared Inbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Take Over / Release Chat** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin Override Lock** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Contacts & Tags** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View Deal Values & Pipeline**| ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Create Invoices & Payments** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Broadcast Campaigns** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Modify SLA & CRM Settings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Team Management & RBAC** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 7. Database Schema
The database architecture implements a hybrid model: structured relational transactions are stored in **Supabase (PostgreSQL)**, while semi-structured AI intelligence, conversations vector embeddings, and audit trails reside in **MongoDB Atlas**.

### Supabase Relational Tables
```
Profiles (public.profiles)
 ├── id: UUID (PK)
 ├── user_id: UUID (FK auth.users)
 ├── full_name: TEXT
 ├── role: TEXT
 ├── permissions: TEXT[]
 ├── availability: TEXT ('online', 'busy', 'away')
 └── last_seen_at: TIMESTAMPTZ

Contacts (public.contacts)
 ├── id: UUID (PK)
 ├── owner_id: UUID (FK profiles)
 ├── name: TEXT
 ├── phone: TEXT
 ├── email: TEXT
 ├── company: TEXT
 ├── website: TEXT
 ├── industry: TEXT
 ├── address: TEXT
 ├── city: TEXT
 ├── state: TEXT
 ├── country: TEXT
 ├── timezone: TEXT
 ├── lead_source: TEXT
 ├── status: TEXT
 ├── last_activity_at: TIMESTAMPTZ
 └── preferred_language: TEXT

Invoices (public.invoices)
 ├── id: UUID (PK)
 ├── contact_id: UUID (FK contacts)
 ├── invoice_number: TEXT (Unique)
 ├── amount: NUMERIC(12,2)
 ├── status: TEXT ('draft', 'sent', 'paid', 'overdue', 'cancelled')
 ├── due_date: TIMESTAMPTZ
 └── services: TEXT[]

Payments (public.payments)
 ├── id: UUID (PK)
 ├── contact_id: UUID (FK contacts)
 ├── invoice_id: UUID (FK invoices)
 ├── amount: NUMERIC(12,2)
 ├── payment_method: TEXT
 ├── transaction_id: TEXT
 └── status: TEXT ('pending', 'completed', 'failed')

Tasks (public.tasks)
 ├── id: UUID (PK)
 ├── contact_id: UUID (FK contacts)
 ├── assigned_to: UUID (FK profiles)
 ├── title: TEXT
 ├── priority: TEXT ('low', 'medium', 'high')
 ├── due_date: TIMESTAMPTZ
 ├── status: TEXT ('pending', 'completed')
 └── recurring: TEXT ('daily', 'weekly', 'monthly')
```

### MongoDB Atlas Collections
```
ai_memory (Contact Facts)
 ├── _id: ObjectId
 ├── user_id: String (UUID)
 ├── contact_id: String (UUID)
 ├── facts: Document (company, budget, goals, pain_points)
 ├── last_intent: String
 └── last_sentiment: String

ai_conversations (Active Bot Sessions)
 ├── _id: ObjectId
 ├── conversation_id: String (UUID)
 ├── ai_active: Boolean
 ├── provider: String
 └── model: String

prompt_history (AI Completions Audits)
 ├── _id: ObjectId
 ├── user_id: String
 ├── conversation_id: String
 ├── prompt_text: String
 ├── response_text: String
 └── tokens_used: Integer
```

---

## 8. API Documentation
The Enterprise CRM exposes serverless API endpoints to power the AI suggested composer replies, lead qualification, and bulk actions.

### A. Contact Intelligence & Recommendations
Fetches dynamic AI scoring, sentiment analysis, client facts, buying intent, and next-best recommendations on-the-fly via the active NVIDIA model.
*   **Endpoint**: `GET /api/contacts/[id]/intelligence`
*   **Authentication**: Authenticated User Session
*   **Query Params**: None
*   **Response (200 OK)**:
    ```json
    {
      "contact": { "id": "contact-uuid", "name": "John Doe", "status": "qualified" },
      "memory": { "facts": { "budget": "High", "interests": ["SEO Services"] } },
      "summary": { "text": "Customer is seeking custom SEO optimization for a logistics portal." },
      "intelligence": {
        "leadScore": 85,
        "conversionProbability": 75,
        "intent": "Seeking custom enterprise packages with API integration",
        "sentiment": "Positive",
        "buyingSignals": ["Inquired about API support", "Shared technical spec docs"],
        "recommendations": [
          "Send enterprise catalog sheet",
          "Book technical consulting meeting"
        ],
        "customerIntelligence": {
          "painPoints": ["Slow search speeds", "High legacy maintenance costs"],
          "interestedServices": ["Enterprise SEO", "Vite Migrations"],
          "estimatedBudget": "High"
        }
      }
    }
    ```

### B. AI Reply Drafting & Template Recommendations
Exposes the AI Team Assistant drafting pipeline, incorporating RAG context, facts, and matching quick replies shortcuts.
*   **Endpoint**: `POST /api/ai/assist`
*   **Payload**:
    ```json
    {
      "conversationId": "conv-uuid"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "draft": "Hello John, I see you are looking for enterprise SEO packages. We have premium solutions tailored for high-volume logistics platforms. I would love to schedule a quick call to go over the specifications.",
      "recommendedReplies": [
        {
          "id": "qr-uuid-1",
          "shortcut": "/seo",
          "message_text": "Here is our standard SEO pricing catalog: ..."
        }
      ]
    }
    ```

---

## 9. Developer Guide

### A. Real-Time Presence & Collision Detection
The typing indicators and collision warning banners are driven by **Supabase Presence Channels**. On entering a chat thread:
1. The client subscribes to the presence channel: `presence:${conversationId}`.
2. The agent tracks their state, specifying their name and typing status (`typing: boolean`).
3. Whenever a teammate joins the same thread, both clients receive a `sync` event, recalculate the list of other active viewers, and display the collision banner.
4. If a teammate is typing, the composer text area is locked with a warning. Admins or super admins can press the "Admin Override" button to set `overrideLock` to `true`, bypassing the lock.

### B. Weighted expected revenue logic
The forecast numbers in the pipeline board are calculated client-side inside `src/components/pipelines/pipeline-board.tsx`:
```typescript
const stageTotalValue = dealsInStage.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
const stageWeightedRevenue = dealsInStage.reduce((sum, deal) => {
  const prob = Number(deal.probability) || 0;
  const val = Number(deal.value) || 0;
  return sum + (val * (prob / 100));
}, 0);
```
This guarantees that pipeline predictions adapt instantly to drag-and-drop actions, pipeline reorderings, or deal value adjustments.

### C. Running Tests & Quality Checks
To keep the codebase stable, developers should run the quality checking suite before submitting any Pull Requests:
```bash
# Run Type Checker (TypeScript)
npm run typecheck

# Run Test Suite (Vitest)
npm run test
```
All new REST routes and helper functions must be supported by unit tests in their respective `.test.ts` files.
