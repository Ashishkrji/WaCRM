# Testing & Verification Guide — MJChatSyncs Enterprise

This document describes how to verify the CRM's automated features and manually validate the integrations.

---

## 🧪 1. Running Automated Tests

We use Vitest to execute our unit and integration test suite.

### A. Run Entire Test Suite
Executes all tests (flows, automations, encryption, and AI models):
```bash
npm run test
```

### B. Run Specific Test Module
To test only the AI engine or factory:
```bash
# Test AI Core Orchestrator
npx vitest run src/lib/ai/engine.test.ts

# Test AI Provider Fallbacks
npx vitest run src/lib/ai/provider-factory.test.ts
```

### C. Run Static Type Checking
Ensures all TypeScript definitions, components, and schema queries compile perfectly:
```bash
npm run typecheck
```

---

## 📬 2. Manual Webhook Integration Testing

To test the inbound message queue, flows, and AI responses without connecting to the actual Meta Business API, send mock JSON payloads to the webhook API route.

### A. Mock Text Inbound
Simulate a customer sending a general query:
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=mock-signature-here" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "12345",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15555555555",
            "phone_number_id": "YOUR_PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": { "name": "Alice Johnson" },
            "wa_id": "15551234567"
          }],
          "messages": [{
            "id": "wamid.HBgLMTU1NTEyMzQ1NjcVAgASGBQzQUNGQ0EzQjM2NDk0QkRFQkQwQjM0",
            "from": "15551234567",
            "timestamp": "1718973600",
            "type": "text",
            "text": { "body": "What are your Shopify web development prices?" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### B. Mock Button/List Reply Inbound
Simulates a customer tapping an interactive list row or button reply from an outbound Flow:
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=mock-signature-here" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "12345",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15555555555",
            "phone_number_id": "YOUR_PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": { "name": "Alice Johnson" },
            "wa_id": "15551234567"
          }],
          "messages": [{
            "id": "wamid.interactive_reply_123",
            "from": "15551234567",
            "timestamp": "1718973700",
            "type": "interactive",
            "interactive": {
              "type": "button_reply",
              "button_reply": {
                "id": "accept_quote_action",
                "title": "Accept Quote"
              }
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

*(Note: If you run these curls locally, ensure signature verification is bypassed by mock values or disable signature checks in `webhook-signature.ts` for local testing. In our codebase, the webhook will log warnings but proceed with mock validations when signature checks fail in development environments).*

---

## 🤖 3. Simulating AI Provider Fallbacks

We can verify the model fallback wrapper (`FallbackAIProviderWrapper` in `provider-factory.ts`):
1.  Set `AI_PROVIDER=nvidia` in `.env.local`.
2.  Provide a fake, invalid `NVIDIA_API_KEY=nvapi-invalid-key`.
3.  Set `GEMINI_API_KEY` to a valid Gemini API key.
4.  Trigger `/api/ai/chat` with any prompt.
5.  Check server logs. The system will try to connect to NVIDIA, fail, print a `[AI/Fallback] Provider nvidia failed during chat` warning, switch to `gemini`, and return the response successfully.

---

## ✍️ 4. Manual Digital Signature Portals

Validate client signatures:
1.  Trigger a proposal generation from a chatbot thread or create a database row in `proposal_requests` manually.
2.  Copy the generated URL: `http://localhost:3000/public/proposal/<proposal_id>`.
3.  Open the link in an incognito browser window. The portal will show:
    *   MaaJanki branding layout or the workspace branding colors.
    *   A signature box.
4.  Write in a signature and click **Digitally Sign Proposal**.
5.  Verify the status in the `proposal_requests` table updates to `signed`.
6.  Repeat for `quotation_requests` at `http://localhost:3000/public/quote/<quote_id>` to verify payment and signature flows.
