'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
  User,
  Globe,
  Languages,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ContactTimeline } from '@/components/contacts/contact-timeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MeetingScheduler } from '@/components/contacts/meeting-scheduler';
import { FollowUpEngine } from '@/components/contacts/follow-up-engine';
import { SalesCoachPanel } from '@/components/inbox/sales-coach-panel';
import { FileCheck, Signature, Send, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContactProfilePage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const supabase = createClient();

  // Primary States
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  
  // AI MongoDB Intelligence States
  const [aiIntelligence, setAiIntelligence] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);

  // Proposal & Quotation Generator States
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isGeneratingQuotation, setIsGeneratingQuotation] = useState(false);
  const [proposalInstructions, setProposalInstructions] = useState('');
  const [quotationInstructions, setQuotationInstructions] = useState('');
  
  // Editable Draft States
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  
  const [proposalDraftDetails, setProposalDraftDetails] = useState<any>(null);
  const [quotationDraftDetails, setQuotationDraftDetails] = useState<any>(null);
  
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);

  // Controlled tab state
  const [activeTab, setActiveTab] = useState('timeline');

  // Modal / Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    industry: '',
    timezone: '',
    preferred_language: '',
    lead_source: '',
    business_type: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    amount: '',
    due_date: '',
    services: '',
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Load All PostgreSQL CRM data
  const loadCrmData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Contact Details
      const { data: contactData, error: contactErr } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactErr || !contactData) {
        toast.error('Failed to find contact profile');
        router.push('/contacts');
        return;
      }
      setContact(contactData);
      setEditForm({
        name: contactData.name || '',
        email: contactData.email || '',
        phone: contactData.phone || '',
        company: contactData.company || '',
        website: contactData.website || '',
        industry: contactData.industry || '',
        timezone: contactData.timezone || '',
        preferred_language: contactData.preferred_language || '',
        lead_source: contactData.lead_source || '',
        business_type: contactData.business_type || '',
        address: contactData.address || '',
        city: contactData.city || '',
        state: contactData.state || '',
        country: contactData.country || '',
      });

      // 2. Query relative tables in parallel
      const [dealsRes, invoicesRes, paymentsRes, tasksRes, meetingsRes, notesRes, conversationRes, proposalsRes, quotationsRes] = await Promise.all([
        supabase.from('deals').select('*, stage:pipeline_stages(*)').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('meeting_bookings').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('contact_notes').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('conversations').select('id').eq('contact_id', contactId).maybeSingle(),
        supabase.from('proposal_requests').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('quotation_requests').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      ]);

      if (dealsRes.data) setDeals(dealsRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (meetingsRes.data) setMeetings(meetingsRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (proposalsRes.data) setProposals(proposalsRes.data);
      if (quotationsRes.data) setQuotations(quotationsRes.data);

      // 3. Fetch conversation messages if conversation exists
      if (conversationRes.data?.id) {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationRes.data.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (messagesData) setMessages(messagesData);
      }
    } catch (err) {
      console.error('Error fetching CRM profile:', err);
      toast.error('Network error loading profile');
    } finally {
      setLoading(false);
    }
  }, [contactId, supabase, router]);

  // Fetch MongoDB AI intelligence
  const loadAiIntelligence = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/intelligence`);
      if (res.ok) {
        const data = await res.json();
        setAiIntelligence(data);
      } else {
        console.error('Failed to fetch contact intelligence');
      }
    } catch (err) {
      console.error('Error fetching intelligence:', err);
    } finally {
      setAiLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadCrmData();
    loadAiIntelligence();
  }, [loadCrmData, loadAiIntelligence]);

  // Handle Note Submit
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || submittingNote) return;

    setSubmittingNote(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error('Not authenticated');
      setSubmittingNote(false);
      return;
    }

    const { data, error } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: contactId,
        user_id: session.user.id,
        note_text: newNote.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add note');
    } else {
      setNewNote('');
      setNotes(prev => [data, ...prev]);
      toast.success('Internal note added');
      loadAiIntelligence(); // reload intelligence to update summaries
    }
    setSubmittingNote(false);
  };

  // Handle Task Submit
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || submittingTask) return;

    setSubmittingTask(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error('Not authenticated');
      setSubmittingTask(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        contact_id: contactId,
        user_id: session.user.id,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
        status: 'pending',
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
    } else {
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      setTasks(prev => [data, ...prev]);
      toast.success('Task created successfully');
    }
    setSubmittingTask(false);
  };

  // Toggle Task Completion Status
  const toggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to update task status');
    } else {
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      toast.success(`Task marked as ${nextStatus}`);
    }
  };

  // Handle Invoice Submit
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.invoice_number.trim() || !newInvoice.amount || submittingInvoice) return;

    setSubmittingInvoice(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error('Not authenticated');
      setSubmittingInvoice(false);
      return;
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        contact_id: contactId,
        user_id: session.user.id,
        invoice_number: newInvoice.invoice_number.trim(),
        amount: parseFloat(newInvoice.amount),
        status: 'sent',
        due_date: newInvoice.due_date ? new Date(newInvoice.due_date).toISOString() : null,
        services: newInvoice.services ? newInvoice.services.split(',').map(s => s.trim()) : [],
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to generate invoice');
    } else {
      setNewInvoice({ invoice_number: '', amount: '', due_date: '', services: '' });
      setInvoices(prev => [data, ...prev]);
      toast.success('Invoice generated successfully');
    }
    setSubmittingInvoice(false);
  };

  // AI Proposal & Quotation Handlers
  const handleGenerateProposal = async () => {
    setIsGeneratingProposal(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customInstructions: proposalInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate proposal');
      
      toast.success('AI Proposal drafted successfully!');
      setProposalInstructions('');
      
      // Load draft into editing modal
      setEditingProposalId(data.proposal.id);
      setProposalDraftDetails(data.proposal.details);
      
      loadCrmData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate proposal');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleGenerateQuotation = async () => {
    setIsGeneratingQuotation(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customInstructions: quotationInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate quotation');
      
      toast.success('AI Quotation compiled using RAG catalog rates!');
      setQuotationInstructions('');
      
      // Load draft into editing modal
      setEditingQuotationId(data.quotation.id);
      setQuotationDraftDetails(data.fullDraft);
      
      loadCrmData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate quotation');
    } finally {
      setIsGeneratingQuotation(false);
    }
  };

  const handleSaveProposalEdit = async () => {
    if (!editingProposalId || !proposalDraftDetails) return;
    setIsSavingProposal(true);
    try {
      const { error } = await supabase
        .from('proposal_requests')
        .update({
          details: proposalDraftDetails,
          status: 'generated',
        })
        .eq('id', editingProposalId);
        
      if (error) throw error;
      toast.success('Proposal updated and saved.');
      setEditingProposalId(null);
      setProposalDraftDetails(null);
      loadCrmData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save proposal');
    } finally {
      setIsSavingProposal(false);
    }
  };

  const handleSaveQuotationEdit = async () => {
    if (!editingQuotationId || !quotationDraftDetails) return;
    setIsSavingQuotation(true);
    try {
      const { error } = await supabase
        .from('quotation_requests')
        .update({
          items: quotationDraftDetails.items,
          total_amount: quotationDraftDetails.totalAmount,
          status: 'generated',
        })
        .eq('id', editingQuotationId);
        
      if (error) throw error;
      toast.success('Quotation updated and saved.');
      setEditingQuotationId(null);
      setQuotationDraftDetails(null);
      loadCrmData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save quotation');
    } finally {
      setIsSavingQuotation(false);
    }
  };

  const handleSimulateSignature = async (type: 'proposal' | 'quotation', id: string) => {
    const signerName = contact?.name || 'Client';
    const tableName = type === 'proposal' ? 'proposal_requests' : 'quotation_requests';
    
    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          status: type === 'proposal' ? 'signed' : 'paid',
          client_signature: `SIGNED_BY_${signerName.toUpperCase().replace(/\s+/g, '_')}`,
          signed_at: new Date().toISOString(),
          ...(type === 'quotation' ? { paid_at: new Date().toISOString() } : {}),
        })
        .eq('id', id);
        
      if (error) throw error;
      toast.success(`Client digitally signed the ${type}!`);
      
      // Automatically generate invoice and log payment in Supabase if quotation is signed/paid
      if (type === 'quotation') {
        const quote = quotations.find(q => q.id === id);
        if (quote) {
          const invNum = `INV-${Date.now().toString().slice(-6)}`;
          const { data: invoiceData } = await supabase
            .from('invoices')
            .insert({
              contact_id: contactId,
              user_id: contact.user_id,
              invoice_number: invNum,
              amount: quote.total_amount,
              status: 'paid',
              due_date: new Date().toISOString(),
              paid_date: new Date().toISOString(),
              services: [quote.service_required],
              quotation_id: quote.id,
            })
            .select()
            .single();

          await supabase
            .from('payments')
            .insert({
              contact_id: contactId,
              user_id: contact.user_id,
              amount: quote.total_amount,
              payment_method: 'Stripe Integration',
              status: 'completed',
              payment_date: new Date().toISOString(),
              transaction_id: `TXN-${Date.now().toString().slice(-8)}`,
              invoice_id: invoiceData?.id || null,
              quotation_id: quote.id,
            });
            
          toast.success('Sales Automation: Invoice generated and payment logged automatically!');
        }
      }
      
      loadCrmData();
    } catch (err: any) {
      toast.error(err.message || 'Signature simulation failed');
    }
  };

  const handleShareWhatsApp = (type: 'proposal' | 'quotation', item: any) => {
    const formattedPhone = contact.phone?.replace(/[^0-9]/g, '') || '';
    const shareText = `Hi ${contact.name || 'there'},\n\nWe have prepared the official ${type} for your project: "${item.service_required}".\n\nYou can review, customize, and sign it digitally here.\n\nThank you,\nMaaJanki Web Tech`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  // Save Contact General Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('contacts')
      .update({
        name: editForm.name.trim() || null,
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim(),
        company: editForm.company.trim() || null,
        website: editForm.website.trim() || null,
        industry: editForm.industry.trim() || null,
        timezone: editForm.timezone.trim() || null,
        preferred_language: editForm.preferred_language.trim() || null,
        lead_source: editForm.lead_source.trim() || null,
        business_type: editForm.business_type.trim() || null,
        address: editForm.address.trim() || null,
        city: editForm.city.trim() || null,
        state: editForm.state.trim() || null,
        country: editForm.country.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    if (error) {
      toast.error('Failed to update profile details');
    } else {
      toast.success('Contact profile details updated');
      setIsEditing(false);
      loadCrmData();
      loadAiIntelligence();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="size-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-slate-400">Loading Enterprise Customer Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-950 min-h-screen text-slate-200 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/contacts">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-900 border border-slate-800">
              <ArrowLeft className="size-4 text-slate-400 hover:text-white" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {contact?.name || 'Unknown Profile'}
              </h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 font-bold uppercase">
                {contact?.status || 'New'}
              </Badge>
              {contact?.preferred_language && (
                <Badge variant="outline" className="text-slate-400 border-slate-800 text-[10px] flex items-center gap-1">
                  <Languages className="size-2.5" />
                  {contact.preferred_language}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-550 font-mono mt-1">ID: {contact?.id}</p>
          </div>
        </div>
        
        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
            className="text-xs font-bold border-slate-800 bg-slate-900 hover:bg-slate-850 h-9 rounded-lg flex items-center gap-1.5"
          >
            <Edit className="size-3.5 text-primary" />
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
          <Button
            onClick={() => {
              // Redirect to inbox and search or open conversation
              router.push(`/inbox?contact=${contact.id}`);
            }}
            className="text-xs font-bold bg-primary hover:bg-primary/90 text-slate-950 h-9 rounded-lg flex items-center gap-1.5"
          >
            <MessageSquare className="size-3.5 text-slate-950" />
            Open In Inbox
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Metadata Card & CRM Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Info Card */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-850 p-5 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-xl" />
            
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-800/60 pb-2">
              Customer Details
            </h3>

            {isEditing ? (
              <form onSubmit={handleSaveDetails} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-450 font-semibold uppercase text-[9px]">Full Name</label>
                  <Input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-semibold uppercase text-[9px]">Email Address</label>
                  <Input
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-semibold uppercase text-[9px]">Phone Number</label>
                  <Input
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold uppercase text-[9px]">Company</label>
                    <Input
                      value={editForm.company}
                      onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold uppercase text-[9px]">Industry</label>
                    <Input
                      value={editForm.industry}
                      onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold uppercase text-[9px]">Website</label>
                    <Input
                      value={editForm.website}
                      onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold uppercase text-[9px]">Timezone</label>
                    <Input
                      value={editForm.timezone}
                      onChange={e => setEditForm({ ...editForm, timezone: e.target.value })}
                      placeholder="Asia/Kolkata"
                      className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold uppercase text-[9px]">Lead Source</label>
                    <Input
                      value={editForm.lead_source}
                      onChange={e => setEditForm({ ...editForm, lead_source: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-450 font-semibold uppercase text-[9px]">Business Type</label>
                    <Input
                      value={editForm.business_type}
                      onChange={e => setEditForm({ ...editForm, business_type: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-semibold uppercase text-[9px]">Address</label>
                  <Input
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Input
                    value={editForm.city}
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="City"
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                  />
                  <Input
                    value={editForm.state}
                    onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="State"
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                  />
                  <Input
                    value={editForm.country}
                    onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                    placeholder="Country"
                    className="bg-slate-950 border-slate-800 h-8 text-xs text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-slate-950 text-xs h-8 font-extrabold mt-3">
                  Save Modifications
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                {/* General Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Phone Number</p>
                    <p className="font-semibold font-mono text-white flex items-center gap-1">
                      <Phone className="size-3 text-slate-400" />
                      {contact?.phone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Email Address</p>
                    <p className="font-semibold text-white truncate flex items-center gap-1">
                      <Mail className="size-3 text-slate-400" />
                      {contact?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Company</p>
                    <p className="font-semibold text-white flex items-center gap-1">
                      <Building2 className="size-3 text-slate-400" />
                      {contact?.company || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Industry</p>
                    <p className="font-semibold text-white flex items-center gap-1">
                      <Globe className="size-3 text-slate-400" />
                      {contact?.industry || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Timezone</p>
                    <p className="font-semibold text-white flex items-center gap-1">
                      <Clock className="size-3 text-slate-400" />
                      {contact?.timezone || 'Asia/Kolkata'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Lead Source</p>
                    <p className="font-semibold text-white">
                      {contact?.lead_source || 'WhatsApp Direct'}
                    </p>
                  </div>
                </div>

                {contact?.address && (
                  <div className="border-t border-slate-850 pt-3 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold">Office Location</p>
                    <p className="font-semibold text-white flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                      {contact.address}
                      {contact.city && `, ${contact.city}`}
                      {contact.state && `, ${contact.state}`}
                      {contact.country && `, ${contact.country}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Memory & Facts Panel */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-850 p-5 space-y-4 shadow-lg">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-450" />
              AI Customer Memory
            </h3>
            
            {aiLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-amber-500" />
              </div>
            ) : aiIntelligence?.memory?.facts && Object.keys(aiIntelligence.memory.facts).length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 italic">
                  Extracted customer insights saved in MongoDB long-term memory:
                </p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {Object.entries(aiIntelligence.memory.facts).map(([key, val]: any) => (
                    <div key={key} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 text-xs">
                      <p className="font-bold text-primary capitalize text-[10px]">{key.replace(/_/g, ' ')}</p>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-4 space-y-2">
                <AlertCircle className="size-5 text-slate-600 mx-auto" />
                <p>No active memory facts yet. The AI automatically extracts facts as you chat with this customer.</p>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Tabbed Workspace */}
        <div className="lg:col-span-5 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-slate-900/70 border border-slate-850 p-1 rounded-xl h-11">
              <TabsTrigger value="timeline" className="rounded-lg text-xs font-bold transition-all data-active:bg-slate-800 data-active:text-primary">
                Activity Timeline
              </TabsTrigger>
              <TabsTrigger value="billing" className="rounded-lg text-xs font-bold transition-all data-active:bg-slate-800 data-active:text-primary">
                Billing & Deals
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg text-xs font-bold transition-all data-active:bg-slate-800 data-active:text-primary">
                Tasks & Calls
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: Unified Activity Timeline */}
            <TabsContent value="timeline" className="mt-4 bg-slate-900/20 border border-slate-850 rounded-2xl p-5 shadow-lg min-h-[60vh]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Customer Timeline
                  </h3>
                  <Badge variant="outline" className="border-slate-850 text-[9px] font-mono text-slate-500 px-2 py-0.5">
                    {messages.length + notes.length + tasks.length + invoices.length + meetings.length} Events
                  </Badge>
                </div>
                
                <ContactTimeline
                  contact={contact}
                  messages={messages}
                  meetings={meetings}
                  proposals={proposals}
                  quotations={quotations}
                  invoices={invoices}
                  payments={payments}
                  tasks={tasks}
                  notes={notes}
                  campaigns={campaigns}
                />
              </div>
            </TabsContent>

            {/* TAB CONTENT: Billing, Invoices & Deals */}
            <TabsContent value="billing" className="mt-4 space-y-6">
              {/* Deals Subpanel */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="size-4 text-emerald-450" />
                    Active Deals ({deals.length})
                  </h3>
                </div>
                
                {deals.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">No active deals found for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {deals.map(d => (
                      <div key={d.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white text-xs">{d.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Stage: {d.stage?.name || 'Active'} | Probability: {d.probability || 50}%</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-400 text-xs">${d.value.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-600 font-mono mt-0.5">Closing: {d.closing_date ? new Date(d.closing_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Proposals & Commercial Quotations Module */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="size-4 text-purple-450" />
                    AI Proposals & Quotations ({proposals.length + quotations.length})
                  </h3>
                </div>

                {/* AI Document Generation Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Proposal Generator Form */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="size-3 text-amber-450" />
                        Draft B2B Agency Proposal
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">NVIDIA AI will write a comprehensive, professional agency proposal.</p>
                      <textarea
                        placeholder="Custom instructions (e.g., Focus on Next.js, list Shopify details)..."
                        value={proposalInstructions}
                        onChange={e => setProposalInstructions(e.target.value)}
                        rows={2}
                        className="w-full mt-2.5 bg-slate-905 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none outline-none focus:border-primary/40"
                      />
                    </div>
                    <Button
                      onClick={handleGenerateProposal}
                      disabled={isGeneratingProposal}
                      className="w-full bg-purple-650 hover:bg-purple-600 text-white text-xs h-8 font-bold mt-2 rounded-lg"
                    >
                      {isGeneratingProposal ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-1" />
                          AI Writing Proposal...
                        </>
                      ) : 'Draft AI Proposal'}
                    </Button>
                  </div>

                  {/* Quotation Generator Form */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-fuchsia-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Signature className="size-3 text-amber-450" />
                        Compile Commercial Quotation
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Bound strictly to company catalog rates. Never invents pricing.</p>
                      <textarea
                        placeholder="Quotation instructions (e.g., Include dynamic plan, apply ₹5,000 discount)..."
                        value={quotationInstructions}
                        onChange={e => setQuotationInstructions(e.target.value)}
                        rows={2}
                        className="w-full mt-2.5 bg-slate-905 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none outline-none focus:border-primary/40"
                      />
                    </div>
                    <Button
                      onClick={handleGenerateQuotation}
                      disabled={isGeneratingQuotation}
                      className="w-full bg-fuchsia-650 hover:bg-fuchsia-600 text-white text-xs h-8 font-bold mt-2 rounded-lg"
                    >
                      {isGeneratingQuotation ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-1" />
                          AI Compiling Quote...
                        </>
                      ) : 'Compile AI Quotation'}
                    </Button>
                  </div>
                </div>

                {/* Document List */}
                {proposals.length === 0 && quotations.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-2 italic">No commercial documents drafted yet.</p>
                ) : (
                  <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                    {/* Render Proposals */}
                    {proposals.map(p => (
                      <div key={p.id} className="bg-slate-955 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileCheck className="size-3.5 text-purple-400 shrink-0" />
                            <p className="font-bold text-white text-xs">B2B Proposal: {p.service_required}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-purple-500/10 text-purple-450 border-purple-500/20 text-[8px] h-4 font-bold uppercase">
                              Proposal
                            </Badge>
                            <Badge className={cn(
                              'text-[8px] h-4 font-bold border uppercase',
                              p.status === 'signed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                              'bg-slate-800 text-slate-450 border-slate-700'
                            )}>
                              {p.status}
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-mono">Date: {new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.status !== 'signed' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingProposalId(p.id);
                                  setProposalDraftDetails(p.details);
                                }}
                                className="h-7 text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSimulateSignature('proposal', p.id)}
                                className="h-7 text-[10px] font-bold bg-purple-950/40 border border-purple-500/20 text-purple-400 hover:bg-purple-900/10"
                              >
                                Sign
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleShareWhatsApp('proposal', p)}
                            className="h-7 text-[10px] font-bold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/10"
                          >
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Render Quotations */}
                    {quotations.map(q => (
                      <div key={q.id} className="bg-slate-955 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Signature className="size-3.5 text-fuchsia-400 shrink-0" />
                            <p className="font-bold text-white text-xs">Quotation: {q.service_required}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-fuchsia-500/10 text-fuchsia-450 border-fuchsia-500/20 text-[8px] h-4 font-bold uppercase">
                              Quotation
                            </Badge>
                            <Badge className={cn(
                              'text-[8px] h-4 font-bold border uppercase',
                              q.status === 'paid' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/25' :
                              'bg-slate-800 text-slate-450 border-slate-700'
                            )}>
                              {q.status}
                            </Badge>
                            <span className="text-[10px] text-emerald-450 font-bold">INR {Number(q.total_amount).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Date: {new Date(q.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {q.status !== 'paid' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingQuotationId(q.id);
                                  setQuotationDraftDetails({
                                    items: q.items,
                                    totalAmount: q.total_amount,
                                    subtotal: q.total_amount / 1.18,
                                    taxAmount: q.total_amount - (q.total_amount / 1.18),
                                    discount: 0,
                                  });
                                }}
                                className="h-7 text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSimulateSignature('quotation', q.id)}
                                className="h-7 text-[10px] font-bold bg-fuchsia-950/40 border border-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-900/10"
                              >
                                Sign & Pay
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleShareWhatsApp('quotation', q)}
                            className="h-7 text-[10px] font-bold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/10"
                          >
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices Subpanel */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="size-4 text-amber-500" />
                    Invoices & Invoicing ({invoices.length})
                  </h3>
                </div>

                {/* Log New Invoice Form */}
                <form onSubmit={handleAddInvoice} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-3">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Generate New Invoice</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Inv No. (e.g. INV-2026-01)"
                      value={newInvoice.invoice_number}
                      onChange={e => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                      className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Amount ($)"
                      value={newInvoice.amount}
                      onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={newInvoice.due_date}
                      onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                      className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                    />
                    <Input
                      placeholder="Services (comma separated)"
                      value={newInvoice.services}
                      onChange={e => setNewInvoice({ ...newInvoice, services: e.target.value })}
                      className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                  <Button type="submit" disabled={submittingInvoice} className="w-full bg-slate-905 hover:bg-slate-800 border border-slate-800 text-white text-xs h-8 font-semibold">
                    {submittingInvoice ? 'Generating...' : 'Issue Invoice & Notify via WhatsApp'}
                  </Button>
                </form>

                {invoices.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">No billing invoices raised yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {invoices.map(inv => (
                      <div key={inv.id} className="bg-slate-955 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-white text-xs">Invoice #{inv.invoice_number}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className={
                              inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20 text-[9px] h-4 font-semibold uppercase' :
                              inv.status === 'overdue' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20 text-[9px] h-4 font-semibold uppercase' :
                              'bg-slate-800 text-slate-400 border-slate-700 text-[9px] h-4 font-semibold uppercase'
                            }>
                              {inv.status}
                            </Badge>
                            {inv.due_date && (
                              <span className="text-[10px] text-slate-500 font-mono">Due: {new Date(inv.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <p className="font-extrabold text-slate-200">${inv.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB CONTENT: Tasks & Meetings */}
            <TabsContent value="tasks" className="mt-4 space-y-6">
              {/* Task Planner Card */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
                  <CheckSquare className="size-4 text-rose-450" />
                  Task Planner & Checklists
                </h3>

                {/* Create Task Form */}
                <form onSubmit={handleAddTask} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-3">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Add New CRM Action Task</p>
                  <Input
                    placeholder="Task Title (e.g. Schedule Follow-up Call)"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                    required
                  />
                  <Input
                    placeholder="Short Description..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      className="bg-slate-900 border border-slate-800 px-3 h-8 text-xs text-slate-300 rounded-lg outline-none focus:border-primary/50"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                      className="bg-slate-900 border-slate-800 h-8 text-xs text-white"
                    />
                  </div>
                  <Button type="submit" disabled={submittingTask} className="w-full bg-primary hover:bg-primary/90 text-slate-950 text-xs h-8 font-extrabold">
                    {submittingTask ? 'Creating...' : 'Create Action Task'}
                  </Button>
                </form>

                {/* Tasks List */}
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">No tasks pending for this customer.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {tasks.map(t => (
                      <div key={t.id} className="bg-slate-955 border border-slate-850 p-3 rounded-xl flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(t)}
                            className="text-slate-550 hover:text-primary transition-all pt-0.5 focus:outline-none cursor-pointer"
                          >
                            <CheckCircle2 className={`size-4.5 ${t.status === 'completed' ? 'text-primary' : 'text-slate-750'}`} />
                          </button>
                          <div>
                            <p className={`font-bold ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                              {t.title}
                            </p>
                            {t.description && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{t.description}</p>
                            )}
                            {t.due_date && (
                              <p className="text-[9px] text-slate-650 font-mono mt-1">Due: {new Date(t.due_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          t.priority === 'high' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20 text-[9px] font-semibold h-4 uppercase' :
                          t.priority === 'medium' ? 'bg-amber-500/10 text-amber-450 border-amber-500/20 text-[9px] font-semibold h-4 uppercase' :
                          'bg-slate-800 text-slate-400 border-slate-700 text-[9px] font-semibold h-4 uppercase'
                        }>
                          {t.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Consultations & Meeting Scheduler */}
              <MeetingScheduler
                contactId={contactId}
                meetings={meetings}
                onRefresh={loadCrmData}
              />
            </TabsContent>
          </Tabs>

          {/* Quick Notes Form */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-4 text-slate-400" />
              Write Internal Staff Note
            </h3>
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Log customer request, project update, or sales notes..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-primary/50 resize-none leading-relaxed"
                required
              />
              <Button type="submit" disabled={submittingNote} className="w-full bg-slate-800 hover:bg-slate-750 text-white text-xs h-8 font-semibold">
                {submittingNote ? 'Saving Note...' : 'Save Private Note'}
              </Button>
            </form>
          </div>

          {/* AI Follow-up Warning Engine */}
          <FollowUpEngine
            contact={contact}
            proposals={proposals}
            quotations={quotations}
            invoices={invoices}
            payments={payments}
            meetings={meetings}
            deals={deals}
          />
        </div>

        {/* RIGHT COLUMN: AI Scoring, Sentiment, Intent & Predictions */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/45 border border-slate-850 rounded-2xl p-5 space-y-5 shadow-lg relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="size-5 text-indigo-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  NVIDIA AI Insights
                </h3>
                <p className="text-[9px] text-slate-500">Real-time Lead Scoring & Recommendations</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-[11px] text-slate-500">Analyzing client communications...</p>
              </div>
            ) : aiIntelligence?.intelligence ? (
              <div className="space-y-5">
                {/* Scoring Meters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-955 border border-slate-850 p-3.5 rounded-2xl text-center">
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase">Lead Score</p>
                    <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">
                      {aiIntelligence.intelligence.leadScore}
                      <span className="text-slate-600 text-xs">/100</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 mt-2 overflow-hidden">
                      <div 
                        className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${aiIntelligence.intelligence.leadScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-955 border border-slate-850 p-3.5 rounded-2xl text-center">
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase">Win Probability</p>
                    <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                      {aiIntelligence.intelligence.conversionProbability}%
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 mt-2 overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${aiIntelligence.intelligence.conversionProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Intent & Sentiment */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-2.5 text-xs">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-extrabold">Buying Intent</p>
                    <p className="font-semibold text-slate-200 mt-0.5 leading-relaxed">{aiIntelligence.intelligence.intent}</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-850 pt-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-extrabold">Sentiment Status</span>
                    <Badge className={
                      aiIntelligence.intelligence.sentiment === 'Positive' ? 'bg-emerald-550/10 text-emerald-450 border-emerald-500/20 text-[9px] font-bold' :
                      aiIntelligence.intelligence.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20 text-[9px] font-bold' :
                      'bg-slate-800 text-slate-400 border-slate-750 text-[9px] font-bold'
                    }>
                      {aiIntelligence.intelligence.sentiment}
                    </Badge>
                  </div>
                </div>

                {/* Buying Signals */}
                {aiIntelligence.intelligence.buyingSignals?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Key Buying Signals</p>
                    <div className="space-y-1.5">
                      {aiIntelligence.intelligence.buyingSignals.map((sig: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <p>{sig}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {aiIntelligence.intelligence.recommendations?.length > 0 && (
                  <div className="space-y-2 border-t border-slate-850 pt-3.5">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Next Best Recommendations</p>
                    <div className="space-y-2">
                      {aiIntelligence.intelligence.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs flex gap-2 items-start">
                          <Sparkles className="size-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <p className="text-slate-300 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Intelligence */}
                {aiIntelligence.intelligence.customerIntelligence && (
                  <div className="space-y-2 border-t border-slate-850 pt-3.5 text-xs">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Customer Intelligence</p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2.5">
                      {aiIntelligence.intelligence.customerIntelligence.painPoints?.length > 0 && (
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Pain Points</span>
                          <span className="text-slate-300 mt-0.5 block">{aiIntelligence.intelligence.customerIntelligence.painPoints.join(', ')}</span>
                        </div>
                      )}
                      {aiIntelligence.intelligence.customerIntelligence.interestedServices?.length > 0 && (
                        <div className="border-t border-slate-850 pt-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Interested Services</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {aiIntelligence.intelligence.customerIntelligence.interestedServices.map((srv: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 text-[9px] px-1.5">
                                {srv}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiIntelligence.intelligence.customerIntelligence.estimatedBudget && (
                        <div className="border-t border-slate-850 pt-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Estimated Budget</span>
                          <span className="text-emerald-400 font-bold mt-0.5 block">{aiIntelligence.intelligence.customerIntelligence.estimatedBudget}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-550 text-xs">
                No active sales intelligence. Start chatting or log notes to kick off AI intelligence scoring.
              </div>
            )}
          </div>

          {/* AI Sales Coach Co-pilot panel */}
          <SalesCoachPanel
            contactId={contactId}
            onActionTrigger={(actionType) => {
              if (actionType === 'proposal') {
                setActiveTab?.('billing');
                toast.info('AI Sales Coach: Use the Proposals & Quotations subpanel below to draft a proposal!');
              } else if (actionType === 'quotation') {
                setActiveTab?.('billing');
                toast.info('AI Sales Coach: Use the Proposals & Quotations subpanel below to compile a quotation!');
              }
            }}
          />
        </div>
      </div>

      {/* AI Proposal Customizer Modal Drawer */}
      {editingProposalId && proposalDraftDetails && (
        <div className="fixed inset-0 bg-slate-955/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Review & Customize B2B Proposal</h3>
              </div>
              <button onClick={() => setEditingProposalId(null)} className="text-slate-500 hover:text-white font-bold">✕</button>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Company Introduction</label>
                <textarea
                  value={proposalDraftDetails.companyIntroduction || ''}
                  onChange={e => setProposalDraftDetails({ ...proposalDraftDetails, companyIntroduction: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Problem Statement</label>
                <textarea
                  value={proposalDraftDetails.problemStatement || ''}
                  onChange={e => setProposalDraftDetails({ ...proposalDraftDetails, problemStatement: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Proposed Solution</label>
                <textarea
                  value={proposalDraftDetails.solution || ''}
                  onChange={e => setProposalDraftDetails({ ...proposalDraftDetails, solution: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none outline-none focus:border-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Pricing / Budget</label>
                  <input
                    type="text"
                    value={proposalDraftDetails.pricing || ''}
                    onChange={e => setProposalDraftDetails({ ...proposalDraftDetails, pricing: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg h-9 px-2.5 text-xs text-white outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Project Timeline</label>
                  <input
                    type="text"
                    value={proposalDraftDetails.timeline || ''}
                    onChange={e => setProposalDraftDetails({ ...proposalDraftDetails, timeline: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg h-9 px-2.5 text-xs text-white outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/40">
              <Button onClick={() => setEditingProposalId(null)} variant="ghost" className="text-xs text-slate-400 h-8">Cancel</Button>
              <Button onClick={handleSaveProposalEdit} disabled={isSavingProposal} className="bg-primary hover:bg-primary/90 text-slate-955 text-xs font-bold h-8 px-4 rounded-lg">
                {isSavingProposal ? 'Saving...' : 'Save & Issue Proposal'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Quotation Customizer Modal Drawer */}
      {editingQuotationId && quotationDraftDetails && (
        <div className="fixed inset-0 bg-slate-955/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Signature className="size-4 text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Review & Edit Commercial Quotation</h3>
              </div>
              <button onClick={() => setEditingQuotationId(null)} className="text-slate-500 hover:text-white font-bold">✕</button>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Line Items (RAG Catalog rates applied)</label>
                <div className="space-y-2">
                  {quotationDraftDetails.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-955/45 p-2.5 rounded-lg border border-slate-800">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => {
                          const newItems = [...quotationDraftDetails.items];
                          newItems[idx].description = e.target.value;
                          setQuotationDraftDetails({ ...quotationDraftDetails, items: newItems });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 h-7 text-xs text-white"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...quotationDraftDetails.items];
                          newItems[idx].quantity = Number(e.target.value);
                          const subtotal = newItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
                          const taxAmount = (subtotal - (quotationDraftDetails.discount || 0)) * 0.18;
                          setQuotationDraftDetails({
                            ...quotationDraftDetails,
                            items: newItems,
                            subtotal,
                            taxAmount,
                            totalAmount: subtotal - (quotationDraftDetails.discount || 0) + taxAmount
                          });
                        }}
                        className="w-12 bg-slate-900 border border-slate-800 rounded px-2 h-7 text-center text-xs text-white"
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => {
                          const newItems = [...quotationDraftDetails.items];
                          newItems[idx].price = Number(e.target.value);
                          const subtotal = newItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
                          const taxAmount = (subtotal - (quotationDraftDetails.discount || 0)) * 0.18;
                          setQuotationDraftDetails({
                            ...quotationDraftDetails,
                            items: newItems,
                            subtotal,
                            taxAmount,
                            totalAmount: subtotal - (quotationDraftDetails.discount || 0) + taxAmount
                          });
                        }}
                        className="w-24 bg-slate-900 border border-slate-800 rounded px-2 h-7 text-right text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Package Discount (INR)</label>
                  <input
                    type="number"
                    value={quotationDraftDetails.discount || 0}
                    onChange={e => {
                      const discount = Number(e.target.value);
                      const subtotal = quotationDraftDetails.subtotal || 0;
                      const taxAmount = (subtotal - discount) * 0.18;
                      setQuotationDraftDetails({
                        ...quotationDraftDetails,
                        discount,
                        taxAmount,
                        totalAmount: subtotal - discount + taxAmount
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg h-9 px-2.5 text-xs text-white outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Grand Total (including 18% GST)</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-lg h-9 px-2.5 text-xs text-emerald-450 font-bold flex items-center justify-between">
                    <span>INR {Number(quotationDraftDetails.totalAmount).toLocaleString()}</span>
                    <span className="text-[9px] text-slate-500 font-mono">(Tax: INR {Number(quotationDraftDetails.taxAmount).toLocaleString()})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/40">
              <Button onClick={() => setEditingQuotationId(null)} variant="ghost" className="text-xs text-slate-400 h-8">Cancel</Button>
              <Button onClick={handleSaveQuotationEdit} disabled={isSavingQuotation} className="bg-primary hover:bg-primary/90 text-slate-955 text-xs font-bold h-8 px-4 rounded-lg">
                {isSavingQuotation ? 'Saving...' : 'Save & Issue Quotation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
