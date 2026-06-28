"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Contact, Deal, ContactNote, Tag, Profile, Task, CustomerFile } from "@/types";
import {
  Phone,
  Mail,
  Copy,
  Check,
  User,
  Tag as TagIcon,
  DollarSign,
  StickyNote,
  Plus,
  Clock,
  FileText,
  Bot,
  Globe,
  MapPin,
  Sparkles,
  Edit2,
  Briefcase,
  Languages,
  Calendar,
  Save,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContactSidebarProps {
  contact: Contact | null;
  onContactUpdate?: (contact: Contact) => void;
}

export function ContactSidebar({ contact, onContactUpdate }: ContactSidebarProps) {
  const { accountId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [tags, setTags] = useState<(Tag & { contact_tag_id: string })[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customerFiles, setCustomerFiles] = useState<CustomerFile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  const [timelineFilter, setTimelineFilter] = useState<"all" | "notes" | "deals" | "tasks" | "meetings" | "files" | "proposals">("all");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company: "",
    email: "",
    website: "",
    timezone: "",
    lead_source: "",
    preferred_language: "",
    owner_id: "",
    industry: "",
    business_type: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (contact) {
      setEditForm({
        company: contact.company || "",
        email: contact.email || "",
        website: contact.website || "",
        timezone: contact.timezone || "",
        lead_source: contact.lead_source || "",
        preferred_language: contact.preferred_language || "en",
        owner_id: contact.owner_id || "",
        industry: contact.industry || "",
        business_type: contact.business_type || "",
        address: contact.address || "",
        city: contact.city || "",
        state: contact.state || "",
        country: contact.country || "",
      });
      setIsEditing(false);
    }
  }, [contact]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .order("full_name")
      .then(({ data }) => {
        if (data) setProfiles(data as Profile[]);
      });
  }, []);

  const fetchContactData = useCallback(async () => {
    if (!contact) return;

    const supabase = createClient();

    // Fetch all CRM modules in parallel for a unified timeline
    const [dealsRes, notesRes, tagsRes, meetingsRes, proposalsRes, quotesRes, tasksRes, filesRes] = await Promise.all([
      supabase
        .from("deals")
        .select("*, stage:pipeline_stages(*)")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contact_notes")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contact_tags")
        .select("id, tag_id, tags(*)")
        .eq("contact_id", contact.id),
      supabase
        .from("meeting_bookings")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("proposal_requests")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotation_requests")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_files")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false })
    ]);

    if (dealsRes.data) setDeals(dealsRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (meetingsRes.data) setMeetings(meetingsRes.data);
    if (proposalsRes.data) setProposals(proposalsRes.data);
    if (quotesRes.data) setQuotations(quotesRes.data);
    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (filesRes.data) setCustomerFiles(filesRes.data as CustomerFile[]);

    if (tagsRes.data) {
      const mapped = tagsRes.data
        .filter((ct: Record<string, any>) => ct.tags)
        .map((ct: Record<string, any>) => ({
          ...(ct.tags as Tag),
          contact_tag_id: ct.id as string,
        }));
      setTags(mapped);
    }
  }, [contact]);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  const handleCopyPhone = useCallback(async () => {
    if (!contact?.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [contact]);

  const handleAddNote = useCallback(async () => {
    if (!contact || !newNote.trim()) return;
    if (!accountId) return;
    setAddingNote(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    const { data, error } = await supabase
      .from("contact_notes")
      .insert({
        contact_id: contact.id,
        account_id: accountId,
        user_id: user?.id,
        note_text: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    }
    setAddingNote(false);
  }, [contact, newNote, accountId]);

  const handleSaveContactInfo = useCallback(async () => {
    if (!contact) return;
    const supabase = createClient();
    
    const { error } = await supabase
      .from("contacts")
      .update({
        company: editForm.company || null,
        email: editForm.email || null,
        website: editForm.website || null,
        timezone: editForm.timezone || null,
        lead_source: editForm.lead_source || null,
        preferred_language: editForm.preferred_language || "en",
        owner_id: editForm.owner_id || null,
        industry: editForm.industry || null,
        business_type: editForm.business_type || null,
        address: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        country: editForm.country || null,
      })
      .eq("id", contact.id);

    if (error) {
      toast.error(`Failed to update contact: ${error.message}`);
      return;
    }

    toast.success("Contact profile updated successfully");
    setIsEditing(false);

    if (onContactUpdate) {
      onContactUpdate({
        ...contact,
        ...editForm,
      } as Contact);
    }
    
    fetchContactData();
  }, [contact, editForm, onContactUpdate, fetchContactData]);

  // Aggregate Customer Timeline chronologically
  const timeline = useMemo(() => {
    const items: {
      id: string;
      type: "note" | "deal" | "meeting" | "proposal" | "quote" | "created" | "task" | "file";
      title: string;
      timestamp: Date;
      description: string;
    }[] = [];

    if (!contact) return [];

    // Contact registration
    items.push({
      id: "created",
      type: "created",
      title: "Contact Created",
      timestamp: new Date(contact.created_at),
      description: `Contact registered in CRM as ${contact.name || contact.phone}`,
    });

    // Notes
    notes.forEach((note) => {
      items.push({
        id: note.id,
        type: "note",
        title: "Internal Note",
        timestamp: new Date(note.created_at),
        description: note.note_text,
      });
    });

    // Deals
    deals.forEach((deal) => {
      items.push({
        id: deal.id,
        type: "deal",
        title: "Deal Created",
        timestamp: new Date(deal.created_at),
        description: `${deal.title} (${deal.currency ?? "$"}${deal.value.toLocaleString()}) — Stage: ${deal.stage?.name || "Active"}`,
      });
    });

    // Meetings
    meetings.forEach((m) => {
      items.push({
        id: m.id,
        type: "meeting",
        title: "Consultation Call",
        timestamp: new Date(m.created_at),
        description: `${m.title} scheduled for ${format(new Date(m.start_time), "MMM d, HH:mm")} (GMT/IST)`,
      });
    });

    // Proposals
    proposals.forEach((p) => {
      items.push({
        id: p.id,
        type: "proposal",
        title: "AI Proposal Generated",
        timestamp: new Date(p.created_at),
        description: `Service: ${p.service_required} | Status: ${p.status.toUpperCase()}`,
      });
    });

    // Quotations
    quotations.forEach((q) => {
      items.push({
        id: q.id,
        type: "quote",
        title: "AI Quotation Generated",
        timestamp: new Date(q.created_at),
        description: `Service: ${q.service_required} | Total Amount: ${q.total_amount} (Status: ${q.status.toUpperCase()})`,
      });
    });

    // Tasks
    tasks.forEach((t) => {
      items.push({
        id: t.id,
        type: "task",
        title: `Task: ${t.title}`,
        timestamp: new Date(t.created_at),
        description: `${t.description || "No description"} | Priority: ${t.priority.toUpperCase()} | Status: ${t.status.toUpperCase()}${t.due_date ? ` | Due: ${format(new Date(t.due_date), "MMM d, yyyy")}` : ""}`,
      });
    });

    // Customer Files
    customerFiles.forEach((f) => {
      items.push({
        id: f.id,
        type: "file",
        title: `File Attached: ${f.file_name}`,
        timestamp: new Date(f.created_at),
        description: `Type: ${f.file_type || "unknown"} | Size: ${f.file_size ? `${Math.round(f.file_size / 1024)} KB` : "unknown"}`,
      });
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [contact, notes, deals, meetings, proposals, quotations, tasks, customerFiles]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return timeline;
    return timeline.filter((item) => {
      if (timelineFilter === "notes") return item.type === "note";
      if (timelineFilter === "deals") return item.type === "deal";
      if (timelineFilter === "tasks") return item.type === "task";
      if (timelineFilter === "meetings") return item.type === "meeting";
      if (timelineFilter === "files") return item.type === "file";
      if (timelineFilter === "proposals") return item.type === "proposal" || item.type === "quote";
      return true;
    });
  }, [timeline, timelineFilter]);

  if (!contact) {
    return (
      <div className="flex h-full w-70 items-center justify-center border-l border-border bg-card">
        <p className="text-sm text-muted-foreground">Select a conversation</p>
      </div>
    );
  }

  const displayName = contact.name || contact.phone;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-70 flex-col border-l border-border bg-card">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Contact Profile */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
              {contact.avatar_url ? (
                <img
                  src={contact.avatar_url}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {displayName}
            </h3>
            {contact.company && (
              <p className="text-xs text-muted-foreground">{contact.company}</p>
            )}
          </div>

          {/* Core Info */}
          <div className="space-y-2">
            <button
              onClick={handleCopyPhone}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-left">{contact.phone}</span>
              {copied ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            {contact.email && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border" />

          {/* Extended Info Section */}
          {isEditing ? (
            <div className="space-y-3 bg-muted/40 p-3 rounded-xl border border-border">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border pb-1.5 uppercase">
                <span>Edit CRM Details</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Cancel"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Company</label>
                    <input
                      value={editForm.company}
                      onChange={(e) => setEditForm(p => ({ ...p, company: e.target.value }))}
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Website</label>
                    <input
                      value={editForm.website}
                      onChange={(e) => setEditForm(p => ({ ...p, website: e.target.value }))}
                      placeholder="e.g. example.com"
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Timezone</label>
                    <input
                      value={editForm.timezone}
                      onChange={(e) => setEditForm(p => ({ ...p, timezone: e.target.value }))}
                      placeholder="e.g. Asia/Kolkata"
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Lead Source</label>
                    <input
                      value={editForm.lead_source}
                      onChange={(e) => setEditForm(p => ({ ...p, lead_source: e.target.value }))}
                      placeholder="Google Ads, Website"
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Language</label>
                    <input
                      value={editForm.preferred_language}
                      onChange={(e) => setEditForm(p => ({ ...p, preferred_language: e.target.value }))}
                      placeholder="en"
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Industry</label>
                    <input
                      value={editForm.industry}
                      onChange={(e) => setEditForm(p => ({ ...p, industry: e.target.value }))}
                      placeholder="e.g. Tech, Finance"
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Owner</label>
                    <select
                      value={editForm.owner_id}
                      onChange={(e) => setEditForm(p => ({ ...p, owner_id: e.target.value }))}
                      className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none text-xs"
                    >
                      <option value="">Unassigned</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.user_id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">Business Type</label>
                  <input
                    value={editForm.business_type}
                    onChange={(e) => setEditForm(p => ({ ...p, business_type: e.target.value }))}
                    placeholder="e.g. Agency, Enterprise"
                    className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">Street Address</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full bg-background border border-border p-1.5 rounded text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">City</label>
                    <input
                      value={editForm.city}
                      onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full bg-background border border-border p-1 rounded text-[11px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">State</label>
                    <input
                      value={editForm.state}
                      onChange={(e) => setEditForm(p => ({ ...p, state: e.target.value }))}
                      className="w-full bg-background border border-border p-1 rounded text-[11px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Country</label>
                    <input
                      value={editForm.country}
                      onChange={(e) => setEditForm(p => ({ ...p, country: e.target.value }))}
                      className="w-full bg-background border border-border p-1 rounded text-[11px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSaveContactInfo}
                >
                  <Save className="h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pb-1 uppercase">
                <span>CRM Details</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 font-semibold text-[10px] tracking-wider"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              </div>

              <div className="space-y-2 text-[11px]">
                {contact.company && (
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <span className="text-muted-foreground font-medium">Company:</span>
                    <span className="text-foreground text-right truncate max-w-[150px]">{contact.company}</span>
                  </div>
                )}

                {contact.website && (
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <span className="text-muted-foreground font-medium">Website:</span>
                    <a
                      href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline truncate max-w-[150px]"
                    >
                      {contact.website}
                    </a>
                  </div>
                )}

                <div className="flex justify-between gap-2 border-b border-border pb-1">
                  <span className="text-muted-foreground font-medium">Owner:</span>
                  <span className="text-muted-foreground">
                    {profiles.find(p => p.user_id === contact.owner_id)?.full_name || "Unassigned"}
                  </span>
                </div>

                {contact.timezone && (
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <span className="text-muted-foreground font-medium">Timezone:</span>
                    <span className="text-muted-foreground">{contact.timezone}</span>
                  </div>
                )}

                {contact.lead_source && (
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <span className="text-muted-foreground font-medium">Source:</span>
                    <span className="text-foreground bg-primary/10 px-1 py-0.2 rounded text-[10px]">
                      {contact.lead_source}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-2 border-b border-border pb-1">
                  <span className="text-muted-foreground font-medium">Language:</span>
                  <span className="text-muted-foreground uppercase">{contact.preferred_language || "en"}</span>
                </div>

                {contact.business_type && (
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <span className="text-muted-foreground font-medium">Business:</span>
                    <span className="text-muted-foreground">{contact.business_type}</span>
                  </div>
                )}

                {contact.industry && (
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <span className="text-muted-foreground font-medium">Industry:</span>
                    <span className="text-muted-foreground">{contact.industry}</span>
                  </div>
                )}

                {(contact.address || contact.city || contact.country) && (
                  <div className="flex flex-col gap-0.5 pb-1">
                    <span className="text-muted-foreground font-medium">Address:</span>
                    <span className="text-muted-foreground text-left pl-1 leading-normal">
                      {contact.address && `${contact.address}, `}
                      {contact.city && `${contact.city}, `}
                      {contact.state && `${contact.state}, `}
                      {contact.country && contact.country}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TagIcon className="h-3 w-3" />
              Tags
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {tags.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">No tags applied</p>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag.contact_tag_id}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
                    style={{
                      backgroundColor: `${tag.color}15`,
                      borderColor: `${tag.color}30`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Unified CRM Timeline */}
          <div>            <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Customer Timeline
            </div>

            {/* Timeline Filter Tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              {(["all", "notes", "deals", "tasks", "meetings", "files", "proposals"] as const).map((f) => {
                const isActive = timelineFilter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTimelineFilter(f)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold border transition-all",
                      isActive
                        ? "bg-primary/10 border-primary/35 text-primary shadow-sm"
                        : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Note Writer */}
            <div className="flex gap-2 mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal note..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
              />
              <Button
                size="sm"
                className="h-auto bg-primary hover:bg-primary/90 px-2.5 rounded-lg text-primary-foreground"
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Timeline Feed */}
            {filteredTimeline.length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">No events logged</p>
            ) : (
              <div className="relative pl-4 border-l border-border space-y-4 ml-3 pt-1">
                {filteredTimeline.map((event) => {
                  let icon = <Bot className="h-3 w-3 text-primary" />;
                  if (event.type === "note") icon = <StickyNote className="h-3 w-3 text-amber-500" />;
                  if (event.type === "deal") icon = <DollarSign className="h-3 w-3 text-emerald-500" />;
                  if (event.type === "meeting") icon = <Clock className="h-3 w-3 text-sky-500" />;
                  if (event.type === "proposal" || event.type === "quote") icon = <FileText className="h-3 w-3 text-pink-500" />;
                  if (event.type === "created") icon = <User className="h-3 w-3 text-muted-foreground" />;
                  if (event.type === "task") icon = <Briefcase className="h-3 w-3 text-violet-500" />;
                  if (event.type === "file") icon = <Globe className="h-3 w-3 text-emerald-500" />;

                  return (
                    <div key={`${event.type}-${event.id}`} className="relative group">
                      {/* Timeline Bullet */}
                      <span className="absolute -left-[22px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card border border-border shadow-md">
                        {icon}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                            {event.title}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {format(new Date(event.timestamp), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-normal">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
