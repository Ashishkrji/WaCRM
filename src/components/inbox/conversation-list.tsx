"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationStatus, Profile, Tag } from "@/types";
import { Search, ChevronDown, Bot, User, Tag as TagIcon, Clock, Pin, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (conversation: Conversation) => void;
  conversations: Conversation[];
  onConversationsLoaded: (conversations: Conversation[]) => void;
  resyncToken?: number;
}

const STATUS_COLORS: Record<ConversationStatus, string> = {
  open: "bg-primary",
  pending: "bg-amber-500",
  closed: "bg-muted-foreground",
};

type InboxFilter = ConversationStatus | "all" | "unread";

const STATUS_FILTER_OPTIONS: { label: string; value: ConversationStatus | "all" }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
];

const AI_FILTER_OPTIONS = [
  { label: "All Modes", value: "all" },
  { label: "AI Active", value: "active" },
  { label: "Human Only", value: "inactive" },
];

export function ConversationList({
  activeConversationId,
  onSelect,
  conversations,
  onConversationsLoaded,
  resyncToken = 0,
}: ConversationListProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  // Smart filter states
  const [inboxTab, setInboxTab] = useState<'shared' | 'private' | 'assigned' | 'unassigned' | 'pinned' | 'favorites' | 'unread' | 'spam' | 'blocked' | 'archived' | 'mentioned' | 'resolved' | 'pending' | 'follow_up' | 'recently_active'>('shared');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "unassigned" | "me" | string>("all");
  const [aiFilter, setAiFilter] = useState<"all" | "active" | "inactive">("all");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [loading, setLoading] = useState(true);

  // Parallel data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [contactTags, setContactTags] = useState<{ contact_id: string; tag_id: string }[]>([]);
  const [aiConvs, setAiConvs] = useState<{ conversation_id: string; ai_active: boolean }[]>([]);

  const onConversationsLoadedRef = useRef(onConversationsLoaded);
  useEffect(() => {
    onConversationsLoadedRef.current = onConversationsLoaded;
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      // Parallel DB loading of all CRM modules
      const [convsRes, profilesRes, tagsRes, ctRes, aiRes] = await Promise.all([
        supabase
          .from("conversations")
          .select("*, contact:contacts(*)")
          .order("last_message_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .order("full_name"),
        supabase
          .from("tags")
          .select("*")
          .order("name"),
        supabase
          .from("contact_tags")
          .select("contact_id, tag_id"),
        supabase
          .from("ai_conversations")
          .select("conversation_id, ai_active")
      ]);

      if (cancelled) return;

      if (convsRes.error) {
        console.error("Failed to fetch conversations:", convsRes.error.message);
        setLoading(false);
        return;
      }

      onConversationsLoadedRef.current(convsRes.data ?? []);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (tagsRes.data) setAllTags(tagsRes.data as Tag[]);
      if (ctRes.data) setContactTags(ctRes.data as any[]);
      if (aiRes.data) setAiConvs(aiRes.data as any[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resyncToken]);

  // Smart combined filtering
  const filtered = useMemo(() => {
    let result = conversations;

    // Filter by Inbox Tab
    if (inboxTab === "shared") {
      result = result.filter((c) => c.status !== "closed" && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "private") {
      result = result.filter((c) => c.status !== "closed" && c.assigned_agent_id === user?.id && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "assigned") {
      result = result.filter((c) => c.status !== "closed" && !!c.assigned_agent_id && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "unassigned") {
      result = result.filter((c) => c.status !== "closed" && !c.assigned_agent_id && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "pinned") {
      result = result.filter((c) => c.pinned ?? false);
    } else if (inboxTab === "favorites") {
      result = result.filter((c) => c.favorite ?? false);
    } else if (inboxTab === "unread") {
      result = result.filter((c) => c.unread_count > 0);
    } else if (inboxTab === "spam") {
      result = result.filter((c) => c.spam ?? false);
    } else if (inboxTab === "blocked") {
      result = result.filter((c) => c.blocked ?? false);
    } else if (inboxTab === "archived" || inboxTab === "resolved") {
      result = result.filter((c) => c.status === "closed");
    } else if (inboxTab === "pending") {
      result = result.filter((c) => c.status === "pending" && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "follow_up") {
      result = result.filter((c) => (c.status === "pending" || c.unread_count > 0) && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "recently_active") {
      result = result.filter((c) => c.status !== "closed" && !(c.spam ?? false) && !(c.blocked ?? false));
    } else if (inboxTab === "mentioned") {
      const myName = profiles.find((p) => p.user_id === user?.id)?.full_name || "";
      result = result.filter((c) => {
        const text = c.last_message_text?.toLowerCase() || "";
        const isHelpReq = text.includes("help requested") || text.includes("assistance");
        const hasMyName = myName && text.includes(myName.toLowerCase());
        const hasMyEmail = user?.email && text.includes(user.email.toLowerCase());
        return isHelpReq || hasMyName || hasMyEmail;
      });
    }

    // 1. Status Filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // 2. Assignee Filter
    if (assigneeFilter === "unassigned") {
      result = result.filter((c) => !c.assigned_agent_id);
    } else if (assigneeFilter === "me") {
      result = result.filter((c) => c.assigned_agent_id === user?.id);
    } else if (assigneeFilter !== "all") {
      result = result.filter((c) => c.assigned_agent_id === assigneeFilter);
    }

    // 3. AI State Filter
    if (aiFilter !== "all") {
      const activeIds = new Set(
        aiConvs.filter((a) => a.ai_active).map((a) => a.conversation_id)
      );
      if (aiFilter === "active") {
        result = result.filter((c) => activeIds.has(c.id));
      } else {
        result = result.filter((c) => !activeIds.has(c.id));
      }
    }

    // 4. Tags Filter
    if (tagFilter !== "all") {
      const contactIdsWithTag = new Set(
        contactTags
          .filter((ct) => ct.tag_id === tagFilter)
          .map((ct) => ct.contact_id)
      );
      result = result.filter((c) => contactIdsWithTag.has(c.contact_id));
    }

    // 5. Search Text Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const name = c.contact?.name?.toLowerCase() ?? "";
        const phone = c.contact?.phone?.toLowerCase() ?? "";
        const lastMsg = c.last_message_text?.toLowerCase() ?? "";
        return name.includes(q) || phone.includes(q) || lastMsg.includes(q);
      });
    }

    return result;
  }, [conversations, statusFilter, assigneeFilter, aiFilter, tagFilter, search, user?.id, aiConvs, contactTags, inboxTab]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

  const handleSelect = useCallback(
    (conv: Conversation) => {
      onSelect(conv);
    },
    [onSelect]
  );

  // Active label resolution
  const activeStatusLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Status";
  
  const activeAssigneeLabel = useMemo(() => {
    if (assigneeFilter === "all") return "All Agents";
    if (assigneeFilter === "unassigned") return "Unassigned";
    if (assigneeFilter === "me") return "My Chats";
    return profiles.find((p) => p.user_id === assigneeFilter)?.full_name || "Assignee";
  }, [assigneeFilter, profiles]);

  const activeAiLabel = AI_FILTER_OPTIONS.find((o) => o.value === aiFilter)?.label ?? "Chat Mode";
  const activeTagLabel = tagFilter === "all" ? "All Tags" : allTags.find((t) => t.id === tagFilter)?.name || "Tags";

  const INBOX_TABS = [
    { label: "Shared", value: "shared" },
    { label: "Private", value: "private" },
    { label: "Assigned", value: "assigned" },
    { label: "Unassigned", value: "unassigned" },
    { label: "Archived", value: "archived" },
    { label: "Pinned", value: "pinned" },
    { label: "Unread", value: "unread" },
    { label: "Mentions", value: "mentioned" },
    { label: "Resolved", value: "resolved" },
    { label: "Pending", value: "pending" },
    { label: "Follow-up", value: "follow_up" },
    { label: "Spam", value: "spam" },
    { label: "Blocked", value: "blocked" },
    { label: "Favorites", value: "favorites" },
    { label: "Recent", value: "recently_active" },
  ] as const;

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-card lg:w-80">
      {/* Horizontal Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-border bg-muted/20 px-2 py-1.5 select-none shrink-0 scrollbar-none">
        {INBOX_TABS.map((tab) => {
          const isActive = inboxTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setInboxTab(tab.value)}
              className={cn(
                "h-7 shrink-0 px-2.5 text-[10px] uppercase tracking-wider font-semibold rounded-md transition-all hover:bg-muted hover:text-foreground",
                isActive
                  ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search + Smart Filters */}
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search inbox..."
            className="pl-9 text-sm focus:border-primary/50"
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-1 pt-1">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 gap-1 px-2 text-[10px] font-semibold text-slate-400 hover:text-white rounded-md hover:bg-slate-800 border border-slate-800 bg-slate-950/20">
                {activeStatusLabel}
                <ChevronDown className="h-2.5 w-2.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-slate-700 bg-slate-800">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn("text-xs", statusFilter === opt.value ? "text-primary font-bold" : "text-slate-300")}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignee Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 gap-1 px-2 text-[10px] font-semibold text-slate-400 hover:text-white rounded-md hover:bg-slate-800 border border-slate-800 bg-slate-950/20">
                <User className="h-2.5 w-2.5 mr-0.5" />
                {activeAssigneeLabel}
                <ChevronDown className="h-2.5 w-2.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-slate-700 bg-slate-800 max-h-[250px] overflow-y-auto">
              <DropdownMenuItem onClick={() => setAssigneeFilter("all")} className={cn("text-xs", assigneeFilter === "all" && "text-primary font-bold")}>All Agents</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssigneeFilter("me")} className={cn("text-xs", assigneeFilter === "me" && "text-primary font-bold")}>My Chats (me)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssigneeFilter("unassigned")} className={cn("text-xs", assigneeFilter === "unassigned" && "text-primary font-bold")}>Unassigned</DropdownMenuItem>
              {profiles.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => setAssigneeFilter(p.user_id)}
                  className={cn("text-xs", assigneeFilter === p.user_id ? "text-primary font-bold" : "text-slate-300")}
                >
                  {p.full_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI / Chat Mode Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 gap-1 px-2 text-[10px] font-semibold text-slate-400 hover:text-white rounded-md hover:bg-slate-800 border border-slate-800 bg-slate-950/20">
                <Bot className="h-2.5 w-2.5 mr-0.5" />
                {activeAiLabel}
                <ChevronDown className="h-2.5 w-2.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-slate-700 bg-slate-800">
              {AI_FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setAiFilter(opt.value as any)}
                  className={cn("text-xs", aiFilter === opt.value ? "text-primary font-bold" : "text-slate-300")}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 gap-1 px-2 text-[10px] font-semibold text-slate-400 hover:text-white rounded-md hover:bg-slate-800 border border-slate-800 bg-slate-950/20">
                <TagIcon className="h-2.5 w-2.5 mr-0.5" />
                {activeTagLabel}
                <ChevronDown className="h-2.5 w-2.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-slate-700 bg-slate-800 max-h-[250px] overflow-y-auto">
              <DropdownMenuItem onClick={() => setTagFilter("all")} className={cn("text-xs", tagFilter === "all" && "text-primary font-bold")}>All Tags</DropdownMenuItem>
              {allTags.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => setTagFilter(t.id)}
                  className={cn("text-xs", tagFilter === t.id ? "text-primary font-bold" : "text-slate-300")}
                >
                  <span className="inline-block h-2 w-2 rounded-full mr-2" style={{ backgroundColor: t.color }} />
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conversation Items.
          `min-h-0` is load-bearing: a flex child defaults to
          min-height:auto, so without it this ScrollArea grows to fit
          every conversation instead of shrinking to the remaining
          space — the list then overflows and gets clipped by the
          parent's overflow-hidden with no scrollbar (issue #229). */}
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((conv) => {
              const aiActive = aiConvs.find((a) => a.conversation_id === conv.id)?.ai_active ?? true;
              
              // Resolve tags for this conversation's contact
              const cTags = contactTags
                .filter((ct) => ct.contact_id === conv.contact_id)
                .map((ct) => allTags.find((t) => t.id === ct.tag_id))
                .filter(Boolean) as Tag[];

              return (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onSelect={handleSelect}
                  aiActive={aiActive}
                  tags={cTags}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
  aiActive?: boolean;
  tags?: Tag[];
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  aiActive = true,
  tags = [],
}: ConversationItemProps) {
  const contact = conversation.contact;
  const displayName = contact?.name || contact?.phone || "Unknown";
  const initials = displayName.charAt(0).toUpperCase();

  const handleClick = useCallback(() => {
    onSelect(conversation);
  }, [onSelect, conversation]);

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
      })
    : "";

  // SLA Calculation
  const SLA_LIMIT_MINS = 30;
  const elapsedMins = conversation.last_message_at
    ? (Date.now() - new Date(conversation.last_message_at).getTime()) / 60000
    : 0;
  const isWaiting = conversation.unread_count > 0 && conversation.status !== "closed";
  const isSlaBreached = isWaiting && elapsedMins > SLA_LIMIT_MINS;
  const isSlaWarning = isWaiting && elapsedMins > 15 && elapsedMins <= SLA_LIMIT_MINS;

  let slaBadge = null;
  if (isWaiting && conversation.last_message_at) {
    const remainingMins = Math.max(0, Math.ceil(SLA_LIMIT_MINS - elapsedMins));
    if (isSlaBreached) {
      slaBadge = (
        <span className="flex items-center gap-0.5 text-[9px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.5 rounded">
          <Clock className="h-2.5 w-2.5" />
          SLA Breach ({Math.floor(elapsedMins - SLA_LIMIT_MINS)}m)
        </span>
      );
    } else if (isSlaWarning) {
      slaBadge = (
        <span className="flex items-center gap-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded">
          <Clock className="h-2.5 w-2.5" />
          SLA Warning ({remainingMins}m)
        </span>
      );
    } else {
      slaBadge = (
        <span className="flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded">
          <Clock className="h-2.5 w-2.5" />
          SLA: {remainingMins}m
        </span>
      );
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50",
        isActive && "border-l-2 border-primary bg-muted/70"
      )}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground relative">
        {contact?.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initials
        )}
        {/* AI active dot badge */}
        {aiActive && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-indigo-500 border border-slate-900" title="AI active on this chat" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground flex items-center gap-1">
            {displayName}
            {conversation.pinned && <Pin className="h-3 w-3 text-primary fill-primary rotate-45 shrink-0" />}
            {conversation.favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">
            {conversation.last_message_text || "No messages yet"}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {conversation.unread_count > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {conversation.unread_count}
              </span>
            )}
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                STATUS_COLORS[conversation.status]
              )}
              title={conversation.status}
            />
          </div>
        </div>

        {/* Tags / Smart Labels */}
        {tags && tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{
                  backgroundColor: tag.color + "20",
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* SLA Status Bar */}
        {slaBadge && (
          <div className="mt-2 flex items-center">
            {slaBadge}
          </div>
        )}
      </div>
    </button>
  );
}
