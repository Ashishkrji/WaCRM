# System Architecture — WaCRM Enterprise

This document describes the high-level architecture, database schemas, and message execution flows of WaCRM Enterprise.

---

## 🌐 High-Level System Architecture

WaCRM operates as a Next.js App Router application hosted on a server or VPS (e.g. Hostinger, Vercel, or a Docker container) linked to a Supabase Postgres database.

```
                  ┌──────────────────────────────┐
                  │   WhatsApp Business Cloud   │
                  └──────────────┬───────────────┘
                                 │
                         HTTP Webhook POST
                                 │
                                 ▼
         ┌────────────────────────────────────────────────┐
         │             WaCRM Webhook Receiver             │
         │   (src/app/api/whatsapp/webhook/route.ts)      │
         └──────────────┬──────────────────┬──────────────┘
                        │                  │
                        │ (Inbound Flow)   │ (Realtime Sync)
                        ▼                  ▼
       ┌───────────────────────────┐ ┌───────────────┐
       │   Automations & Flows     │ │   Supabase    │
       │   Chatbot State Machines  │ │   Realtime    │
       └────────────┬──────────────┘ └───────┬───────┘
                    │                        │
             (If not consumed)               │ (Inbox UI Sync)
                    ▼                        ▼
       ┌───────────────────────────┐ ┌───────────────┐
       │         AI Engine         │ │  Multi-Agent  │
       │  (src/lib/ai/engine.ts)   │ │  Shared Inbox │
       └────────────┬──────────────┘ └───────┬───────┘
                    │
             ┌───────┴───────┬──────────────────────┬──────────────────────┐
             ▼               ▼                      ▼                      ▼
     ┌───────────────┐┌──────────────┐      ┌───────────────┐      ┌───────────────┐
     │ MongoDB Atlas ││ AI Providers │      │  Auto CRM RLS │      │ MongoDB Atlas │
     │  Vector Search││ (NVIDIA,    │      │  Deals, Leads │      │ AI Memory,    │
     │  RAG Engine   ││ Gemini, etc.)│      │  Quotes/Props │      │ Logs, Prompts │
     └───────────────┘└──────────────┘      └───────────────┘      └───────────────┘
```

---

## 🔄 Webhook Inbound Message Pipeline

When a client sends a WhatsApp message to your registered number, the system processes it in a strict, resilient execution pipeline:

```mermaid
sequenceDiagram
    autonumber
    participant Meta as Meta Cloud API
    participant Webhook as Webhook Receiver
    participant DB as Supabase DB
    participant Mongo as MongoDB Atlas
    participant Flows as Flows Engine
    participant Auto as Automations Engine
    participant AI as AI Engine
    
    Meta->>Webhook: Inbound Message Event
    Webhook->>DB: Find or Create Contact & Conversation
    DB-->>Webhook: Return Records
    Webhook->>Flows: Dispatch message to Flows Engine
    alt Flow matches / is active
        Flows->>DB: Advance state & insert interactive replies
        Flows-->>Webhook: Mark message as consumed
    else Flow does not match (unconsumed)
        Webhook->>Auto: Dispatch message to Automations Engine
        Auto->>DB: Trigger auto-responders or tag steps
        Auto->>Mongo: Log Automation execution details (automation_logs)
        Webhook->>AI: Dispatch message to AI Engine
        AI->>DB: Load AI config
        AI->>Mongo: Log incoming Webhook request payload (webhook_logs)
        AI->>DB: Fetch last 20 messages (Context Window)
        AI->>Mongo: searchKnowledge() (Atlas Vector Search RAG)
        AI->>Mongo: Fetch contact facts memory (ai_memory)
        AI->>AI: Build System Prompt (base prompt + RAG + memory)
        AI->>AI: Call configured LLM Provider (NVIDIA/Gemini/etc.)
        AI->>Mongo: Log Prompt template and completion details (prompt_history)
        alt LLM output contains [ACTION: ...]
            AI->>DB: Auto create quotation / proposal / meeting booking
        end
        AI->>DB: Insert bot message row
        AI->>Meta: Send generated reply text to client via WhatsApp
        AI->>Mongo: Extract facts, score lead, and update AI session (async)
    end
    Webhook-->>Meta: HTTP 200 OK (Ack)
```

---

## 🗄️ Database Schema & Relationships

WaCRM leverages Supabase PostgreSQL with `pgvector` enabled for semantic embeddings. Row-Level Security (RLS) restricts access to tenant workspaces (`business_workspaces` table).

```mermaid
erDiagram
    business_workspaces ||--o{ whatsapp_config : "owns"
    auth_users ||--|| profiles : "has profile"
    auth_users ||--o{ business_workspaces : "manages"
    auth_users ||--o{ contacts : "creates"
    
    contacts ||--o{ conversations : "initiates"
    contacts ||--o{ contact_tags : "has"
    contacts ||--o{ contact_custom_values : "has"
    contacts ||--o{ contact_notes : "contains"
    contacts ||--o{ lead_scores : "evaluated"
    contacts ||--o{ meeting_bookings : "schedules"
    contacts ||--o{ quotation_requests : "receives"
    contacts ||--o{ proposal_requests : "receives"
    
    conversations ||--o{ messages : "contains"
    conversations ||--o{ ai_conversations : "monitors"
    conversations ||--o{ conversation_summary : "summarized"
    conversations ||--o{ deals : "spawns"
    
    knowledge_base ||--o{ knowledge_embeddings : "contains chunks"
    
    profiles {
        uuid id PK
        uuid user_id FK
        text role
        text_array permissions
        text status
    }
    
    business_workspaces {
        uuid id PK
        uuid user_id FK
        text name
        text custom_domain
        text brand_color
        boolean white_label_enabled
    }
    
    contacts {
        uuid id PK
        uuid user_id FK
        text name
        text phone
        text email
    }
    
    conversations {
        uuid id PK
        uuid user_id FK
        uuid contact_id FK
        text status
        uuid assigned_agent_id
        integer unread_count
    }
    
    messages {
        uuid id PK
        uuid conversation_id FK
        text sender_type
        text content_type
        text content_text
        text message_id
        text status
        uuid reply_to_message_id
    }
    
    ai_conversations {
        uuid id PK
        uuid conversation_id FK
        boolean ai_active
        timestamptz handed_off_at
    }
    
    ai_memory {
        uuid id PK
        uuid contact_id FK
        jsonb facts
        text last_intent
        text last_sentiment
    }
    
    lead_scores {
        uuid id PK
        uuid contact_id FK
        integer score
        text tier
        text reasoning
    }
    
```

---

## 🍃 MongoDB Atlas Collections & AI Schemas

AI context, embeddings, summaries, prompt templates, and execution audit trails are stored in MongoDB Atlas:

### 1. `knowledge_base`
Stores document metadata fed into the RAG pipeline:
- `id` (string/UUID): Unique reference matching the source file/URL.
- `user_id` (string): Scoped CRM owner.
- `title` (string): Document title or filename.
- `doc_type` (string): Type (`pdf`, `docx`, `txt`, `website`, etc.).
- `content` (string): Raw extracted text content.
- `source_url` (string): Scrape origin for crawled pages.
- `storage_path` (string): Supabase storage bucket file path.
- `status` (string): Process state (`pending`, `processing`, `ready`, `failed`).
- `chunk_count` (number): Number of text vector fragments generated.
- `embedding_model` (string): Identifier of the active LLM embedder.
- `created_at` / `updated_at` (Date)

### 2. `knowledge_embeddings`
Stores text fragments alongside vectors for semantic RAG search:
- `user_id` (string): Scoped owner.
- `knowledge_base_id` (string): Link to parent document.
- `content` (string): Text fragment content.
- `chunk_index` (number): Fractional order of chunk.
- `embedding` (array of numbers): 1024-dimension float vector.
- `metadata` (object): Chunk stats and provider details.

### 3. `ai_memory`
Stores profile summaries extracted from WhatsApp client chats:
- `user_id` (string)
- `contact_id` (string)
- `facts` (object): Key profile keys, e.g., name, company, budget, timeline, business goals.
- `last_intent` (string): Intent type (complaint, booking, pricing, etc.).
- `last_sentiment` (string): Neutral, positive, or negative.
- `last_language` (string): Customer language code (e.g., `en`, `es`, `hi`).
- `total_interactions` (number)

### 4. `ai_conversations`
Tracks the active state of LLM chats:
- `conversation_id` (string)
- `user_id` (string)
- `total_ai_messages` (number)
- `ai_active` (boolean)
- `handed_off_at` (Date/null)
- `provider` / `model` (string)

### 5. `ai_usage_logs`
Tracks LLM token counts and costs:
- `user_id` (string)
- `conversation_id` (string)
- `contact_id` (string)
- `operation` (string): chat, embed, summary, intent, etc.
- `provider` / `model` (string)
- `total_tokens` (number)
- `confidence` (number)
- `finish_reason` (string)

### 6. Audit Logs (`webhook_logs`, `automation_logs`, `prompt_history`)
Maintains operational traces:
- `webhook_logs`: records inbound webhook payloads and delivery statuses.
- `automation_logs`: records executing triggers, nodes reached, and errors.
- `prompt_history`: stores prompt messages, outputs, and latency times (ms).

---


## 🔒 Enterprise Security Measures

1.  **Row Level Security (RLS)**: Every database query is scoped to the authenticated user's `user_id` or workspace using Postgres RLS policies.
2.  **API Token Encryption**: WhatsApp user access tokens are encrypted in the database using `AES-256-GCM` before storage, preventing token compromise even if read-access is leaked.
3.  **Webhook Validation**: Incoming webhook calls from Meta are HMAC-SHA256 verified against `META_APP_SECRET`.
4.  **Handoff Interceptor**: The AI Engine enforces a confidence threshold. If a response confidence drops below the margin, the system ceases bot responses, alerts the agents, and triggers the `handed_off` state.
