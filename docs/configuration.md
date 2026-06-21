# Configuration & Tuning Guide — WaCRM Enterprise

This guide covers the environment variables, template placeholders, and tuning options available in WaCRM Enterprise.

---

## ⚙️ 1. Environment Variables Configuration

Here is a checklist of all variables you can configure in `.env.local` to control server features and integrations:

### Core Database Configuration (Supabase + MongoDB Atlas Hybrid)
*   `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project (found in Settings > API).
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anonymous key for client-side API operations.
*   `SUPABASE_SERVICE_ROLE_KEY`: The server-side service role key (bypasses RLS to allow webhook writes).
*   `MONGODB_URI`: The connection string to your MongoDB Atlas cluster (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`).
*   `MONGODB_DB_NAME`: The target MongoDB database name (defaults to `wacrm`).


### Security Configuration
*   `ENCRYPTION_KEY`: A 64-character hexadecimal key (32 bytes) used for encrypting WhatsApp API tokens in PostgreSQL. Generate this in your terminal:
    ```bash
    openssl rand -hex 32
    ```
*   `AUTOMATION_CRON_SECRET`: A secure random secret required to authorize background automation triggers and cron tasks.

### AI Engine Configuration
*   `AI_PROVIDER`: The primary LLM provider. Supported options: `nvidia` (default), `gemini`, `openai`, `claude`, `openrouter`, `local`.
*   `NVIDIA_API_KEY`: API key for NVIDIA NIM API.
*   `NVIDIA_MODEL`: The LLM model string. Defaults to `nvidia/llama-3.1-nemotron-70b-instruct`.
*   `NVIDIA_EMBEDDING_MODEL`: The embedding model. Defaults to `nvidia/nv-embed-v2` (1024 dimensions).
*   `NVIDIA_BASE_URL`: Base endpoint. Defaults to `https://integrate.api.nvidia.com/v1`.
*   `GEMINI_API_KEY`: Google Gemini API key.
*   `OPENAI_API_KEY`: OpenAI API key.
*   `OPENAI_MODEL`: OpenAI model (e.g. `gpt-4o`).
*   `ANTHROPIC_API_KEY`: Anthropic Claude API key.
*   `OPENROUTER_API_KEY`: OpenRouter API key.
*   `LOCAL_LLM_BASE_URL`: Custom Ollama or local LLM base URL (e.g. `http://localhost:11434/v1`).
*   `LOCAL_LLM_MODEL`: Custom local model identifier.

### Chatbot Behavior Parameters
*   `AI_CONFIDENCE_THRESHOLD`: Confidence margin (between 0.0 and 1.0). If the model's confidence is below this value, the AI will hand off the conversation to a human agent. Default is `0.7`.
*   `AI_MAX_HISTORY_MESSAGES`: Sliding window limit for historical messages. Default is `20`.
*   `AI_MAX_KNOWLEDGE_CHUNKS`: The maximum number of RAG chunks to fetch. Default is `5`.
*   `AI_SUMMARY_TRIGGER_COUNT`: The number of messages required in a conversation to trigger background AI summarization. Default is `50`.

---

## 📝 2. Prompt Template Placeholders

When designing system instructions in **Settings > AI Settings** or creating new templates, the system supports dynamic placeholder variables. These are replaced at runtime before sending the prompt to the LLM:

*   `{{company_name}}`: Replaced with the active workspace name (e.g. `MaaJanki Web Tech`).
*   `{{agent_name}}`: Replaced with the assigned bot or agent's name.
*   `{{lead_score}}`: Replaced with the contact's computed lead score if available.
*   `{{vars.name}}`: Replaced with the contact's name.
*   `{{vars.budget}}`: Replaced with the contact's extracted budget.
*   `{{vars.timeline}}`: Replaced with the contact's project timeline.
*   `{{vars.goals}}`: Replaced with the contact's business goals.
*   `{{vars.website}}`: Replaced with the contact's website.

---

## 🎯 3. Tuning LLM Responses

To change AI output style and parameters:
1.  **Workspaces**: Create separate workspaces for separate business identities (e.g. "Main Support" vs "Marketing Campaigns"). Each workspace can hold its own distinct logo, accent color, and custom domain alias.
2.  **Model Settings**: Configure specific configurations per provider (such as setting the temperature for a local model to `0.2` for deterministic FAQs or `0.8` for creative proposal drafting) directly in the `model_settings` table.
3.  **Handoff Tuning**: Modify the default handoff response in the AI configuration interface (e.g. *"Hold on while I patch in a consultant... 🧑‍💻"*). The system will automatically trigger this when the client uses words like *"agent"*, *"human"*, *"help"*, or *"representative"*.
