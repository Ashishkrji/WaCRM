"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Bot,
  Sliders,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MessageSquare,
  ChevronDown,
  Info,
  Edit2,
  X,
  Play,
  Settings2,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { AIAgentConfig } from "@/lib/ai/types";

const PROVIDERS = [
  { id: "", name: "Default (inherited)" },
  { id: "nvidia", name: "NVIDIA NIM", models: ["nvidia/llama-3.1-nemotron-70b-instruct", "meta/llama-3.1-8b-instruct"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro"] },
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"] },
  { id: "claude", name: "Anthropic Claude", models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"] },
  { id: "openrouter", name: "OpenRouter", models: ["meta-llama/llama-3.1-8b-instruct:free", "google/gemini-2.5-flash"] },
  { id: "local", name: "Local LLM", models: ["llama3", "mistral", "phi3"] }
];

export default function AIAgentsPage() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<AIAgentConfig[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgentConfig | null>(null);

  // Edit fields
  const [enabled, setEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [priority, setPriority] = useState(5);

  useEffect(() => {
    if (authLoading) return;
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function loadAgents() {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/agents");
      if (!res.ok) throw new Error("Failed to fetch AI agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err: any) {
      toast.error("Error loading agents: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (agent: AIAgentConfig) => {
    setEditingAgent(agent);
    setEnabled(agent.enabled);
    setSystemPrompt(agent.systemPrompt);
    setProvider(agent.provider || "");
    setModel(agent.model || "");
    setTemperature(agent.temperature ?? 0.7);
    setPriority(agent.priority);
    setIsModalOpen(true);
  };

  const handleProviderChange = (provId: string) => {
    setProvider(provId);
    const selected = PROVIDERS.find((p) => p.id === provId);
    if (selected && selected.models && selected.models.length > 0) {
      setModel(selected.models[0]);
    } else {
      setModel("");
    }
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    setSaving(true);
    try {
      const res = await fetch("/api/ai/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: editingAgent.agentId,
          enabled,
          systemPrompt: systemPrompt.trim(),
          provider: provider || null,
          model: model || null,
          temperature,
          priority,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update agent");
      }

      toast.success(`Agent "${editingAgent.name}" configuration updated!`);
      setIsModalOpen(false);
      await loadAgents();
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/10 border border-slate-800 rounded-xl">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm">Loading AI Workforce components...</p>
      </div>
    );
  }

  const activeProvider = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10 mt-4 px-4 sm:px-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-3xl rounded-full -z-10" />
        
        <div>
          <div className="flex items-center gap-3">
            <Link href="/ai-router">
              <Button variant="ghost" size="sm" className="p-0 text-slate-400 hover:text-white mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              AI Workforce Manager
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              <Bot className="h-3 w-3" />
              Multi-Agent Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Manage your digital agency's AI agents. Orchestrate specialized agents for Sales, Web Development, SEO, Support, and Business tasks using shared memory and context.
          </p>
        </div>

        {/* Quick Nav */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <Link href="/ai-router">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 text-xs text-slate-300">
              <Settings2 className="h-3.5 w-3.5" />
              Global Settings
            </Button>
          </Link>
          <Link href="/ai-knowledge">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 text-xs text-slate-300">
              <BookOpen className="h-3.5 w-3.5" />
              Knowledge Base
            </Button>
          </Link>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.agentId}
            className={cn(
              "rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg relative overflow-hidden bg-slate-900/40 backdrop-blur-sm",
              agent.enabled
                ? "border-slate-800 hover:border-indigo-500/30"
                : "border-slate-850 opacity-50 filter grayscale-[20%]"
            )}
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg border",
                    agent.enabled ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-slate-800 border-slate-700 text-slate-500"
                  )}>
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-slate-100 text-sm">
                    {agent.name}
                  </span>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    agent.enabled
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  )}
                >
                  {agent.enabled ? "Active" : "Disabled"}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                {agent.description}
              </p>

              {/* Model Info */}
              <div className="mt-4 pt-3 border-t border-slate-850 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Provider</span>
                  <span className="text-slate-300 font-medium">
                    {agent.provider ? agent.provider.toUpperCase() : "Global default"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Model</span>
                  <span className="text-slate-300 font-medium truncate max-w-[150px]">
                    {agent.model || "Global default"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Priority</span>
                  <span className="text-slate-300 font-medium">{agent.priority}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-850 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick(agent)}
                className="text-xs text-indigo-400 hover:text-white hover:bg-indigo-500/10 flex items-center gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isModalOpen && editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl border border-slate-800 bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/20">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-4.5 w-4.5 text-indigo-400" />
                Configure {editingAgent.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between bg-slate-950/30 p-3 rounded-lg border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Agent Status</span>
                  <span className="text-xs text-slate-500">Allow AI Router to dispatch to this agent</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled(!enabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                    enabled ? "bg-indigo-600" : "bg-slate-700"
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

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Description</Label>
                <p className="text-xs text-slate-400 font-normal leading-relaxed bg-slate-950/40 p-3 rounded border border-slate-850">
                  {editingAgent.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-prompt" className="text-xs text-slate-300">Custom System Prompt Override</Label>
                <Textarea
                  id="agent-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  placeholder="Define persona, instructions, templates and action rules..."
                  className="bg-slate-950 border-slate-800 text-white font-mono text-xs leading-relaxed resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="agent-provider" className="text-xs text-slate-300">Provider Override</Label>
                  <div className="relative">
                    <select
                      id="agent-provider"
                      value={provider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-md px-3 py-2 text-xs focus:outline-none appearance-none"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="agent-model" className="text-xs text-slate-300">Model Name Override</Label>
                  <Input
                    id="agent-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Global default"
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs">
                    <Label className="text-slate-300">Temperature</Label>
                    <span className="text-indigo-400 font-semibold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs">
                    <Label className="text-slate-300">Priority Weight</Label>
                    <span className="text-indigo-400 font-semibold">{priority}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Assigned Capabilities & Tools</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {editingAgent.tools.map((t) => (
                    <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded-md font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-6 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Overrides"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
