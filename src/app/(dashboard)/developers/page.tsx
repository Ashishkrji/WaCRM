"use client";

import { Terminal, Key, BookOpen, Copy, Webhook, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export default function DevelopersPage() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          Developer API & Webhooks
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Build custom integrations, automate workflows, and sync WaCRM data with your own backend using our REST API.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-400" />
                API Reference
              </CardTitle>
              <CardDescription>
                Base URL: <code className="text-primary bg-primary/10 px-1 py-0.5 rounded ml-1">https://api.wacrm.tech/v1</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="contacts">
                <TabsList className="bg-slate-950 border border-slate-800 mb-6">
                  <TabsTrigger value="contacts" className="data-active:bg-slate-800 data-active:text-white">Contacts</TabsTrigger>
                  <TabsTrigger value="messages" className="data-active:bg-slate-800 data-active:text-white">Messages</TabsTrigger>
                  <TabsTrigger value="webhooks" className="data-active:bg-slate-800 data-active:text-white">Webhooks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="contacts" className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-500/10 text-emerald-400 font-mono text-xs px-2 py-1 rounded">POST</span>
                        <code className="text-sm font-mono text-slate-300">/contacts</code>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard('POST /contacts')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Create a new contact in your CRM.</p>
                    <div className="relative">
                      <pre className="p-4 rounded bg-[#020617] text-slate-300 text-sm overflow-x-auto border border-slate-800 font-mono">
{`curl -X POST https://api.wacrm.tech/v1/contacts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+1234567890",
    "name": "John Doe",
    "tags": ["lead", "vip"]
  }'`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-500/10 text-emerald-400 font-mono text-xs px-2 py-1 rounded">POST</span>
                        <code className="text-sm font-mono text-slate-300">/messages/send</code>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Send a WhatsApp message or template.</p>
                    <div className="relative">
                      <pre className="p-4 rounded bg-[#020617] text-slate-300 text-sm overflow-x-auto border border-slate-800 font-mono">
{`curl -X POST https://api.wacrm.tech/v1/messages/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "type": "template",
    "template_name": "welcome_message",
    "language": "en"
  }'`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="webhooks" className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <p className="text-sm text-slate-400 mb-4">Listen for real-time events on your server. Payload example for <code className="text-primary">message.received</code>:</p>
                    <div className="relative">
                      <pre className="p-4 rounded bg-[#020617] text-slate-300 text-sm overflow-x-auto border border-slate-800 font-mono">
{`{
  "event": "message.received",
  "timestamp": "2026-05-24T10:00:00Z",
  "data": {
    "contact": { "phone": "+1234567890", "name": "John Doe" },
    "message": {
      "id": "wamid.HBgL...",
      "type": "text",
      "text": { "body": "I need help with my order." }
    }
  }
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Use your Secret API Key to authenticate requests. Do not share this key publicly or in client-side code.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Your Secret API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 flex items-center">
                    <code className="text-sm font-mono text-slate-300 truncate">
                      {apiKeyVisible ? "wacrm_live_8f92jKx8Lp...H4Mv2" : "••••••••••••••••••••••••••••••••"}
                    </code>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setApiKeyVisible(!apiKeyVisible)} className="border-slate-800">
                    <Key className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard("wacrm_live_8f92jKx8Lp9zH4Mv2")} className="border-slate-800">
                    <Copy className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </div>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                Roll API Key
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Webhook className="h-5 w-5 text-indigo-400" />
                Active Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950">
                  <div className="mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Zapier Zap</p>
                    <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">https://hooks.zapier.com/hooks/catch/...</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-slate-800 text-slate-300 border-dashed">
                  <Plus className="mr-2 h-4 w-4" /> Add Webhook Endpoint
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
