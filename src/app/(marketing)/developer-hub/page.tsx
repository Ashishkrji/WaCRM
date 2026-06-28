"use client";

import { useState } from "react";
import { Terminal, Webhook, Server, Code, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CODE_EXAMPLES = {
  api: {
    lang: "javascript",
    title: "Send a WhatsApp Message via REST API",
    code: `// Send a personalized WhatsApp message
const res = await fetch('https://api.mjchatsyncs.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    phone: '+919876543210',
    type: 'text',
    text: {
      body: 'Hello John! Your order #1092 has been shipped. Track here: https://track.co/1092'
    }
  })
});

const data = await res.json();
console.log('Message sent:', data.message_id);`,
  },
  webhook: {
    lang: "javascript",
    title: "Verify Inbound Webhook Signature (HMAC)",
    code: `const crypto = require('crypto');

// Verify signature in your Express handler
app.post('/webhooks/mjchatsyncs', (req, res) => {
  const signature = req.headers['x-mjchatsyncs-signature'];
  const secret = process.env.MJCHATSYNCS_WEBHOOK_SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature === digest) {
    console.log('Webhook verified! Event:', req.body.event);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Unauthorized');
  }
});`,
  },
  mcp: {
    lang: "json",
    title: "Model Context Protocol (MCP) Configuration",
    code: `{
  "mcpServers": {
    "mjchatsyncs": {
      "command": "npx",
      "args": ["-y", "@mjchatsyncs/mcp-server"],
      "env": {
        "MJCHATSYNCS_API_KEY": "your_api_key_here",
        "MJCHATSYNCS_PHONE_NUMBER_ID": "your_phone_id"
      }
    }
  }
}`,
  },
};

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<"api" | "webhook" | "mcp">("api");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden text-left">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.05] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 relative z-10">
        
        {/* Page Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block">Developer Hub</span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Build on the MJChatSyncs Platform
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Integrate WhatsApp messaging into your own applications. Connect workflows, receive inbound messages in real-time, and leverage our Model Context Protocol (MCP) server.
          </p>
        </div>

        {/* 3 Columns Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">REST API</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Send text, media, interactive template messages, and manage contacts using simple, clean JSON payloads over HTTPS.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/15 flex items-center justify-center text-purple-400">
              <Webhook className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Webhooks</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Subscribe to real-time events. Get notified instantly when a message is delivered, read, or when a customer replies.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">MCP Server</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect your AI agents (Claude, Cursor, etc.) directly to your WhatsApp channel using our official Model Context Protocol server.
            </p>
          </div>
        </div>

        {/* Code Playground */}
        <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Tab selectors */}
          <div className="lg:col-span-4 space-y-2">
            {[
              { id: "api", title: "REST API", desc: "Send messages programmatically", icon: Code },
              { id: "webhook", title: "Webhooks", desc: "Listen for real-time events", icon: Webhook },
              { id: "mcp", title: "MCP Server", desc: "Connect AI agents & models", icon: Server },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as "api" | "webhook" | "mcp");
                  setCopied(false);
                }}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4",
                  activeTab === tab.id
                    ? "bg-blue-600/10 border-blue-500/20 text-white shadow-sm"
                    : "bg-slate-950/40 border-slate-900 text-slate-450 hover:border-slate-800 hover:text-slate-200"
                )}
              >
                <tab.icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold">{tab.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">{tab.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Code Block */}
          <div className="lg:col-span-8 border border-slate-900 bg-slate-950 rounded-xl overflow-hidden flex flex-col h-[340px]">
            {/* Window bar */}
            <div className="h-10 border-b border-slate-900 flex items-center justify-between px-4 bg-slate-950">
              <span className="text-[10px] text-slate-500 font-mono">{CODE_EXAMPLES[activeTab].title}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] text-slate-455 hover:text-slate-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            {/* Code Textarea */}
            <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-slate-350 bg-slate-950/80">
              <pre>{CODE_EXAMPLES[activeTab].code}</pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
