"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, Settings as SettingsIcon, User, Building2, ChevronDown, Sparkles, Plus, PlusCircle, Check } from "lucide-react";
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

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inbox": "Inbox",
  "/contacts": "Contacts",
  "/pipelines": "Pipelines",
  "/broadcasts": "Broadcasts",
  "/automations": "Automations",
  "/settings": "Settings",
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
  const { profile, signOut } = useAuth();
  const title = getPageTitle(pathname);

  // SaaS simulated workspaces state for Enterprise
  const [workspaces, setWorkspaces] = useState<string[]>([
    "Acme Corp (Main)",
    "Acme Support & Leads",
    "Acme Marketing Campaigns"
  ]);
  const [activeWorkspace, setActiveWorkspace] = useState("Acme Corp (Main)");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);


  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  const handleAddWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      setWorkspaces([...workspaces, newWorkspaceName.trim()]);
      setActiveWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setIsAddingWorkspace(false);
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
              {activeWorkspace}
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
                    key={ws}
                    onClick={() => setActiveWorkspace(ws)}
                    className="flex items-center justify-between cursor-pointer focus:bg-slate-800 focus:text-white"
                  >
                    <span className="truncate">{ws}</span>
                    {activeWorkspace === ws && <Check className="h-3.5 w-3.5 text-emerald-500" />}
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
        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-800/70 focus:bg-slate-800/70 focus:outline-none data-popup-open:bg-slate-800/70 sm:gap-3 sm:pl-1 sm:pr-3"
            aria-label="Open account menu"
          >
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
    </header>
  );
}

