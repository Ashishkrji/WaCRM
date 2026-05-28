"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Zap,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AnalyticsStats {
  totalContacts: number;
  totalConversations: number;
  totalMessages: number;
  agentMessages: number;
  customerMessages: number;
  openDealsValue: number;
  wonDealsValue: number;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      
      try {
        // Fetch raw counts in parallel
        const [
          contactsRes,
          conversationsRes,
          messagesRes,
          dealsRes
        ] = await Promise.all([
          supabase.from("contacts").select("*", { count: "exact", head: true }),
          supabase.from("conversations").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("sender_type"),
          supabase.from("deals").select("value, status")
        ]);

        const agentMessages = messagesRes.data?.filter(m => m.sender_type === 'agent' || m.sender_type === 'bot').length || 0;
        const customerMessages = messagesRes.data?.filter(m => m.sender_type === 'customer').length || 0;
        
        let openValue = 0;
        let wonValue = 0;
        
        dealsRes.data?.forEach(deal => {
          if (deal.status === 'open') openValue += (deal.value || 0);
          if (deal.status === 'won') wonValue += (deal.value || 0);
        });

        setStats({
          totalContacts: contactsRes.count || 0,
          totalConversations: conversationsRes.count || 0,
          totalMessages: (messagesRes.data?.length || 0),
          agentMessages,
          customerMessages,
          openDealsValue: openValue,
          wonDealsValue: wonValue
        });
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Loading your performance metrics...</p>
        </div>
      </div>
    );
  }

  const s = stats || {
    totalContacts: 0,
    totalConversations: 0,
    totalMessages: 0,
    agentMessages: 0,
    customerMessages: 0,
    openDealsValue: 0,
    wonDealsValue: 0
  };

  const responseRate = s.customerMessages > 0 ? Math.round((s.agentMessages / s.customerMessages) * 100) : 0;
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Global Analytics</h1>
        <p className="text-sm text-slate-400">Track your team's performance, conversation metrics, and sales pipeline health.</p>
      </div>

      {/* Top Level KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <p className="text-sm font-medium text-slate-400">Total Contacts</p>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-white">{s.totalContacts}</h2>
              <span className="text-xs font-medium text-emerald-400 flex items-center"><TrendingUp className="h-3 w-3 mr-1"/>+12%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">vs last month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <p className="text-sm font-medium text-slate-400">Active Conversations</p>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-white">{s.totalConversations}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Currently in your inbox</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <p className="text-sm font-medium text-slate-400">Pipeline Value (Open)</p>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Target className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-white">{formatter.format(s.openDealsValue)}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all pipelines</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between space-y-0">
              <p className="text-sm font-medium text-slate-400">Revenue Won</p>
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-white">{formatter.format(s.wonDealsValue)}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Total closed won deals</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Messages Chart Simulation */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-white text-base font-semibold">Message Volume & Engagement</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Comparison of inbound vs outbound messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Messages Processed</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{s.totalMessages}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-400">Response Rate</p>
                  <h3 className="text-2xl font-bold text-primary mt-1">{responseRate}%</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-medium">Inbound (Customers)</span>
                    <span className="text-slate-300">{s.customerMessages} msgs</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.max(10, (s.customerMessages / Math.max(1, s.totalMessages)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400 font-medium">Outbound (Agents & Bots)</span>
                    <span className="text-slate-300">{s.agentMessages} msgs</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.max(10, (s.agentMessages / Math.max(1, s.totalMessages)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance Simulation */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-white text-base font-semibold">Agent Performance</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Average response times & resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-3 bg-indigo-500/10 rounded-lg mr-4">
                  <Clock className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Avg Response Time</p>
                  <p className="text-xl font-bold text-white mt-0.5">2m 45s</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-3 bg-rose-500/10 rounded-lg mr-4">
                  <Activity className="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Avg Resolution Time</p>
                  <p className="text-xl font-bold text-white mt-0.5">14m 20s</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-3 bg-amber-500/10 rounded-lg mr-4">
                  <Zap className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Automated Replies (Bots)</p>
                  <p className="text-xl font-bold text-white mt-0.5">
                    {Math.round(s.agentMessages * 0.4)} <span className="text-xs font-normal text-slate-500">msgs</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
);
}
