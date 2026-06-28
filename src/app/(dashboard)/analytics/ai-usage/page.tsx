"use client";

import { useEffect, useState } from "react";
import { 
  Bot, 
  Cpu, 
  Activity, 
  DollarSign, 
  Clock, 
  Workflow
} from "lucide-react";

export default function AIUsageAnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalRequests: 24500,
    avgLatencyMs: 340,
    totalTokens: 18500000,
    totalCostUSD: 37.00,
    fallbackEvents: 12,
  });

  const [providerShare, setProviderShare] = useState([
    { name: "NVIDIA NIM", share: 65, cost: 12.50 },
    { name: "Google Gemini", share: 20, cost: 9.20 },
    { name: "OpenAI", share: 10, cost: 11.30 },
    { name: "Anthropic Claude", share: 5, cost: 4.00 },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Usage & Cost Analytics</h1>
        <p className="text-slate-400 text-sm">Monitor LLM provider distribution, token consumption, latencies, and operational budgets.</p>
      </div>

      {/* Overview metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Requests</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {metrics.totalRequests.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500">Across all AI agents</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Latency</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {metrics.avgLatencyMs}ms
          </div>
          <span className="text-xs text-emerald-500">Optimal response speed</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tokens Consumed</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {(metrics.totalTokens / 1000000).toFixed(1)}M
          </div>
          <span className="text-xs text-slate-500">Prompt & completion tokens</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cost (USD)</span>
          <div className="mt-2 text-2xl font-bold text-white">
            ${metrics.totalCostUSD.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500">Accumulated this month</span>
        </div>
      </div>

      {/* Provider distribution & token breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Provider Share */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-550" /> LLM Provider Distribution
          </h2>

          <div className="space-y-4">
            {providerShare.map(provider => (
              <div key={provider.name} className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>{provider.name}</span>
                  <span className="font-semibold text-white">{provider.share}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${provider.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token and Fallback Performance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-550" /> Reliability & Fallbacks
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-850">
              <span className="text-sm text-slate-300">Fallback Redirection Events</span>
              <span className="text-sm font-semibold text-white">{metrics.fallbackEvents}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-850">
              <span className="text-sm text-slate-300">Service Level Agreement (SLA)</span>
              <span className="text-sm font-semibold text-emerald-400">99.95%</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-300">Average Token Generation Rate</span>
              <span className="text-sm font-semibold text-white">45 tokens/sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
