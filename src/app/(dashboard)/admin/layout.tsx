"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, UserCheck, Shield, Building2, Cpu,
  FileText, Lock, ScrollText, Key, Activity, HardDrive, Bell,
  Code2, Settings, DollarSign, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { section: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "Users & Roles", items: [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/employees", label: "Employees", icon: UserCheck },
    { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
  ]},
  { section: "Settings", items: [
    { href: "/admin/organization", label: "Organization", icon: Building2 },
    { href: "/admin/ai-config", label: "AI Configuration", icon: Cpu },
    { href: "/admin/prompts", label: "Prompt Manager", icon: FileText },
    { href: "/admin/security", label: "Security Center", icon: Lock },
  ]},
  { section: "Operations", items: [
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/admin/api-keys", label: "API Keys", icon: Key },
    { href: "/admin/system-health", label: "System Health", icon: Activity },
    { href: "/admin/backup", label: "Backup", icon: HardDrive },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ]},
  { section: "Billing", items: [
    { href: "/admin/billing", label: "Subscription & Plans", icon: DollarSign },
  ]},
  { section: "Developer", items: [
    { href: "/admin/developer", label: "Developer Tools", icon: Code2 },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-screen">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex w-60 flex-none flex-col border-r border-slate-800 bg-slate-950 overflow-y-auto">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            <span className="font-bold text-slate-100 text-sm">Admin Control Center</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">Enterprise Management</p>
        </div>

        <nav className="flex-1 py-3 space-y-5 px-3">
          {ADMIN_NAV.map(group => (
            <div key={group.section}>
              <p className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  return (
                    <Link key={item.href} href={item.href}
                      className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60")}>
                      <item.icon className="h-3.5 w-3.5 flex-none" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-slate-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors">
            <ChevronRight className="h-3 w-3 rotate-180" /> Back to CRM
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {children}
      </main>
    </div>
  )
}
