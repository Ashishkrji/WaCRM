"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Link as LinkIcon, 
  Key, 
  Network, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function AiRouterPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbMode, setDbMode] = useState<"supabase" | "local">("supabase");

  // AI Configuration States
  const [enabled, setEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState("https://api.yourdomain.com/v1/chat");
  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful WhatsApp sales assistant. You will try to answer customer queries based on the catalog. If you don't know the answer, politely tell them that a human agent will take over."
  );

  useEffect(() => {
    if (authLoading) return;
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Load chatbot configurations
  async function loadConfig() {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Try to fetch from Supabase
      const { data, error } = await supabase
        .from("ai_router_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Table likely doesn't exist yet (migration not pushed)
        console.warn("ai_router_config table query failed, falling back to localStorage:", error.message);
        loadLocalFallback();
      } else if (data) {
        setDbMode("supabase");
        setEnabled(data.enabled ?? false);
        setEndpoint(data.endpoint || "");
        setApiKey(data.api_key || "");
        setSystemPrompt(data.system_prompt || "");
      } else {
        // Row doesn't exist, create default state
        setDbMode("supabase");
        handleResetToDefault();
      }
    } catch (err) {
      console.error("Failed to fetch AI configuration:", err);
      loadLocalFallback();
    } finally {
      setLoading(false);
    }
  }

  // Fallback to LocalStorage
  function loadLocalFallback() {
    setDbMode("local");
    try {
      const localData = localStorage.getItem("wacrm_ai_router_config");
      if (localData) {
        const parsed = JSON.parse(localData);
        setEnabled(parsed.enabled ?? false);
        setEndpoint(parsed.endpoint || "");
        setApiKey(parsed.apiKey || "");
        setSystemPrompt(parsed.systemPrompt || "");
      } else {
        handleResetToDefault();
      }
    } catch (e) {
      console.error("Local storage read failed:", e);
      handleResetToDefault();
    }
  }

  function handleResetToDefault() {
    setEnabled(false);
    setEndpoint("https://api.yourdomain.com/v1/chat");
    setApiKey("");
    setSystemPrompt(
      "You are a helpful WhatsApp sales assistant. You will try to answer customer queries based on the catalog. If you don't know the answer, politely tell them that a human agent will take over."
    );
  }

  // SAVE CONFIGURATION
  async function handleSave() {
    setSaving(true);
    
    if (enabled && (!endpoint.trim() || !apiKey.trim())) {
      toast.error("Please enter a valid API Endpoint and API Key to enable the AI Router");
      setSaving(false);
      return;
    }

    try {
      if (dbMode === "supabase" && user) {
        // Save to Supabase
        const { error } = await supabase
          .from("ai_router_config")
          .upsert(
            {
              user_id: user.id,
              enabled,
              endpoint: endpoint.trim(),
              api_key: apiKey.trim(),
              system_prompt: systemPrompt.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Supabase save failed, fallback to local:", error.message);
          saveLocalFallback();
        } else {
          toast.success("AI Router settings securely saved in cloud database!");
        }
      } else {
        saveLocalFallback();
      }
    } catch (err) {
      console.error("Save error:", err);
      saveLocalFallback();
    } finally {
      setSaving(false);
    }
  }

  function saveLocalFallback() {
    try {
      setDbMode("local");
      const payload = {
        enabled,
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim(),
        systemPrompt: systemPrompt.trim(),
      };
      localStorage.setItem("wacrm_ai_router_config", JSON.stringify(payload));
      toast.success("AI settings saved locally in browser cache!");
    } catch (e) {
      console.error("Local storage save failed:", e);
      toast.error("Failed to save settings. Please verify browser permissions.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/10 border border-slate-800 rounded-xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-slate-400 text-sm">Fetching AI configuration parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 mt-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-3xl rounded-full -z-10" />
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              AI Chatbot & Agent Router 
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              Active Agent
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
            Configure your AI integration. When enabled, your chatbot automatically answers incoming customer messages and routes them to live staff when needed.
          </p>
        </div>

        {/* Toggle & Storage Mode badge */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-lg">
            <span className="text-sm font-semibold text-slate-200">Enable Agent Router</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                enabled ? "bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-700"
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
          
          {/* Database Mode indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-2">
            {dbMode === "supabase" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Cloud Database Connection Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Offline Cache Mode (Simulated)</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={cn(
        "grid gap-8 transition-all duration-300 relative", 
        !enabled && "opacity-40 pointer-events-none filter grayscale-[40%]"
      )}>
        
        {/* Connection Configuration */}
        <div className={cn(
          "rounded-xl border bg-slate-900/50 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300",
          enabled ? "border-indigo-500/20" : "border-slate-800"
        )}>
          <div className="border-b border-slate-850 bg-slate-950/40 p-4 flex items-center gap-2">
            <Network className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Webhook Connection Credentials</h3>
          </div>
          
          <div className="p-6 space-y-5">
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Connect your own AI engine, OpenAI flow, or API webhook. When a new WhatsApp chat is received, we will make a secure HTTP POST request to this endpoint. Put your endpoint token or Bearer key below.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-slate-300">API Endpoint URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="e.g. https://api.yourdomain.com/v1/chat"
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white font-mono text-xs focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-slate-300">API Authentication Token (Bearer Key)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white font-mono text-xs focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Behavior Prompt */}
        <div className={cn(
          "rounded-xl border bg-slate-900/50 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300",
          enabled ? "border-indigo-500/20" : "border-slate-800"
        )}>
          <div className="border-b border-slate-850 bg-slate-950/40 p-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Bot Personality & Prompt Context</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">System prompt / Custom Context Instructions</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Give details about your company, products, and rules..."
                className="bg-slate-800/80 border-slate-700 text-white resize-none text-sm leading-relaxed focus-visible:ring-indigo-500/30"
              />
              <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                This custom context is sent in the JSON payload to your webhook endpoint on every customer message.
              </p>
            </div>
          </div>
        </div>

        {/* Webhook JSON Schema Guideline */}
        <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/10 p-6 flex items-start gap-4 shadow-inner">
          <ShieldCheck className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-indigo-200">Webhook POST Payload Protocol</h4>
            <p className="text-xs text-indigo-300/70 mt-1 mb-4 leading-relaxed max-w-2xl">
              We send customer chat parameters directly to your endpoint. For normal replies, respond with your answer string. To route to a live human agent, simply return: <code>{`{ "action": "route_to_agent" }`}</code>.
            </p>
            <pre className="bg-[#020617] rounded-lg p-4 text-[11px] font-mono text-indigo-200 overflow-x-auto border border-indigo-900/40 shadow-2xl">
{`{
  "contact_id": "uuid-identification",
  "phone": "+15550199823",
  "message_body": "What is the price of the growths tier?",
  "system_prompt": "You are a helpful WhatsApp sales assistant...",
  "history": [
    {"role": "user", "content": "Hi there"},
    {"role": "assistant", "content": "Hello! How can I help you today?"}
  ]
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Save Trigger Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 shadow-lg shadow-indigo-900/10"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving Settings...
            </>
          ) : (
            "Save AI Configuration"
          )}
        </Button>
      </div>
    </div>
  );
}
