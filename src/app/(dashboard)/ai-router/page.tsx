"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Link as LinkIcon, Key, Network, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AiRouterPage() {
  const [enabled, setEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState("https://api.yourdomain.com/v1/chat");
  const [apiKey, setApiKey] = useState("sk-**********************");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful WhatsApp sales assistant. You will try to answer customer queries based on the catalog. If you don't know the answer, politely tell them that a human agent will take over.");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // Simulate API call to save settings
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success("AI Router settings saved successfully!");
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Chatbot & Agent Router <Bot className="h-6 w-6 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your custom AI logic. Automatically route conversations to human agents when the bot cannot answer.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-slate-300">AI Router</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              enabled ? "bg-indigo-600" : "bg-slate-700"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                enabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      <div className={cn("grid gap-8 transition-opacity duration-300", !enabled && "opacity-50 pointer-events-none")}>
        
        {/* Endpoint Configuration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-950/50 p-4 flex items-center gap-2">
            <Network className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Webhook Connection</h3>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-400">
              When a new WhatsApp message arrives, we will send an HTTP POST request to this endpoint. Your server should respond with the bot's reply or an instruction to route to a human.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">API Endpoint URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-700 text-white font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Authentication Token (Bearer)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-700 text-white font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Behavior & Routing Rules */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-950/50 p-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Bot Behavior & System Prompt</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">System Instructions (Passed in Request Payload)</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="bg-slate-800 border-slate-700 text-white resize-none"
              />
              <p className="text-xs text-slate-500">
                This context is automatically included in the JSON payload sent to your Webhook.
              </p>
            </div>
          </div>
        </div>

        {/* Verification & Docs */}
        <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-6 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-indigo-200">Webhook Payload Format</h4>
            <p className="text-xs text-indigo-300/70 mt-1 mb-3">
              Your endpoint will receive a POST request with the following JSON schema. To route to a human, simply return <code>{"{ \"action\": \"route_to_agent\" }"}</code>.
            </p>
            <pre className="bg-[#020617] rounded-md p-4 text-xs font-mono text-slate-300 overflow-x-auto border border-indigo-900/50">
{`{
  "contact_id": "uuid",
  "phone": "+1234567890",
  "message_body": "What is the price of the premium plan?",
  "system_prompt": "You are a helpful WhatsApp sales assistant...",
  "history": [
    {"role": "user", "content": "Hi"}
  ]
}`}
            </pre>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving || !enabled} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
