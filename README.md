# WaCRM — Premium Self-Hostable WhatsApp® CRM Template

> Self-hostable, production-ready WhatsApp® CRM featuring a shared multi-agent inbox, contact segmentation, sales pipelines, broadcast templates, visual no-code automations, an AI chatbot router, and custom website chat widgets. **Fork it, brand it, host it, own it.**

[![Deploy on Hostinger](https://img.shields.io/badge/Deploy_on-Hostinger-673DE6?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com/web-apps-hosting)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e?logo=supabase)](https://supabase.com)

---

## 🌟 Premium Features Out of the Box

WaCRM is designed to give businesses full control over their WhatsApp communication channels, operating as a self-contained platform without seat limits or pricing tiers.

### 👥 1. Team & Agent Management (100% Direct UI CRUD)
*   **Shared Agent Inbox**: Multiple agents can work on the same WhatsApp numbers with live per-conversation assignment and notes.
*   **Direct Dashboard CRUD**: Add, invite, edit, and permanently delete team members directly inside the UI. Database profiles are provisioned and synced automatically without manual Supabase Studio steps.
*   **Granular Permission Scopes**: Toggle custom permissions (contacts, messages, analytics, broadcasts, automation, team settings, etc.) per agent via checkboxes inside the UI.
*   **Resilient Developer Bypass**: If the cloud database is offline during local testing, the auth framework automatically falls back to an unlocked local **Developer Admin** profile (`super_admin`), letting you test the entire CRM with zero setup.

### 📱 2. WhatsApp Multi-Number Business API Setup
*   **Simultaneous Multi-Number Support**: Connect, monitor, and chat across multiple approved WhatsApp Business numbers at the same time.
*   **API Health Monitor**: Click the **Test API Connection** button next to any line to instantly verify connection health against Meta's servers.
*   **Connect with Facebook**: A high-visibility shortcut button that opens `developers.facebook.com` in a new tab/window while automatically pre-populating safe mock credentials to assist local developers.
*   **Access Token Encryption**: Sensitive access tokens are securely encrypted server-side using AES-256-GCM before writing to the database.

### 🤖 3. AI Chatbot & Agent Router
*   **API Webhook Integration**: Configure custom AI endpoints or Bearer keys to process chats. The CRM forwards inbound messages to your API.
*   **Human Agent Failover**: If the bot cannot answer, it sends `{"action": "route_to_agent"}` to route the chat to a live agent in the shared inbox.
*   **Dual Storage Resiliency**: Configuration inputs automatically save to Supabase (`ai_router_config` table). If the migration hasn't run or is offline, it seamlessly falls back to saving and loading configs via browser `localStorage` to keep operations running.

### 💬 4. WhatsApp Chat Widget Builder for Websites
*   **Interactive Expanding Popups**: Generates lightweight, floating web widgets. When clicked, it expands into a gorgeous support window containing custom bot avatars, active sub-status (e.g. "Online • Replies instantly"), and welcome greetings.
*   **5 Premium Theme Presets**: Swap styles on the fly:
    *   `WhatsApp Classic`: Clean white popup with official green accents.
    *   `Glassmorphism Glow`: Translucent backdrop blur with emerald borders.
    *   `Vibrant Purple`: Premium indigo to purple gradient backgrounds.
    *   `Royal Gold`: Elegant dark card styled with amber/gold details.
    *   `Sunset Rose`: High-contrast sunset rose to orange gradient.
*   **Universal Installation Snippet**: Single copy-paste HTML/JS block compatible with:
    *   **WordPress**: Via WPCode or Header/Footer plugins.
    *   **Shopify, WooCommerce, Wix, and Squarespace**: Paste directly into footer theme liquid or code injection slots.
    *   **Custom Coding (HTML/React/Vue/Next.js)**.

### 📈 5. Pipelines & Message Templates
*   **Sales Pipelines (Kanban)**: Organize deals, drag-and-drop deal cards, and link sales values to conversations.
*   **Reference Templates**: Pre-fill dummy pipelines or WhatsApp message templates instantly using a **"Load Example"** button.

---

## 🛠️ Self-Hosting & Developer Build Guide

Follow this step-by-step guide to clone, configure, build, and deploy your own copy of WaCRM.

### 📋 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [Git](https://git-scm.com/)
*   A [Supabase](https://supabase.com/) account (Cloud or Self-hosted)
*   A [Meta Developer Portal](https://developers.facebook.com/) account (for WhatsApp Cloud API credentials)

---

### 🚀 2. Quick Start (Local Setup)

#### Step A: Fork & Clone Repository
1.  Fork this repository on GitHub to your account.
2.  Clone your fork locally:
    ```bash
    git clone https://github.com/<your-username>/wacrm.git
    cd wacrm
    ```

#### Step B: Install Dependencies
```bash
npm install
```

#### Step C: Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Open `.env.local` and configure your credentials:
```env
# Next.js Public Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Side Keys (Keep Secrets Private)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Encryption Key (Must be a 64-character hexadecimal string)
# Used to encrypt WhatsApp permanent access tokens in the database.
# You can generate a valid key using: openssl rand -hex 32
ENCRYPTION_KEY=9a15a819b5d2906df071d2b86ab20c5ee9ad3cbcd72ab012c45ee9234abc12df
```

#### Step D: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your CRM in action.

---

### 🗄️ 3. Supabase Database Migration
All required database schemas, tables, triggers, and row-level security (RLS) policies are pre-coded inside the `supabase/migrations/` directory.

#### Linking via Supabase CLI
If you want to apply migrations to your Supabase instance:
1.  Initialize Supabase and link your project:
    ```bash
    npx supabase login
    npx supabase link --project-ref <your-project-ref>
    ```
2.  Push migrations to your cloud database:
    ```bash
    npx supabase db push
    ```

#### Project Model Context Protocol (MCP) Linkage
We provide local `.mcp.json` support. To link your project folder to your Supabase cloud project ref via the MCP Client, verify your configurations:
*   **Global Config** (`~/.gemini/antigravity/mcp_config.json`):
    ```json
    {
      "mcpServers": {
        "supabase": {
          "serverUrl": "https://mcp.supabase.com/mcp?project_ref=your-project-ref"
        }
      }
    }
    ```
*   **Project Config** (`f:\wacrm-main\.mcp.json`):
    ```json
    {
      "project_ref": "your-project-ref"
    }
    ```

---

### 🔌 4. WhatsApp Cloud API Webhook Connection
To receive incoming customer chats in real-time, configure webhooks inside the Meta Developers Dashboard:

1.  In your Meta App settings, add the **WhatsApp** product.
2.  Navigate to **WhatsApp > Configuration**.
3.  Set the **Webhook Callback URL** to: `https://yourdomain.com/api/whatsapp/webhook`
4.  Set the **Verify Token** to the custom string you configured in WaCRM's settings.
5.  Subscribe to the **`messages`** webhook field.
6.  Send a test message from your phone. It will immediately show up in WaCRM's shared inbox!

---

### 🚢 5. Production Deployment

#### Hostinger Managed Node.js
Deploying to Hostinger is fully supported and requires only a few clicks:
1.  Log in to your Hostinger hPanel.
2.  Set up a new **Node.js Web App** pointing to your Git repository fork.
3.  Configure your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.) inside the Hostinger Application settings panel.
4.  Run `npm run build` as your build command, and `npm start` as your start command.
5.  Your CRM is live on your personal domain!

#### Vercel Deploys
Ensure you include all Environment variables from `.env.local` inside your Vercel Dashboard project settings. Vercel will automatically build the Next.js production bundle.

---

## 🛠️ Stack & Architecture

*   **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Shadcn-inspired UI components.
*   **Backend & DB**: Supabase (PostgreSQL + Supabase Auth + Database RLS policies).
*   **WhatsApp API**: Official Meta Cloud API (WhatsApp Business API).
*   **Encryption Layer**: Node `crypto` AES-256-GCM encryption for stored API tokens.
*   **Resiliency Layer**: Redirection locks, graceful catch blocks, and browser localStorage caches.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Fork it, brand it, customize it, deploy it, and scale it!
