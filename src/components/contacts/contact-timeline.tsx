'use client';

import { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import {
  MessageSquare,
  Calendar,
  FileText,
  Receipt,
  CreditCard,
  CheckSquare,
  Send,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Filter,
  Check,
  Signature,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  id: string;
  type: 'message' | 'meeting' | 'proposal' | 'quote' | 'invoice' | 'payment' | 'task' | 'campaign' | 'note' | 'created';
  title: string;
  timestamp: Date;
  description: string;
  meta?: any;
}

interface ContactTimelineProps {
  contact: any;
  messages?: any[];
  meetings?: any[];
  proposals?: any[];
  quotations?: any[];
  invoices?: any[];
  payments?: any[];
  tasks?: any[];
  campaigns?: any[];
  notes?: any[];
}

export function ContactTimeline({
  contact,
  messages = [],
  meetings = [],
  proposals = [],
  quotations = [],
  invoices = [],
  payments = [],
  tasks = [],
  campaigns = [],
  notes = [],
}: ContactTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'messages' | 'meetings' | 'billing' | 'tasks' | 'ai'>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [utmLogs, setUtmLogs] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!contact?.id) return;
    async function loadMarketingTimeline() {
      const { data: utms } = await supabase
        .from('utm_tracking')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false });
      if (utms) setUtmLogs(utms);

      const { data: stages } = await supabase
        .from('customer_journeys')
        .select('*')
        .eq('contact_id', contact.id)
        .order('entered_at', { ascending: false });
      if (stages) setJourneys(stages);
    }
    loadMarketingTimeline();
  }, [contact?.id, supabase]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Calculate Customer Decision Timeline Stage
  const stages = [
    { label: 'First Contact', desc: 'Initial inquiry logged' },
    { label: 'Requirements', desc: 'Scope & details discussion' },
    { label: 'Proposal', desc: 'B2B Proposal generated' },
    { label: 'Quotation', desc: 'Pricing quotation sent' },
    { label: 'Meeting', desc: 'Consultation & video call' },
    { label: 'Negotiation', desc: 'Terms & final adjustments' },
    { label: 'Payment', desc: 'Invoice payment processing' },
    { label: 'Project Started', desc: 'Kicked off and active' },
  ];

  const currentStageIndex = useMemo(() => {
    const hasCompletedPayment = payments.some(p => p.status === 'completed' || p.status === 'paid' || p.status === 'success');
    if (hasCompletedPayment) return 7; // Project Started

    const hasPendingPayment = invoices.some(i => i.status === 'pending' || i.status === 'overdue') || payments.some(p => p.status === 'pending');
    if (hasPendingPayment) return 6; // Payment

    const hasNegotiation = tasks.some(t => t.title?.toLowerCase().includes('negotiat') || t.description?.toLowerCase().includes('negotiat')) ||
                           notes.some(n => n.note_text?.toLowerCase().includes('negotiat') || n.note_text?.toLowerCase().includes('discount'));
    if (hasNegotiation) return 5; // Negotiation

    if (meetings.length > 0) return 4; // Meeting

    if (quotations.length > 0) return 3; // Quotation

    if (proposals.length > 0) return 2; // Proposal

    if (notes.length > 0 || tasks.length > 0) return 1; // Requirements

    return 0; // First Contact
  }, [payments, invoices, tasks, notes, meetings, quotations, proposals]);

  // 2. Build Timeline Items list
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    if (!contact) return [];

    // Contact Created
    items.push({
      id: 'created-' + contact.id,
      type: 'created',
      title: 'Contact Registered',
      timestamp: new Date(contact.created_at),
      description: `Contact added to the database via ${contact.lead_source || 'direct channel'}.`,
    });

    // WhatsApp Messages
    messages.forEach(m => {
      const isOutbound = m.sender_type !== 'customer';
      items.push({
        id: m.id,
        type: 'message',
        title: m.is_internal ? 'Internal Private Discussion' : isOutbound ? 'Outbound Message Sent' : 'Inbound Message Received',
        timestamp: new Date(m.created_at || m.timestamp),
        description: m.content_text || m.text || 'Media attachment',
        meta: {
          sender: m.sender_name || (isOutbound ? 'AI Agent/Employee' : contact.name),
          isInternal: m.is_internal,
          status: m.status,
        },
      });
    });

    // Meetings / Calls
    meetings.forEach(m => {
      items.push({
        id: m.id,
        type: 'meeting',
        title: m.title || 'Client Consultation Meeting',
        timestamp: new Date(m.start_time || m.created_at),
        description: `Meeting scheduled. Platform: ${m.platform?.replace('_', ' ').toUpperCase() || 'Google Meet'}. Agenda: ${m.agenda || 'General Scope Consultation'}.`,
        meta: {
          status: m.status,
          notes: m.notes,
          summary: m.summary,
          recordingLink: m.recording_link,
          platform: m.platform,
        },
      });
    });

    // Proposals
    proposals.forEach(p => {
      const details = p.details || {};
      const solutionSummary = details.solution || p.proposal_text || 'Digital Agency Proposal generated.';
      items.push({
        id: p.id,
        type: 'proposal',
        title: 'Project Proposal Drafted',
        timestamp: new Date(p.created_at),
        description: `B2B Proposal generated for service: ${p.service_required}. Status: ${p.status?.toUpperCase()}.`,
        meta: {
          status: p.status,
          details: details,
          signedAt: p.signed_at,
          clientSignature: p.client_signature,
        },
      });
    });

    // Quotations
    quotations.forEach(q => {
      items.push({
        id: q.id,
        type: 'quote',
        title: 'Commercial Quotation Issued',
        timestamp: new Date(q.created_at),
        description: `Pricing Quotation issued for ${q.service_required}. Grand Total: INR ${Number(q.total_amount).toLocaleString()}.`,
        meta: {
          status: q.status,
          items: q.items,
          signedAt: q.signed_at,
          clientSignature: q.client_signature,
        },
      });
    });

    // Invoices
    invoices.forEach(inv => {
      items.push({
        id: inv.id,
        type: 'invoice',
        title: `Invoice #${inv.invoice_number} Issued`,
        timestamp: new Date(inv.created_at),
        description: `Amount: INR ${Number(inv.amount).toLocaleString()} | Due: ${inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : 'On Receipt'}. Services: ${inv.services?.join(', ') || 'N/A'}.`,
        meta: {
          status: inv.status,
          dueDate: inv.due_date,
        },
      });
    });

    // Payments
    payments.forEach(pay => {
      items.push({
        id: pay.id,
        type: 'payment',
        title: 'Payment Received',
        timestamp: new Date(pay.payment_date || pay.created_at),
        description: `Amount: INR ${Number(pay.amount).toLocaleString()} via ${pay.payment_method?.toUpperCase() || 'UPI/Card'}. Status: ${pay.status.toUpperCase()}.`,
        meta: {
          transactionId: pay.transaction_id,
        },
      });
    });

    // Tasks
    tasks.forEach(t => {
      items.push({
        id: t.id,
        type: 'task',
        title: `CRM Task: ${t.title}`,
        timestamp: new Date(t.created_at),
        description: `${t.description || 'No description.'} Priority: ${t.priority.toUpperCase()} | Status: ${t.status.toUpperCase()}`,
        meta: {
          dueDate: t.due_date,
          status: t.status,
        },
      });
    });

    // Campaigns
    campaigns.forEach(c => {
      items.push({
        id: c.id,
        type: 'campaign',
        title: `Broadcast Campaign: ${c.name}`,
        timestamp: new Date(c.created_at),
        description: `Channel: ${c.type.toUpperCase()} | Delivery Status: ${c.status.toUpperCase()}`,
        meta: {
          stats: `Sent: ${c.sent_count} | Delivered: ${c.delivery_count} | Read: ${c.read_count}`,
        },
      });
    });

    // Notes
    notes.forEach(n => {
      items.push({
        id: n.id,
        type: 'note',
        title: 'Internal Account Note',
        timestamp: new Date(n.created_at),
        description: n.note_text,
        meta: {
          author: n.user_id,
        },
      });
    });

    // UTM Tracking Clicks & Page Visits
    utmLogs.forEach(u => {
      items.push({
        id: u.id,
        type: 'campaign',
        title: u.conversion_type ? `Goal Converted: ${u.conversion_type.replace('_', ' ').toUpperCase()}` : 'Landing Page Visited',
        timestamp: new Date(u.created_at),
        description: `Visited ${u.url_path} via ${u.utm_source || 'Direct'} (${u.utm_medium || 'Web'}). Campaign: ${u.utm_campaign || 'None'}. Device: ${u.device_type || 'Desktop'}.`,
        meta: {
          utm_source: u.utm_source,
          utm_medium: u.utm_medium,
          utm_campaign: u.utm_campaign,
        }
      });
    });

    // Customer Journeys Stages
    journeys.forEach(j => {
      items.push({
        id: j.id,
        type: 'note',
        title: `Lifecycle Stage: ${j.stage.toUpperCase()}`,
        timestamp: new Date(j.entered_at),
        description: j.notes || `Contact advanced to the ${j.stage} stage of the customer lifecycle.`,
        meta: {
          stage: j.stage,
          exited_at: j.exited_at,
        }
      });
    });

    // Sort descending by timestamp
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [contact, messages, meetings, proposals, quotations, invoices, payments, tasks, campaigns, notes, utmLogs, journeys]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return timelineItems;
    return timelineItems.filter(item => {
      if (filter === 'messages') return item.type === 'message';
      if (filter === 'meetings') return item.type === 'meeting';
      if (filter === 'billing') return item.type === 'invoice' || item.type === 'payment';
      if (filter === 'tasks') return item.type === 'task';
      if (filter === 'ai') return item.type === 'proposal' || item.type === 'quote' || (item.type === 'message' && item.meta?.isInternal);
      return true;
    });
  }, [timelineItems, filter]);

  const getIcon = (type: TimelineItem['type'], meta?: any) => {
    switch (type) {
      case 'created':
        return <User className="size-4 text-emerald-450" />;
      case 'message':
        if (meta?.isInternal) {
          return <Sparkles className="size-4 text-amber-450" />;
        }
        return <MessageSquare className="size-4 text-sky-450" />;
      case 'meeting':
        return <Calendar className="size-4 text-indigo-450" />;
      case 'proposal':
        return <FileCheck className="size-4 text-purple-450" />;
      case 'quote':
        return <Signature className="size-4 text-fuchsia-450" />;
      case 'invoice':
        return <Receipt className="size-4 text-amber-500" />;
      case 'payment':
        return <CreditCard className="size-4 text-emerald-500" />;
      case 'task':
        return <CheckSquare className="size-4 text-rose-450" />;
      case 'campaign':
        return <Send className="size-4 text-teal-450" />;
      case 'note':
        return <FileText className="size-4 text-slate-400" />;
      default:
        return <Clock className="size-4 text-slate-400" />;
    }
  };

  const getBadgeColor = (type: TimelineItem['type'], meta?: any) => {
    switch (type) {
      case 'created':
        return 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20';
      case 'message':
        if (meta?.isInternal) {
          return 'bg-amber-500/10 text-amber-450 border-amber-500/20';
        }
        return 'bg-sky-500/10 text-sky-450 border-sky-500/20';
      case 'meeting':
        return 'bg-indigo-500/10 text-indigo-450 border-indigo-500/20';
      case 'proposal':
        return 'bg-purple-500/10 text-purple-450 border-purple-500/20';
      case 'quote':
        return 'bg-fuchsia-500/10 text-fuchsia-450 border-fuchsia-500/20';
      case 'invoice':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'payment':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'task':
        return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
      case 'campaign':
        return 'bg-teal-500/10 text-teal-450 border-teal-500/20';
      case 'note':
        return 'bg-slate-850 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Customer Decision Timeline Stepper */}
      <div className="bg-slate-900/35 border border-slate-850 p-5 rounded-2xl shadow-xl">
        <h3 className="text-xs font-bold text-slate-300 mb-4 tracking-wider uppercase">Customer Decision Timeline</h3>
        
        {/* Mobile stepper list */}
        <div className="block md:hidden space-y-2">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className={cn(
                  'size-5 rounded-full flex items-center justify-center border text-[9px] font-bold shrink-0',
                  isCompleted ? 'bg-indigo-950 border-indigo-500 text-indigo-400' :
                  isActive ? 'bg-primary/20 border-primary text-primary animate-pulse' :
                  'bg-slate-950 border-slate-800 text-slate-600'
                )}>
                  {isCompleted ? <Check className="size-2.5" /> : idx + 1}
                </div>
                <div className="flex flex-col">
                  <span className={cn('text-xs font-bold', isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500')}>{stage.label}</span>
                  <span className="text-[10px] text-slate-500 leading-none">{stage.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden md:block relative px-2">
          {/* Connector Line */}
          <div className="absolute top-3.5 left-6 right-6 h-[2px] bg-slate-850 z-0">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-primary transition-all duration-500" 
              style={{ width: `${(currentStageIndex / 7) * 100}%` }}
            />
          </div>

          <div className="relative z-10 flex justify-between">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              return (
                <div key={stage.label} className="flex flex-col items-center w-20 text-center group">
                  <div className={cn(
                    'size-8 rounded-full flex items-center justify-center border shadow-md transition-all duration-300',
                    isCompleted ? 'bg-indigo-950 border-indigo-500 text-indigo-400 hover:scale-105' :
                    isActive ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)] animate-pulse scale-110' :
                    'bg-slate-950 border-slate-850 text-slate-600'
                  )}>
                    {isCompleted ? <Check className="size-4" /> : <span className="text-[10px] font-bold font-mono">{idx + 1}</span>}
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold mt-2.5 transition-all leading-tight max-w-[80px]',
                    isActive ? 'text-primary' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  )}>
                    {stage.label}
                  </span>
                  <span className="text-[8px] text-slate-500 leading-none mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-4 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                    {stage.desc}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-2" /> {/* spacing spacer for hover label */}
        </div>
      </div>

      {/* Timeline Filter Controls */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-850 pb-4">
        <Filter className="size-3.5 text-slate-400 mr-2 shrink-0" />
        {([
          { key: 'all', label: 'All Activities' },
          { key: 'messages', label: 'Messages' },
          { key: 'meetings', label: 'Meetings' },
          { key: 'billing', label: 'Billing & Payments' },
          { key: 'tasks', label: 'Tasks' },
          { key: 'ai', label: 'AI & Internal' },
        ] as const).map(f => (
          <Button
            key={f.key}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f.key)}
            className={cn(
              'h-8 text-[11px] font-bold rounded-xl transition-all border border-transparent px-3',
              filter === f.key
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Timeline List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-xs">
          No activities found matching the selected filter.
        </div>
      ) : (
        <div className="relative border-l border-slate-850 ml-3 pl-6 space-y-5 py-2">
          {filteredItems.map(item => {
            const isExpanded = !!expandedItems[item.id];
            const hasDetails = item.type === 'proposal' || item.type === 'quote' || item.meta?.notes || item.meta?.summary || item.description.length > 150;
            return (
              <div key={item.id} className="relative animate-in fade-in-50 slide-in-from-left-2 duration-350">
                {/* Bullet Icon */}
                <div className={cn(
                  'absolute -left-[37px] top-1.5 size-7 rounded-full border flex items-center justify-center shadow-lg transition-all',
                  item.type === 'message' && item.meta?.isInternal ? 'bg-amber-950 border-amber-500/30' :
                  item.type === 'message' ? 'bg-sky-955 border-sky-500/30' :
                  item.type === 'meeting' ? 'bg-indigo-955 border-indigo-500/30' :
                  item.type === 'proposal' ? 'bg-purple-955 border-purple-500/30' :
                  item.type === 'quote' ? 'bg-fuchsia-955 border-fuchsia-500/30' :
                  item.type === 'invoice' ? 'bg-amber-955 border-amber-500/30' :
                  item.type === 'payment' ? 'bg-emerald-955 border-emerald-500/30' :
                  item.type === 'task' ? 'bg-rose-955 border-rose-500/30' :
                  item.type === 'campaign' ? 'bg-teal-955 border-teal-500/30' :
                  'bg-slate-950 border-slate-800'
                )}>
                  {getIcon(item.type, item.meta)}
                </div>

                {/* Body Card */}
                <div className="bg-slate-950/40 hover:bg-slate-900/20 transition-all p-4 rounded-xl border border-slate-850 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {item.title}
                      </span>
                      <Badge className={cn('text-[9px] uppercase px-1.5 py-0.5 border font-semibold tracking-wider', getBadgeColor(item.type, item.meta))}>
                        {item.type}
                      </Badge>
                      {item.meta?.sender && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <User className="size-2.5" />
                          {item.meta.sender}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {format(item.timestamp, 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>

                  <p className={cn(
                    'text-xs text-slate-300 leading-relaxed break-words',
                    !isExpanded && !hasDetails ? '' : !isExpanded ? 'line-clamp-2' : ''
                  )}>
                    {item.description}
                  </p>

                  {/* Render metadata stats */}
                  {item.meta?.stats && (
                    <div className="text-[10px] font-bold text-teal-400 bg-teal-950/20 px-2.5 py-1 rounded-lg border border-teal-500/10 inline-block">
                      {item.meta.stats}
                    </div>
                  )}

                  {/* Expanded Custom Detail Cards */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-850 text-xs text-slate-400 leading-relaxed space-y-3 animate-in fade-in-40 duration-250">
                      
                      {/* Meeting Notes and Summaries */}
                      {item.type === 'meeting' && (
                        <div className="space-y-2 bg-slate-900/30 border border-slate-850 p-3 rounded-lg">
                          {item.meta?.notes && (
                            <div>
                              <h4 className="font-bold text-slate-300 text-[10px] uppercase tracking-wider mb-0.5">Meeting Agenda/Notes:</h4>
                              <p className="text-[11px] text-slate-400">{item.meta.notes}</p>
                            </div>
                          )}
                          {item.meta?.summary && (
                            <div className="border-t border-slate-850/50 pt-2">
                              <h4 className="font-bold text-indigo-400 text-[10px] uppercase tracking-wider mb-0.5">AI Meeting Summary:</h4>
                              <p className="text-[11px] text-slate-300 whitespace-pre-wrap">{item.meta.summary}</p>
                            </div>
                          )}
                          {item.meta?.recordingLink && (
                            <div className="border-t border-slate-850/50 pt-2 text-[10px] font-semibold text-sky-400">
                              Recording: <a href={item.meta.recordingLink} target="_blank" rel="noreferrer" className="hover:underline">{item.meta.recordingLink}</a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* B2B Proposal Details */}
                      {item.type === 'proposal' && item.meta?.details && (
                        <div className="bg-slate-900/45 border border-slate-850 p-4 rounded-lg space-y-3 shadow-inner">
                          <div>
                            <h4 className="font-bold text-purple-400 text-[10px] uppercase tracking-wider">Problem Statement</h4>
                            <p className="text-[11px] text-slate-300 mt-0.5">{item.meta.details.problemStatement}</p>
                          </div>
                          <div>
                            <h4 className="font-bold text-purple-400 text-[10px] uppercase tracking-wider">Proposed Solution</h4>
                            <p className="text-[11px] text-slate-300 mt-0.5">{item.meta.details.solution}</p>
                          </div>
                          {item.meta.details.deliverables && (
                            <div>
                              <h4 className="font-bold text-purple-400 text-[10px] uppercase tracking-wider">Core Deliverables</h4>
                              <ul className="list-disc list-inside text-[11px] text-slate-300 mt-1 space-y-0.5">
                                {item.meta.details.deliverables.map((d: string, i: number) => (
                                  <li key={i}>{d}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-2.5">
                            <div>
                              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Timeline</h4>
                              <p className="text-[11px] text-slate-300 mt-0.5">{item.meta.details.timeline}</p>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Pricing Budget</h4>
                              <p className="text-[11px] text-emerald-450 font-bold mt-0.5">{item.meta.details.pricing}</p>
                            </div>
                          </div>
                          {item.meta.clientSignature && (
                            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Signed digitally: <span className="font-mono text-slate-400 font-bold">{item.meta.clientSignature}</span></span>
                              <span>Signed at: {item.meta.signedAt ? format(new Date(item.meta.signedAt), 'MMM dd, yyyy') : 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Commercial Quotation Details */}
                      {item.type === 'quote' && item.meta?.items && (
                        <div className="bg-slate-900/45 border border-slate-850 p-4 rounded-lg space-y-3 shadow-inner">
                          <h4 className="font-bold text-fuchsia-400 text-[10px] uppercase tracking-wider">Itemized Commercial Breakdown</h4>
                          <div className="border border-slate-800 rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                                  <th className="p-2">Description</th>
                                  <th className="p-2 text-center">Qty</th>
                                  <th className="p-2 text-right">Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 text-slate-300">
                                {Array.isArray(item.meta.items) && item.meta.items.map((it: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-850/20">
                                    <td className="p-2 font-medium">{it.description}</td>
                                    <td className="p-2 text-center">{it.quantity}</td>
                                    <td className="p-2 text-right">INR {Number(it.price).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {item.meta.clientSignature && (
                            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Signed digitally: <span className="font-mono text-slate-400 font-bold">{item.meta.clientSignature}</span></span>
                              <span>Signed at: {item.meta.signedAt ? format(new Date(item.meta.signedAt), 'MMM dd, yyyy') : 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {/* Toggle Expand Button */}
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-bold transition-all focus:outline-none pt-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3" />
                          Collapse Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3" />
                          Expand Details
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

