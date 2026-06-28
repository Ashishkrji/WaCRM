"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Layers,
  ArrowRight,
  Filter
} from "lucide-react";

export default function SalesAnalyticsPage() {
  const [pipelineData, setPipelineData] = useState({
    newLeads: 120,
    qualifiedLeads: 85,
    wonDeals: 32,
    conversionRate: 26.6,
    avgDealValue: 45000,
    totalPipelineValue: 1845000,
  });

  const [revenueByEmployee, setRevenueByEmployee] = useState([
    { name: "Ashish Kumar", deals: 14, revenue: 630000 },
    { name: "Rahul Singh", deals: 10, revenue: 450000 },
    { name: "Priya Sharma", deals: 8, revenue: 360000 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Analytics</h1>
          <p className="text-slate-400 text-sm">Analyze sales pipelines, deal sizes, and employee sales performance.</p>
        </div>
      </div>

      {/* Top metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pipeline Value</span>
          <div className="mt-2 text-2xl font-bold text-white">
            ₹{pipelineData.totalPipelineValue.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500">Value of all open and won deals</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Deal Size</span>
          <div className="mt-2 text-2xl font-bold text-white">
            ₹{pipelineData.avgDealValue.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-500 flex items-center gap-0.5">
            <TrendingUp className="h-3 w-3" /> +5.2% this month
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sales Conversion Rate</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {pipelineData.conversionRate}%
          </div>
          <span className="text-xs text-slate-500">Leads to won deals ratio</span>
        </div>
      </div>

      {/* Pipeline Funnel & Employee Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline Funnel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-550" /> Pipeline Funnel Stages
          </h2>

          <div className="space-y-4">
            {/* New Leads */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>New Leads</span>
                <span className="font-semibold text-white">{pipelineData.newLeads}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Qualified Leads */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Qualified Leads</span>
                <span className="font-semibold text-white">{pipelineData.qualifiedLeads}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500/80" style={{ width: `${(pipelineData.qualifiedLeads / pipelineData.newLeads) * 100}%` }} />
              </div>
            </div>

            {/* Won Deals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Won Deals</span>
                <span className="font-semibold text-white">{pipelineData.wonDeals}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500/60" style={{ width: `${(pipelineData.wonDeals / pipelineData.newLeads) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Leaderboard */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-550" /> Sales Leaderboard
          </h2>

          <div className="divide-y divide-slate-850">
            {revenueByEmployee.map((emp, idx) => (
              <div key={emp.name} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-800">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.deals} deals closed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">₹{emp.revenue.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-500 uppercase font-extrabold">Top Performer</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
