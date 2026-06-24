'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Send,
  MessageSquare,
  AlertTriangle,
  Clock,
  ThumbsUp,
  FileCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FollowUpTrigger {
  id: string;
  type: 'proposal_sent' | 'quotation_sent' | 'payment_pending' | 'no_response' | 'meeting_completed' | 'lost_lead';
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
  urgency: 'high' | 'medium' | 'low';
}

interface FollowUpEngineProps {
  contact: any;
  proposals?: any[];
  quotations?: any[];
  invoices?: any[];
  payments?: any[];
  meetings?: any[];
  deals?: any[];
}

export function FollowUpEngine({
  contact,
  proposals = [],
  quotations = [],
  invoices = [],
  payments = [],
  meetings = [],
  deals = [],
}: FollowUpEngineProps) {
  const [loadingTrigger, setLoadingTrigger] = useState<string | null>(null);
  const [draftedTexts, setDraftedTexts] = useState<Record<string, string>>({});
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);

  // 1. Compute active follow-up warnings based on data states
  const activeTriggers = useMemo(() => {
    const triggers: FollowUpTrigger[] = [];
    if (!contact) return [];

    // Check lost lead reconnection
    const activeDeal = deals[0] || null;
    if (activeDeal && activeDeal.status === 'lost') {
      const dealDate = new Date(activeDeal.updated_at || activeDeal.created_at);
      const daysSinceLost = Math.floor((Date.now() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLost >= 30) {
        triggers.push({
          id: 'lost_lead-' + activeDeal.id,
          type: 'lost_lead',
          title: 'Reconnect Lost Lead Campaign',
          description: `This lead was marked as LOST ${daysSinceLost} days ago. It is time to run a gentle, low-pressure reconnection check-in.`,
          icon: <Clock className="size-4 text-amber-500" />,
          badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          urgency: 'low',
        });
      }
    }

    // Check payment pending status
    const pendingInvoice = invoices.find(i => i.status === 'pending' || i.status === 'overdue');
    if (pendingInvoice) {
      triggers.push({
        id: 'payment_pending-' + pendingInvoice.id,
        type: 'payment_pending',
        title: 'Payment Link Pending Alert',
        description: `Invoice #${pendingInvoice.invoice_number} is pending. Draft an automatic payment reminder containing payment details.`,
        icon: <AlertTriangle className="size-4 text-rose-500" />,
        badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        urgency: 'high',
      });
    }

    // Check quotation sent status
    const sentQuotation = quotations.find(q => q.status === 'sent' || q.status === 'generated');
    if (sentQuotation && !pendingInvoice) {
      const quoteDate = new Date(sentQuotation.updated_at || sentQuotation.created_at);
      const daysSinceQuote = Math.floor((Date.now() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceQuote >= 3) {
        triggers.push({
          id: 'quotation_sent-' + sentQuotation.id,
          type: 'quotation_sent',
          title: 'Quotation Follow-up Warning',
          description: `Quotation for ${sentQuotation.service_required} was sent ${daysSinceQuote} days ago without signature. Send a commercial follow-up.`,
          icon: <Zap className="size-4 text-indigo-400" />,
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          urgency: 'high',
        });
      }
    }

    // Check proposal sent status
    const sentProposal = proposals.find(p => p.status === 'sent' || p.status === 'generated');
    if (sentProposal && quotations.length === 0) {
      const propDate = new Date(sentProposal.updated_at || sentProposal.created_at);
      const daysSinceProp = Math.floor((Date.now() - propDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceProp >= 2) {
        triggers.push({
          id: 'proposal_sent-' + sentProposal.id,
          type: 'proposal_sent',
          title: 'Proposal Follow-up Warning',
          description: `B2B Proposal for ${sentProposal.service_required} was sent ${daysSinceProp} days ago. Sync up to lock core requirements.`,
          icon: <FileCheck className="size-4 text-purple-400" />,
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          urgency: 'medium',
        });
      }
    }

    // Check meeting completed feedback request
    const completedMeeting = meetings.find(m => m.status === 'completed' && !m.summary);
    if (completedMeeting) {
      triggers.push({
        id: 'meeting_completed-' + completedMeeting.id,
        type: 'meeting_completed',
        title: 'Meeting Feedback & Follow-up',
        description: `Consultation "${completedMeeting.title}" was completed. Send a polite thank-you message and ask for feedback.`,
        icon: <ThumbsUp className="size-4 text-emerald-450" />,
        badgeColor: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20',
        urgency: 'medium',
      });
    }

    // Default gentle nudge if no other triggers exist and last message is old
    if (triggers.length === 0) {
      triggers.push({
        id: 'no_response-default',
        type: 'no_response',
        title: 'Gentle Nudge Check-in',
        description: 'Keep client warm. Draft a helpful, low-friction check-in message asking if they need any technical assistance.',
        icon: <MessageSquare className="size-4 text-slate-400" />,
        badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
        urgency: 'low',
      });
    }

    return triggers;
  }, [contact, proposals, quotations, invoices, payments, meetings, deals]);

  const handleDraftMessage = async (trigger: FollowUpTrigger) => {
    setLoadingTrigger(trigger.id);
    try {
      const response = await fetch(`/api/contacts/${contact.id}/follow-up/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: trigger.type,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to draft message');

      setDraftedTexts(prev => ({
        ...prev,
        [trigger.id]: data.draft,
      }));
    } catch (err) {
      console.error('[Follow-up Engine] draft error:', err);
    } finally {
      setLoadingTrigger(null);
    }
  };

  const handleCopy = (text: string, triggerId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrigger(triggerId);
    setTimeout(() => setCopiedTrigger(null), 2000);
  };

  const handleSendWhatsApp = (text: string) => {
    const formattedPhone = contact.phone?.replace(/[^0-9]/g, '') || '';
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-950/20 border border-indigo-500/25 rounded-xl">
          <Bell className="size-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">AI Follow-up Automation</h3>
          <p className="text-[10px] text-slate-500 leading-none">Contextual trigger alerts & auto-drafting</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {activeTriggers.map(trigger => {
          const draftText = draftedTexts[trigger.id];
          const isDrafted = !!draftText;
          const isCopied = copiedTrigger === trigger.id;
          const isLoading = loadingTrigger === trigger.id;

          return (
            <div
              key={trigger.id}
              className="bg-slate-900/15 border border-slate-850 p-4 rounded-xl space-y-3 hover:bg-slate-900/30 transition-all animate-in fade-in-40 duration-200"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg shrink-0 mt-0.5">
                    {trigger.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 leading-tight flex items-center gap-2">
                      {trigger.title}
                      <Badge className={cn('text-[8px] font-bold tracking-wider uppercase px-1.5 border leading-none', trigger.badgeColor)}>
                        {trigger.urgency}
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{trigger.description}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons / Render Draft Text Area */}
              {isDrafted ? (
                <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                  <textarea
                    value={draftText}
                    onChange={e => setDraftedTexts(prev => ({ ...prev, [trigger.id]: e.target.value }))}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-[11px] font-mono text-slate-300 leading-relaxed focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCopy(draftText, trigger.id)}
                      className="bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-bold h-7 rounded-lg flex items-center gap-1 border border-slate-800"
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3 text-emerald-450" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-slate-400" />
                          Copy Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSendWhatsApp(draftText)}
                      className="bg-emerald-650 hover:bg-emerald-600 text-white text-[10px] font-bold h-7 rounded-lg flex items-center gap-1 shadow-lg shadow-emerald-950/20"
                    >
                      <Send className="size-3" />
                      Send WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleDraftMessage(trigger)}
                  disabled={isLoading}
                  className="w-full bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold h-7 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3 animate-spin text-indigo-400" />
                      Drafting custom follow-up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3 text-amber-400" />
                      Draft Follow-up Message
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
