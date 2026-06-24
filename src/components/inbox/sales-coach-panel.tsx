'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Zap,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SalesCoachPanelProps {
  contactId: string;
  className?: string;
  onActionTrigger?: (actionType: 'proposal' | 'quotation' | 'meeting') => void;
}

export function SalesCoachPanel({ contactId, className, onActionTrigger }: SalesCoachPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [coachData, setCoachData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Accordion states
  const [expandedSection, setExpandedSection] = useState<'tips' | 'upsell' | 'risks'>('tips');

  const fetchCoachIntelligence = async () => {
    if (!contactId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch from our centralized sales-intelligence API
      const response = await fetch(`/api/contacts/${contactId}/sales-intelligence`);
      if (!response.ok) throw new Error('Failed to load sales coach tips');
      
      const data = await response.json();
      setCoachData(data);
    } catch (err: any) {
      console.error('[Sales Coach] Fetch failed:', err);
      setError(err.message || 'Coach currently offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachIntelligence();
  }, [contactId]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/3 z-50 bg-slate-900 border-l border-y border-slate-800 p-2.5 rounded-l-xl text-primary hover:text-primary/80 shadow-2xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-850"
        title="Open AI Sales Coach"
      >
        <Sparkles className="size-4 animate-pulse text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider vertical-text writing-mode-vertical ml-1">Sales Coach</span>
      </button>
    );
  }

  // Generate dynamic risk alerts based on the fetched data
  const riskAlerts = [];
  if (coachData) {
    const { qualification, leadScore } = coachData;
    if (qualification?.urgency === 'Immediate' || qualification?.urgency === 'High') {
      riskAlerts.push({
        type: 'warning',
        message: 'High Urgency Lead: Needs immediate follow-up to lock requirements before competitor outreach.',
      });
    }
    if (leadScore < 40) {
      riskAlerts.push({
        type: 'danger',
        message: 'Low Lead Score: High risk of drop-off. Focus on building trust or qualification filters.',
      });
    }
    if (qualification?.decisionMaker === 'No' || qualification?.decisionMaker === 'Undetermined') {
      riskAlerts.push({
        type: 'info',
        message: 'Decision Maker not engaged: Ensure you loop in their executive head to advance deal stages.',
      });
    }
  }

  // Fallback default recommendations if AI has not loaded yet
  const recommendations = coachData?.recommendations || {
    bestService: 'Web Application Development',
    bestPackage: 'Premium Package',
    bestTechnology: 'Next.js & Supabase',
    upsells: ['Annual Maintenance Contract (AMC) ₹15,000/yr', 'Advanced SEO & Speed Marketing ₹12,000/mo'],
    crossSells: ['Meta Ads Campaign setup & Google Analytics integration'],
  };

  const salesInsights = coachData?.salesInsights || 'Focus on highlighting serverless speed benefits and WhatsApp automation features to show long-term operational savings.';
  const followUpStrategy = coachData?.followUpStrategy || 'Schedule a technical consultation call and send a structured B2B proposal within 24 hours.';

  return (
    <div className={cn(
      'w-80 border-l border-slate-850 bg-slate-950 flex flex-col h-full shrink-0 transition-all shadow-2xl relative',
      className
    )}>
      {/* Collapse button */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute -left-3.5 top-1/3 z-50 bg-slate-950 border border-slate-850 p-1 rounded-full text-slate-450 hover:text-white shadow-lg cursor-pointer"
        title="Collapse Sales Coach"
      >
        <ChevronRight className="size-3" />
      </button>

      {/* Title Header */}
      <div className="p-4 border-b border-slate-850 bg-slate-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Sparkles className="size-3.5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">AI Sales Coach</h3>
            <span className="text-[9px] text-slate-500 font-mono font-semibold">Real-time Conversion Co-pilot</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchCoachIntelligence}
          disabled={loading}
          className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-900 rounded-md"
        >
          {loading ? <Loader2 className="size-2.5 animate-spin" /> : 'Sync'}
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3 text-slate-500">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-wider">Analyzing deal history...</p>
        </div>
      ) : error ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-2">
          <AlertTriangle className="size-6 text-amber-500/80" />
          <p className="text-xs font-semibold text-slate-400">{error}</p>
          <Button
            size="sm"
            onClick={fetchCoachIntelligence}
            className="h-7 text-[10px] bg-primary text-white font-bold rounded-lg px-3"
          >
            Retry Analysis
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Lead Score Indicator Card */}
          {coachData && (
            <div className="bg-slate-900/35 border border-slate-850 p-3 rounded-xl flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lead Health Score</span>
                <p className="text-xl font-black text-white font-mono mt-0.5">{coachData.leadScore}<span className="text-xs text-slate-500 font-normal">/100</span></p>
              </div>
              <Badge className={cn(
                'text-[9px] font-bold border uppercase tracking-wider px-2 py-0.5',
                coachData.leadCategory === 'hot' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                coachData.leadCategory === 'warm' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                coachData.leadCategory === 'vip' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                coachData.leadCategory === 'enterprise' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                'bg-slate-900 text-slate-400 border-slate-800'
              )}>
                {coachData.leadCategory} Lead
              </Badge>
            </div>
          )}

          {/* SECTION 1: AI Negotiation & Reply Strategy */}
          <div className="border border-slate-850 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'tips' ? '' as any : 'tips')}
              className="w-full p-3 bg-slate-900/20 hover:bg-slate-900/30 flex items-center justify-between text-left border-b border-slate-850"
            >
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="size-3.5 text-primary" />
                Negotiation Coach
              </span>
              {expandedSection === 'tips' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {expandedSection === 'tips' && (
              <div className="p-3 bg-slate-950/40 space-y-3 text-xs leading-relaxed">
                <div>
                  <h4 className="font-bold text-[10px] text-slate-450 uppercase tracking-wider mb-1">Live Sales Strategy:</h4>
                  <p className="text-slate-300 bg-slate-900/30 border border-slate-850 p-2 rounded-lg italic">
                    "{salesInsights}"
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-450 uppercase tracking-wider mb-1">Recommended Tech Stack:</h4>
                  <p className="text-slate-300 font-mono text-[11px]">
                    🚀 {recommendations.bestTechnology} ({recommendations.bestService})
                  </p>
                </div>
                {onActionTrigger && (
                  <div className="pt-2 border-t border-slate-850 flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => onActionTrigger('proposal')}
                      className="h-7 text-[10px] font-bold bg-purple-650 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-1"
                    >
                      <Sparkles className="size-3 text-amber-400" />
                      Create AI B2B Proposal
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onActionTrigger('quotation')}
                      className="h-7 text-[10px] font-bold bg-fuchsia-650 hover:bg-fuchsia-600 text-white rounded-lg flex items-center justify-center gap-1"
                    >
                      <Percent className="size-3 text-white" />
                      Issue Pricing Quotation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: Upsells & Cross-sells Recommendations */}
          <div className="border border-slate-850 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'upsell' ? '' as any : 'upsell')}
              className="w-full p-3 bg-slate-900/20 hover:bg-slate-900/30 flex items-center justify-between text-left border-b border-slate-850"
            >
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="size-3.5 text-amber-450" />
                Upsell & Cross-sell
              </span>
              {expandedSection === 'upsell' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {expandedSection === 'upsell' && (
              <div className="p-3 bg-slate-950/40 space-y-3 text-xs leading-relaxed">
                <div>
                  <h4 className="font-bold text-[10px] text-amber-400 uppercase tracking-wider mb-1.5">Upsell Suggestions (Add to Deal)</h4>
                  <ul className="space-y-1.5">
                    {recommendations.upsells?.map((up: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <CheckCircle className="size-3 text-emerald-450 shrink-0 mt-0.5" />
                        <span>{up}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-850 pt-2">
                  <h4 className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider mb-1.5">Cross-sell Suggestions</h4>
                  <ul className="space-y-1.5">
                    {recommendations.crossSells?.map((cross: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <CheckCircle className="size-3 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{cross}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Risk Warning Alerts */}
          <div className="border border-slate-850 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'risks' ? '' as any : 'risks')}
              className="w-full p-3 bg-slate-900/20 hover:bg-slate-900/30 flex items-center justify-between text-left border-b border-slate-850"
            >
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="size-3.5 text-rose-450" />
                Deal Risk Warnings
              </span>
              {expandedSection === 'risks' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {expandedSection === 'risks' && (
              <div className="p-3 bg-slate-950/40 space-y-2.5 text-[11px]">
                {riskAlerts.length === 0 ? (
                  <p className="text-slate-500 italic py-2 text-center">No active risks detected. Deal is healthy.</p>
                ) : (
                  riskAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-2.5 rounded-lg border flex gap-2',
                        alert.type === 'danger' ? 'bg-rose-950/20 border-rose-500/20 text-rose-400' :
                        alert.type === 'warning' ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' :
                        'bg-slate-900 border-slate-800 text-slate-400'
                      )}
                    >
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
