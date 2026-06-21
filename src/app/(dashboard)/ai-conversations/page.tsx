"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Sparkles, 
  ArrowLeft, 
  ArrowRightLeft, 
  Loader2, 
  Activity, 
  BarChart3, 
  AlertCircle, 
  UserCheck, 
  CheckCircle,
  Clock,
  Compass
} from "lucide-react";
import { toast } from "sonner";

interface AIConversation {
  id: string;
  total_ai_messages: number;
  ai_active: boolean;
  handed_off_at: string | null;
  provider: string;
  model: string;
  created_at: string;
  conversations: {
    id: string;
    last_message_text: string;
    last_message_at: string;
    contacts: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
}

interface AIUsageLog {
  id: string;
  operation: string;
  provider: string;
  model: string;
  total_tokens: number;
  confidence: number | null;
  finish_reason: string | null;
  created_at: string;
}

export default function AiConversationsPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([]);

  // Stats
  const [totalHandled, setTotalHandled] = useState(0);
  const [activeAI, setActiveAI] = useState(0);
  const [handedOff, setHandedOff] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function loadData() {
    try {
      setLoading(true);
      if (!user) return;

      // 1. Fetch AI Conversations from MongoDB
      const resConvs = await fetch("/api/ai/conversations");
      if (!resConvs.ok) throw new Error("Failed to fetch AI conversations");
      const typedConvs = await resConvs.json() as AIConversation[];
      setConversations(typedConvs);

      // 2. Fetch recent usage logs from MongoDB
      const resLogs = await fetch("/api/ai/logs");
      if (!resLogs.ok) throw new Error("Failed to fetch AI usage logs");
      const logData = await resLogs.json() as AIUsageLog[];
      setUsageLogs(logData);

      // 3. Compute Metrics
      setTotalHandled(typedConvs.length);
      setActiveAI(typedConvs.filter(c => c.ai_active).length);
      setHandedOff(typedConvs.filter(c => c.handed_off_at !== null).length);

      if (logData && logData.length > 0) {
        const confLogs = logData.filter(l => l.confidence !== null);
        const avgConf = confLogs.length > 0 
          ? confLogs.reduce((sum, l) => sum + Number(l.confidence), 0) / confLogs.length 
          : 0.85; // fallback high confidence default
        setAvgConfidence(avgConf);

        const tokensSum = logData.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
        setTotalTokens(tokensSum);
      }

    } catch (err: any) {
      console.error("Failed to load AI analytics data:", {
        message: err?.message || err,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
      toast.error("Could not fetch AI logs and statistics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link href="/ai-router" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to AI Settings
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Operations & Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor active bot conversations, review LLM confidence metrics, and audit token consumption usage logs.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={loadData}
          disabled={loading}
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          Reload Logs
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
          <span className="text-sm">Fetching analytics and logs...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-slate-900/30 border-slate-850 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Handled</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{totalHandled}</span>
              <span className="text-[10px] text-indigo-400 mt-1 block font-semibold flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" />
                Conversations
              </span>
            </Card>

            <Card className="bg-slate-900/30 border-slate-850 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Bots</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{activeAI}</span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">Currently replies</span>
            </Card>

            <Card className="bg-slate-900/30 border-slate-850 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Handoffs</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{handedOff}</span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                Rate: {totalHandled > 0 ? ((handedOff / totalHandled) * 100).toFixed(0) : 0}%
              </span>
            </Card>

            <Card className="bg-slate-900/30 border-slate-850 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Confidence</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{(avgConfidence * 100).toFixed(0)}%</span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">LLM confidence avg</span>
            </Card>

            <Card className="bg-slate-900/30 border-slate-850 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tokens Injected</span>
              <span className="text-2xl font-extrabold text-slate-200 mt-1 block">{totalTokens.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium flex items-center gap-0.5">
                <BarChart3 className="h-3 w-3 text-slate-400" />
                Last 100 events
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversations List Card */}
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Bot className="h-4.5 w-4.5 text-indigo-400" />
                  AI Handled Conversations
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Active chats where the AI Agent is reading context and answering.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/10">
                    <Compass className="h-8 w-8 text-slate-700 mb-2" />
                    <span className="text-xs font-semibold text-slate-400">No active AI chats found</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {conversations.map((c) => {
                      const contactName = c.conversations?.contacts?.name || c.conversations?.contacts?.phone || "Unknown Customer";
                      const lastMsg = c.conversations?.last_message_text || "No messages";
                      return (
                        <div key={c.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-850/60 bg-slate-950/20 hover:bg-slate-950/40 transition-colors">
                          <div className="min-w-0 pr-3">
                            <span className="font-semibold text-slate-200 text-xs block">{contactName}</span>
                            <span className="text-[10px] text-slate-500 block truncate mt-1">{lastMsg}</span>
                            <span className="text-[9px] text-slate-600 block mt-0.5 uppercase font-mono">
                              Model: {c.model || c.provider} • Messages: {c.total_ai_messages}
                            </span>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {c.ai_active ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 text-[9px] px-1.5 py-0">
                                Bot Active
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                                <ArrowRightLeft className="h-2 w-2" />
                                Handoff
                              </Badge>
                            )}
                            <span className="text-[9px] text-slate-500 font-medium">
                              {c.conversations?.last_message_at ? new Date(c.conversations.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ingestion & Operations Logs */}
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
                  Recent Execution Logs
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  A trace of token consumption, models triggered, and response confidence.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {usageLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/10">
                    <Activity className="h-8 w-8 text-slate-700 mb-2" />
                    <span className="text-xs">No execution logs logged yet</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {usageLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg border border-slate-850/60 bg-slate-950/20 text-slate-300 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 capitalize">
                            {log.operation}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {log.provider} • {log.model.split('/').pop()}
                          </span>
                          <span className="font-mono text-slate-500">
                            {log.total_tokens} tokens
                          </span>
                        </div>
                        {log.confidence !== null && (
                          <div className="flex items-center justify-between text-[9px] pt-0.5">
                            <span className="text-slate-500">Confidence Match:</span>
                            <span className={log.confidence >= 0.7 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                              {(log.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
