"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, Settings as SettingsIcon, User, Building2, ChevronDown, Sparkles, Plus, PlusCircle, Check, Search, Bell } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { GlobalSearchModal } from "./global-search-modal";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inbox": "Inbox",
  "/contacts": "Contacts",
  "/pipelines": "Pipelines",
  "/pipeline-manager": "Pipeline Manager",
  "/broadcasts": "Broadcasts",
  "/automations": "Automations",
  "/settings": "Settings",
  "/workspace": "Workspace & Branding",
  "/team": "Team",
  "/appearance": "Appearance",
  "/templates": "Templates",
  "/tags": "Tags",
  "/flows": "Flows",
  "/quick-replies": "Quick Replies",
  "/segments": "Segments",
  "/commerce": "Commerce",
  "/integrations": "Integrations",
  "/widgets": "Chat Widget",
  "/ai-router": "AI Router",
  "/analytics": "Analytics",
  "/support": "Help & Support",
  "/admin": "Admin Dashboard",
  "/ai-conversations": "AI Conversations",
  "/ai-knowledge": "AI Knowledge",
  "/developers": "Developer Settings",
  "/docs": "Documentation",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  );
  return match ? match[1] : "Dashboard";
}

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const title = getPageTitle(pathname);
  const supabase = createClient();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load live notifications
  useEffect(() => {
    if (!user) return;

    async function loadNotifications() {
      try {
        const list: any[] = [];
        
        // 1. Overdue/pending tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'pending')
          .limit(3);

        if (tasksData) {
          tasksData.forEach(t => {
            list.push({
              id: t.id,
              title: `CRM Task: ${t.title}`,
              body: t.description || 'Action pending.',
              time: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date',
            });
          });
        }

        // 2. Upcoming meetings
        const { data: meetingsData } = await supabase
          .from('meeting_bookings')
          .select('*')
          .eq('status', 'scheduled')
          .limit(3);

        if (meetingsData) {
          meetingsData.forEach(m => {
            list.push({
              id: m.id,
              title: `Meeting: ${m.title || 'Client Call'}`,
              body: `Discussion scheduled.`,
              time: new Date(m.start_time).toLocaleDateString(),
            });
          });
        }

        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }

    loadNotifications();
  }, [user, supabase]);

  const updateAvailability = async (status: 'online' | 'busy' | 'away') => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ availability: status, last_seen_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update availability status');
    } else {
      toast.success(`Status set to ${status.toUpperCase()}`);
      router.refresh();
    }
  };

  useEffect(() => {
    if (!user) return;
    loadWorkspaces();
  }, [user, profile]);

  async function loadWorkspaces() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("business_workspaces")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Auto-provision default business workspace for user
        const defaultName = `${profile?.full_name || "My"} Business`;
        const { data: newWs, error: insertErr } = await supabase
          .from("business_workspaces")
          .insert({
            user_id: user.id,
            name: defaultName,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        if (newWs) {
          setWorkspaces([newWs]);
          setActiveWorkspace(newWs);
          localStorage.setItem("wacrm_active_workspace_id", newWs.id);
        }
      } else {
        setWorkspaces(data);
        const cachedId = localStorage.getItem("wacrm_active_workspace_id");
        const cachedWs = data.find((ws) => ws.id === cachedId);
        if (cachedWs) {
          setActiveWorkspace(cachedWs);
        } else {
          setActiveWorkspace(data[0]);
          localStorage.setItem("wacrm_active_workspace_id", data[0].id);
        }
      }
    } catch (err: any) {
      console.error("[header] Failed to load workspaces:", err.message);
    }
  }

  const handleSwitchWorkspace = (ws: any) => {
    setActiveWorkspace(ws);
    localStorage.setItem("wacrm_active_workspace_id", ws.id);
    window.dispatchEvent(new Event("wacrm_workspace_changed"));
    toast.success(`Switched to workspace: ${ws.name}`);
  };

  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  const handleAddWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim() && user) {
      try {
        const { data, error } = await supabase
          .from("business_workspaces")
          .insert({
            user_id: user.id,
            name: newWorkspaceName.trim(),
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setWorkspaces((prev) =>
            [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
          );
          setActiveWorkspace(data);
          localStorage.setItem("wacrm_active_workspace_id", data.id);
          window.dispatchEvent(new Event("wacrm_workspace_changed"));
          toast.success(`Workspace "${data.name}" created!`);
        }
      } catch (err: any) {
        toast.error("Failed to create workspace: " + err.message);
      } finally {
        setNewWorkspaceName("");
        setIsAddingWorkspace(false);
      }
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <h1 className="hidden sm:block truncate text-base font-semibold text-white sm:text-lg mr-2">
          {title}
        </h1>

        {/* Workspace Switcher */}
        <div className="h-4 w-px bg-slate-800 hidden sm:block mr-2" />
        
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {activeWorkspace?.name || "Select Workspace..."}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
            <>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws)}
                    className="flex items-center justify-between cursor-pointer focus:bg-slate-800 focus:text-white"
                  >
                    <span className="truncate">{ws.name}</span>
                    {activeWorkspace?.id === ws.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-slate-800" />
                {isAddingWorkspace ? (
                  <form onSubmit={handleAddWorkspace} className="p-2 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Workspace name..."
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="flex h-7 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-7 px-2 bg-primary text-white text-xs">
                      Add
                    </Button>
                  </form>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setIsAddingWorkspace(true)}
                    className="flex items-center gap-1.5 text-xs text-primary focus:bg-slate-800 focus:text-primary cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Workspace
                  </DropdownMenuItem>
                )}
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3">
        {/* Spotlight Search Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 w-60 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/50 px-3 py-1.5 text-xs text-slate-450 hover:text-slate-300 transition-all focus:outline-none cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd className="flex h-4 items-center gap-0.5 rounded bg-slate-900 px-1 text-[8px] font-bold text-slate-600 border border-slate-800 font-mono">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="relative h-8 w-8 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-550 text-[8px] font-bold text-white animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-72 bg-slate-905 border-slate-800 text-slate-250 p-2 space-y-2">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800">
              <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Alerts & Actions</span>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-[9px] text-primary hover:text-primary/80 font-bold uppercase"
                >
                  Clear
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-5 text-slate-550 text-[11px]">
                No new notifications. Everything clear!
              </div>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {notifications.map(n => (
                  <div key={n.id} className="bg-slate-950/60 p-2 rounded-lg border border-slate-850 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-slate-200 leading-snug">{n.title}</span>
                      <span className="text-[8px] text-slate-500 font-mono shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-450 leading-normal">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-800/70 focus:bg-slate-800/70 focus:outline-none data-popup-open:bg-slate-800/70 sm:gap-3 sm:pl-1 sm:pr-3"
            aria-label="Open account menu"
          >
            <div className="relative">
              <Avatar className="size-8">
                {profile?.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Avatar"}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                "absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-1 ring-slate-950",
                profile?.availability === 'online' ? 'bg-emerald-555' :
                profile?.availability === 'busy' ? 'bg-rose-555' :
                profile?.availability === 'away' ? 'bg-amber-555' :
                'bg-slate-500'
              )} />
            </div>
            <span className="hidden text-sm font-medium text-white sm:inline">
              {profile?.full_name ?? "User"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="min-w-56 bg-slate-900 text-slate-100 ring-slate-700"
          >
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium text-white">
                {profile?.full_name ?? "User"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {profile?.email ?? ""}
              </p>
            </div>

            <div className="px-2 py-1.5 border-t border-b border-slate-850 my-1 bg-slate-950/20">
              <span className="text-[9px] text-slate-500 uppercase font-extrabold block mb-1 tracking-wider">Set Availability</span>
              <div className="flex items-center gap-1">
                {([
                  { key: 'online', label: 'Online', color: 'bg-emerald-500' },
                  { key: 'busy', label: 'Busy', color: 'bg-rose-500' },
                  { key: 'away', label: 'Away', color: 'bg-amber-500' },
                ] as const).map(status => (
                  <button
                    key={status.key}
                    type="button"
                    onClick={() => updateAvailability(status.key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded border transition-all font-semibold cursor-pointer",
                      profile?.availability === status.key
                        ? "bg-slate-800 text-white border-slate-700"
                        : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/45 hover:text-slate-300"
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full shrink-0", status.color)} />
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=profile"
                  className="flex items-center gap-2 text-slate-200 focus:bg-slate-800 focus:text-white"
                />
              }
            >
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <Link
                  href="/settings?tab=whatsapp"
                  className="flex items-center gap-2 text-slate-200 focus:bg-slate-800 focus:text-white"
                />
              }
            >
              <SettingsIcon className="size-4" />
              Settings
            </DropdownMenuItem>
            {profile?.role === "admin" && (
              <DropdownMenuItem
                render={
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-slate-200 focus:bg-slate-800 focus:text-white font-semibold text-amber-300"
                  />
                }
              >
                <Building2 className="size-4 text-amber-300" />
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={signOut}
              className="text-slate-200 focus:bg-slate-800 focus:text-white cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <GlobalSearchModal isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}

