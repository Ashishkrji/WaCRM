# API Specification

All WaCRM internal APIs are built using Next.js App Router API Routes (`app/api/...`).
They follow strict RESTful conventions and return standard JSON responses.

## 1. Global Request & Response Format

**Standard Success Response (200/201):**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "pagination": { ... } } // Optional
}
```

**Standard Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid email address format.",
    "details": [ ... ]
  }
}
```

## 2. Authentication & Authorization

All API routes (except public Webhooks) MUST be protected by Supabase Auth middleware.
The `organization_id` is derived securely from the authenticated user's session.
**Never trust the client to send their `organization_id` in the request body for sensitive operations.**

## 3. Core Endpoints

### 3.1 WhatsApp Webhooks (`/api/webhooks/whatsapp`)
- **POST `/api/webhooks/whatsapp`**
  - **Purpose**: Receives incoming messages and status updates from Meta Cloud API.
  - **Auth**: Meta `X-Hub-Signature-256` validation. No Supabase auth.
  - **Flow**: Validates signature -> Pushes to message queue or processes immediately -> Returns 200 OK to Meta.

### 3.2 CRM Customers (`/api/v1/customers`)
- **GET `/api/v1/customers`**: List customers (supports `?status=lead&limit=50`).
- **POST `/api/v1/customers`**: Create a new customer manually.
- **GET `/api/v1/customers/:id`**: Get full customer profile and timeline.

### 3.3 AI Knowledge Base (`/api/v1/knowledge`)
- **POST `/api/v1/knowledge/upload`**
  - **Purpose**: Upload a PDF/Text file.
  - **Flow**: Uploads to Supabase Storage -> Triggers background job -> Chunks text -> Generates embeddings -> Saves to MongoDB Atlas.

### 3.4 AI Orchestration (`/api/v1/ai/generate`)
- **POST `/api/v1/ai/generate`**
  - **Payload**: `{ "customer_id": "...", "intent": "sales_inquiry" }`
  - **Purpose**: Internal API used by the Webhook processor or manual agent override to generate an AI response.

## 4. Error Codes
- `UNAUTHORIZED` (401) - Invalid or missing session.
- `FORBIDDEN` (403) - User lacks RBAC permissions for the requested resource.
- `NOT_FOUND` (404) - Resource doesn't exist or doesn't belong to the user's organization.
- `VALIDATION_FAILED` (400) - Zod schema validation failed on the request body.
- `PROVIDER_ERROR` (502) - External API (NVIDIA/OpenAI/Meta) failed.
