"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { 
  Bot, 
  Link as LinkIcon, 
  Key, 
  Network, 
  ShieldCheck, 
  Sliders, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MessageSquare,
  ChevronDown,
  Info,
  FileText,
  Trash2,
  Edit2,
  Plus,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const PROVIDERS = [
  { id: "nvidia", name: "NVIDIA NIM (Default)", models: ["nvidia/llama-3.1-nemotron-70b-instruct", "meta/llama-3.1-8b-instruct"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro"] },
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"] },
  { id: "claude", name: "Anthropic Claude", models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"] },
  { id: "openrouter", name: "OpenRouter", models: ["meta-llama/llama-3.1-8b-instruct:free", "google/gemini-2.5-flash"] },
  { id: "local", name: "Local LLM (Ollama)", models: ["llama3", "mistral", "phi3"] }
];

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  is_default: boolean;
  intent_filter: string[];
  created_at: string;
}

export default function AiRouterPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbMode, setDbMode] = useState<"supabase" | "local">("supabase");
  const [showLegacy, setShowLegacy] = useState(false);

  // AI Configuration States
  const [enabled, setEnabled] = useState(false);
  const [autoReply, setAutoReply] = useState(false);
  const [aiProvider, setAiProvider] = useState("nvidia");
  const [model, setModel] = useState("nvidia/llama-3.1-nemotron-70b-instruct");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [humanHandoffMessage, setHumanHandoffMessage] = useState(
    "Thank you for your patience! A team member will be with you shortly. 🙏"
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful WhatsApp sales assistant. You will try to answer customer queries based on the catalog. If you don't know the answer, politely tell them that a human agent will take over."
  );
  
  // Legacy External Router Fields
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Prompt Templates state
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Template modal state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  useEffect(() => {
    if (authLoading) return;
    loadConfig();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Fetch templates from database
  async function fetchTemplates() {
    if (!user) return;
    try {
      setTemplatesLoading(true);
      const res = await fetch("/api/ai/prompts");
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      setTemplates(data || []);
    } catch (err: any) {
      console.error("Failed to load prompt templates:", err.message);
    } finally {
      setTemplatesLoading(false);
    }
  }

  // Save or Update Template
  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !templateName.trim() || !templateContent.trim()) return;

    try {
      const payload = {
        name: templateName.trim(),
        description: templateDesc.trim() || null,
        content: templateContent.trim(),
        id: editingTemplate?.id || undefined,
      };

      const res = await fetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save template");
      }

      toast.success(editingTemplate ? "Template updated successfully!" : "Template created successfully!");

      // Reset form and close modal
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      setTemplateName("");
      setTemplateDesc("");
      setTemplateContent("");
      await fetchTemplates();
    } catch (err: any) {
      toast.error("Failed to save template: " + err.message);
    }
  }

  // Set default (active) template
  async function handleSetActiveTemplate(tmpl: PromptTemplate) {
    if (!user) return;
    try {
      const res = await fetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tmpl.id,
          name: tmpl.name,
          description: tmpl.description,
          content: tmpl.content,
          is_default: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to set active template");
      }

      // Update active config prompt in state
      setSystemPrompt(tmpl.content);

      toast.success(`Prompt template "${tmpl.name}" is now active! Remember to save AI configuration.`);
      await fetchTemplates();
    } catch (err: any) {
      toast.error("Failed to set active template: " + err.message);
    }
  }

  // Delete template
  async function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this prompt template?")) return;
    try {
      const res = await fetch(`/api/ai/prompts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete template");
      }

      toast.success("Template deleted successfully!");
      await fetchTemplates();
    } catch (err: any) {
      toast.error("Failed to delete template: " + err.message);
    }
  }

  // Open modal for editing
  const handleOpenEditTemplate = (tmpl: PromptTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setTemplateDesc(tmpl.description || "");
    setTemplateContent(tmpl.content);
    setIsTemplateModalOpen(true);
  };

  // Update default model when provider changes
  const handleProviderChange = (provId: string) => {
    setAiProvider(provId);
    const selected = PROVIDERS.find(p => p.id === provId);
    if (selected && selected.models.length > 0) {
      setModel(selected.models[0]);
    }
  };

  // Load chatbot configurations
  async function loadConfig() {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from("ai_router_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("ai_router_config table query failed, falling back to localStorage:", error.message);
        loadLocalFallback();
      } else if (data) {
        setDbMode("supabase");
        setEnabled(data.enabled ?? false);
        setAutoReply(data.auto_reply ?? false);
        setAiProvider(data.ai_provider || "nvidia");
        setModel(data.model || "nvidia/llama-3.1-nemotron-70b-instruct");
        setConfidenceThreshold(Number(data.confidence_threshold ?? 0.7));
        setHumanHandoffMessage(data.human_handoff_message || "Thank you for your patience! A team member will be with you shortly. 🙏");
        setSystemPrompt(data.system_prompt || "");
        setEndpoint(data.endpoint || "");
        setApiKey(data.api_key || "");
      } else {
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
        setAutoReply(parsed.autoReply ?? false);
        setAiProvider(parsed.aiProvider || "nvidia");
        setModel(parsed.model || "");
        setConfidenceThreshold(parsed.confidenceThreshold ?? 0.7);
        setHumanHandoffMessage(parsed.humanHandoffMessage || "Thank you for your patience! A team member will be with you shortly. 🙏");
        setSystemPrompt(parsed.systemPrompt || "");
        setEndpoint(parsed.endpoint || "");
        setApiKey(parsed.apiKey || "");
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
    setAutoReply(false);
    setAiProvider("nvidia");
    setModel("nvidia/llama-3.1-nemotron-70b-instruct");
    setConfidenceThreshold(0.7);
    setHumanHandoffMessage("Thank you for your patience! A team member will be with you shortly. 🙏");
    setSystemPrompt(
      "You are a helpful WhatsApp sales assistant. You will try to answer customer queries based on the catalog. If you don't know the answer, politely tell them that a human agent will take over."
    );
    setEndpoint("");
    setApiKey("");
  }

  // SAVE CONFIGURATION
  async function handleSave() {
    setSaving(true);
    
    try {
      if (dbMode === "supabase" && user) {
        // Save to Supabase
        const { error } = await supabase
          .from("ai_router_config")
          .upsert(
            {
              user_id: user.id,
              enabled,
              auto_reply: autoReply,
              ai_provider: aiProvider,
              model,
              confidence_threshold: confidenceThreshold,
              human_handoff_message: humanHandoffMessage.trim(),
              system_prompt: systemPrompt.trim(),
              endpoint: endpoint.trim(),
              api_key: apiKey.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Supabase save failed, fallback to local:", error.message);
          saveLocalFallback();
        } else {
          toast.success("AI Agent settings securely saved in cloud database!");
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
        autoReply,
        aiProvider,
        model,
        confidenceThreshold,
        humanHandoffMessage: humanHandoffMessage.trim(),
        systemPrompt: systemPrompt.trim(),
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim(),
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
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm">Fetching AI configuration parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 mt-4">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-3xl rounded-full -z-10" />
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Enterprise AI Router
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              v2.0 Native Agent
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
            Configure your native AI Agent. Enable semantic RAG knowledge lookup, auto-replies, and intelligent confidence-based human handoff.
          </p>
        </div>

        {/* Action Quick Navigation Links */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <Link href="/ai-agents">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 text-xs text-slate-300">
              <Bot className="h-3.5 w-3.5" />
              AI Agents
            </Button>
          </Link>
          <Link href="/ai-knowledge">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 text-xs text-slate-300">
              <BookOpen className="h-3.5 w-3.5" />
              Knowledge Base
            </Button>
          </Link>
          <Link href="/ai-conversations">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 text-xs text-slate-300">
              <MessageSquare className="h-3.5 w-3.5" />
              AI Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Core Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/80 px-5 py-4 rounded-xl shadow-lg">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-slate-200 block">AI Agent Enabled</span>
            <span className="text-xs text-slate-500">Run core AI intent and memory modules</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
              enabled ? "bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out",
                enabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div className={cn(
          "flex items-center justify-between bg-slate-950/40 border border-slate-800/80 px-5 py-4 rounded-xl shadow-lg transition-all duration-300",
          !enabled && "opacity-40 pointer-events-none"
        )}>
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-slate-200 block">WhatsApp Auto-Reply</span>
            <span className="text-xs text-slate-500">Respond automatically to customer texts</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoReply}
            disabled={!enabled}
            onClick={() => setAutoReply(!autoReply)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
              autoReply ? "bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out",
                autoReply ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      <div className={cn(
        "grid gap-6 transition-all duration-300 relative", 
        !enabled && "opacity-40 pointer-events-none filter grayscale-[40%]"
      )}>
        
        {/* Provider Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="border-b border-slate-850 bg-slate-950/40 p-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">AI Provider Integration</h3>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Active Provider</Label>
                <div className="relative">
                  <select
                    value={aiProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  >
                    {PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Ensure the environment keys are set for your chosen provider.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Model Name</Label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. nvidia/llama-3.1-nemotron-70b-instruct"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
                <p className="text-[10px] text-slate-500">
                  Must be supported by the active provider.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Behavior Prompt */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="border-b border-slate-850 bg-slate-950/40 p-4 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Agent Settings & Personality</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Base System Prompt</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Give details about your company, products, and rules..."
                className="bg-slate-800 border-slate-700 text-white resize-none text-sm leading-relaxed"
              />
              <p className="text-[10px] text-slate-500">
                Determines how the AI structures its replies and treats your brand identity.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Human Handoff Message</Label>
              <Input
                value={humanHandoffMessage}
                onChange={(e) => setHumanHandoffMessage(e.target.value)}
                placeholder="e.g. A human will take over shortly..."
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
              <p className="text-[10px] text-slate-500">
                Sent to the customer when the AI confidence falls below the threshold or the user asks for a human.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <Label className="text-slate-300">Confidence Threshold for Auto-Reply</Label>
                <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Lower allows more responses but increases hallucination risk. Higher limits replies to high-confidence matches, handing off more chats.
              </p>
            </div>
          </div>
        </div>

        {/* AI Prompt Templates Manager */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="border-b border-slate-850 bg-slate-950/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">System Prompt Templates</h3>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setTemplateName("");
                setTemplateDesc("");
                setTemplateContent(systemPrompt);
                setIsTemplateModalOpen(true);
              }}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Template
            </Button>
          </div>

          <div className="p-6">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-500 text-xs">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading saved templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg bg-slate-950/20 text-xs text-slate-400">
                No custom templates created yet. Save your active prompt as a template.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className={cn(
                      "p-4 rounded-xl border bg-slate-950/20 flex flex-col justify-between transition-colors",
                      tmpl.is_default ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-850"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-200 text-xs truncate max-w-[150px]">
                          {tmpl.name}
                        </span>
                        {tmpl.is_default ? (
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetActiveTemplate(tmpl)}
                            className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors font-semibold"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                        {tmpl.description || "No description"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 line-clamp-3 font-mono bg-slate-950/40 p-2 rounded border border-slate-850">
                        {tmpl.content}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-850/60">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditTemplate(tmpl)}
                        className="h-7 w-7 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legacy external connection section */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/20 shadow-lg overflow-hidden">
          <button 
            type="button" 
            onClick={() => setShowLegacy(!showLegacy)}
            className="w-full flex items-center justify-between p-4 bg-slate-950/40 text-left text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Network className="h-4 w-4 text-slate-500" />
              Legacy External Router Settings
            </span>
            <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform duration-200", showLegacy && "transform rotate-180")} />
          </button>
          
          {showLegacy && (
            <div className="p-5 border-t border-slate-850 space-y-4 bg-slate-950/30">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If you connect an external webhook router, WaCRM will POST incoming messages to your external server rather than running the native provider models configured above.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">API Endpoint URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="https://api.yourdomain.com/v1/chat"
                      className="pl-8 bg-slate-800/80 border-slate-700 text-white font-mono text-xs focus-visible:ring-indigo-500/30"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">API Authentication Token</Label>
                  <div className="relative">
                    <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Token string"
                      className="pl-8 bg-slate-800/80 border-slate-700 text-white font-mono text-xs focus-visible:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Trigger Button */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-800/40">
        {/* Database Connection indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          {dbMode === "supabase" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Settings connected to Cloud Database</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Offline LocalStorage mode</span>
            </>
          )}
        </div>
        
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

      {/* Prompt Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/20">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-400" />
                {editingTemplate ? "Edit Prompt Template" : "Create Prompt Template"}
              </h3>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="template-name" className="text-xs text-slate-400">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g. FAQ Support Assistant"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="template-desc" className="text-xs text-slate-400">Description</Label>
                <Input
                  id="template-desc"
                  placeholder="e.g. Used for routing general inquiries"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="template-content" className="text-xs text-slate-400">System Instructions (Prompt)</Label>
                  <span className="text-[10px] text-slate-500">Supports variable interpolation</span>
                </div>
                <Textarea
                  id="template-content"
                  rows={8}
                  placeholder="Act as a sales agent... You can use variables like {{company_name}} and {{agent_name}}."
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white resize-none text-xs leading-relaxed"
                  required
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {["{{company_name}}", "{{agent_name}}", "{{lead_score}}", "{{vars.name}}"].map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => setTemplateContent(prev => prev + placeholder)}
                      className="text-[9px] bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700/60"
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs h-9 px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 font-semibold"
                >
                  {editingTemplate ? "Save Changes" : "Create Template"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
