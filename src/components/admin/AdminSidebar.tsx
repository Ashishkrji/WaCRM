"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Shield,
  Building2,
  Cpu,
  FileText,
  Lock,
  ScrollText,
  Key,
  Activity,
  HardDrive,
  Bell,
  Code2,
  DollarSign,
  Bot,
  ArrowLeft,
  X,
  MessageSquare
} from "lucide-react";
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

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    section: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    section: "Users & Roles",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/employees", label: "Employees", icon: UserCheck },
      { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
    ]
  },
  {
    section: "Settings",
    items: [
      { href: "/admin/organization", label: "Organization", icon: Building2 },
      { href: "/admin/ai-config", label: "AI Configuration", icon: Cpu },
      { href: "/admin/prompts", label: "Prompt Manager", icon: FileText },
      { href: "/admin/security", label: "Security Center", icon: Lock },
    ]
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/api-keys", label: "API Keys", icon: Key },
      { href: "/admin/system-health", label: "System Health", icon: Activity },
      { href: "/admin/backup", label: "Backup", icon: HardDrive },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ]
  },
  {
    section: "Billing",
    items: [
      { href: "/admin/billing", label: "Subscription & Plans", icon: DollarSign },
    ]
  },
  {
    section: "Developer",
    items: [
      { href: "/admin/developer", label: "Developer Tools", icon: Code2 },
    ]
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  useEffect(() => {
    onClose?.();
  }, [pathname]);

  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  return (
    <>
      {/* Mobile Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900",
          "transition-transform duration-200 ease-out will-change-transform",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-0 lg:w-60 lg:translate-x-0 lg:transition-none"
        )}
        aria-label="Admin Navigation"
      >
        {/* Logo Section */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-white">
              WaCRM Enterprise
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {adminNavGroups.map((group) => (
            <div key={group.section} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.section}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-amber-500/10 text-amber-400"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 flex-none" />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="border-t border-slate-800 my-2" />

          {/* Back to main CRM */}
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white lg:py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to CRM</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* User profile dropdown */}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-800/60 focus:bg-slate-800/60 focus:outline-none">
              <Avatar className="size-8 shrink-0">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Avatar"} />
                )}
                <AvatarFallback className="bg-amber-500/10 text-sm font-medium text-amber-550">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {profile?.full_name ?? "Admin User"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {profile?.role ?? "Administrator"}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={6}
              className="min-w-56 bg-slate-900 text-slate-100 ring-slate-700"
            >
              <DropdownMenuItem onClick={signOut} className="text-slate-200 focus:bg-slate-800 focus:text-white cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
