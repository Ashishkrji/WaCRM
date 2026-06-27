# SaaS Product Documentation & Roadmap

This document outlines how WaCRM will transition from a single-business tool to a full-fledged B2B SaaS platform. Every feature built must respect these future constraints so that the migration requires zero structural rewrites.

## 1. Multi-Tenant Isolation Strategy
- **Row Level Security (RLS)**: WaCRM utilizes logical separation rather than separate databases. Every core table in Supabase MUST contain an `organization_id`. RLS policies ensure that users can only query data matching their active `organization_id`.
- **MongoDB**: Every MongoDB document MUST include an `organization_id` property. Queries will always apply an `{ organization_id: currentOrg }` filter at the service layer.

## 2. Feature Flags & Licensing
To support multiple subscription tiers without forking the codebase, we will implement a centralized Feature Flag system.

### 2.1 Proposed Tiers
- **Starter**: 1 WhatsApp Number, 3 Users, Basic CRM, No AI Automation.
- **Pro**: 3 WhatsApp Numbers, 10 Users, Full CRM, AI Receptionist.
- **Enterprise**: Unlimited Numbers, Unlimited Users, Dedicated AI Orchestration, API Access, White-labeling.

### 2.2 Feature Flag Service (Implementation Draft)
```typescript
interface OrganizationSubscription {
  plan_id: 'starter' | 'pro' | 'enterprise';
  features: {
    max_users: number;
    ai_enabled: boolean;
    white_label: boolean;
    workflows: boolean;
  };
  usage: {
    ai_tokens_this_month: number;
    messages_this_month: number;
  }
}
```
All UI elements and API endpoints will check `hasFeature('workflows')` before rendering or processing.

## 3. White-Label Support
To support white-labeling for enterprise customers:
- **Domains**: The app will eventually support custom domain routing (e.g., `crm.theircompany.com`). Next.js Middleware will parse the hostname and load the corresponding `organization_id`.
- **Branding**: `organizations` table will include `logo_url`, `primary_color`, and `app_name`. The UX Design system will map CSS variables to these database values dynamically.

## 4. Usage Quotas & Metering
AI API calls (NVIDIA/OpenAI) cost money. We must meter token usage per organization.
- **Implementation**: The `ai_logs` table in MongoDB will act as the source of truth for usage. 
- A daily CRON job will aggregate token counts per `organization_id` and update their billing quota in Stripe.
- If a user hits their limit, the API will return a `402 Payment Required` error, and the UI will prompt an upgrade.
