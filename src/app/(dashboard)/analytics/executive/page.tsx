"use client";

import { useEffect, useState } from "react";
import { calculateKPIs, generateAIInsights, forecastFuturePerformance } from "@/analytics/bi-engine";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Sparkles, 
  Target, 
  Bot,
  Activity,
  ArrowRight
} from "lucide-react";

export default function ExecutiveBIDashboard() {
  const [kpis, setKPIs] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    // Simulated raw business metrics from Supabase/MongoDB
    const rawMetrics = {
      totalLeads: 450,
      convertedLeads: 54,
      currentPeriodRevenue: 125000,
      previousPeriodRevenue: 110000,
      totalDeals: 38,
      activeCustomers: 85,
      totalCustomers: 100,
      successfulAIRequests: 1840,
      totalAIRequests: 2000,
      totalResponseTimeSec: 45000,
      totalResponseCount: 900,
    };

    const calculatedKPIs = calculateKPIs(rawMetrics);
    setKPIs(calculatedKPIs);

    const generatedInsights = generateAIInsights(
      calculatedKPIs, 
      rawMetrics.currentPeriodRevenue, 
      rawMetrics.previousPeriodRevenue
    );
    setInsights(generatedInsights);

    const historicalRevenue = [80000, 95000, 110000, 125000];
    const historicalLeads = [300, 380, 410, 450];
    const projectedPerformance = forecastFuturePerformance(historicalRevenue, historicalLeads);
    setForecast(projectedPerformance);
  }, []);

  if (!kpis) return <div className="py-20 text-center text-slate-400">Loading Executive BI...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Executive BI & Analytics</h1>
        <p className="text-slate-400 text-sm">Corporate performance overview, KPIs, and forecasting intelligence.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue Growth</span>
            <DollarSign className="h-5 w-5 text-amber-550" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.revenueGrowth}%</span>
            <span className="text-xs text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> vs last month
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lead Conversion</span>
            <Target className="h-5 w-5 text-amber-550" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.leadConversionRate}%</span>
            <span className="text-xs text-slate-400">Overall conversion rate</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Retention</span>
            <Users className="h-5 w-5 text-amber-550" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.customerRetentionRate}%</span>
            <span className="text-xs text-emerald-500">Active user base</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Accuracy</span>
            <Bot className="h-5 w-5 text-amber-550" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.aiAccuracy}%</span>
            <span className="text-xs text-emerald-500">Successful completions</span>
          </div>
        </div>
      </div>

      {/* AI Insights & Predictive Forecasting */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Insight Engine */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> AI Insight Engine
          </h2>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-850 flex gap-3">
                <Activity className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Forecasting */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Predictive Business Forecasting</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-850 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Projected Revenue ({forecast.period})</span>
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Growth Trend
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                ₹{forecast.projectedRevenue.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-850 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Projected New Leads ({forecast.period})</span>
                <span className="text-sm font-semibold text-amber-550">Target Volume</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {forecast.projectedLeads} leads
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>Model Confidence: {forecast.confidenceScore}%</span>
              <span>Based on 4-month historical trend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
