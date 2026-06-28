"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Users,
  Zap,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  Workflow,
  HeartHandshake,
  Lock,
  Server,
  Database,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowUpRight,
  Plus,
  Play,
  Settings,
  Mail,
  Send,
  HelpCircle,
  LayoutDashboard,
  Inbox,
  Link2,
  Image as ImageIcon,
  Bot,
  Brain,
  Folder,
  CheckSquare,
  Terminal,
  ChevronRight,
  Clock,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureSpotlight } from "@/components/landing/feature-spotlight";
import { FAQ } from "@/components/landing/faq";
import { CtaBanner } from "@/components/landing/cta-banner";
import { InboxMock } from "@/components/landing/mock/inbox-mock";
import { PipelineMock } from "@/components/landing/mock/pipeline-mock";
import { AutomationMock } from "@/components/landing/mock/automation-mock";
import { AnalyticsMock } from "@/components/landing/mock/analytics-mock";

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20 overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-white">
      
      {/* ==========================================
          1. HERO SECTION (Preserved Custom Hero)
         ========================================== */}
      <section className="relative pt-12 md:pt-20 lg:pt-28 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-20 left-1/3 w-[400px] h-[200px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Meta Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400 mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          Official Meta Cloud API Integration
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          More Leads. Faster Follow-Up. <span className="text-blue-505">More Revenue.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Maximize WhatsApp to send broadcasts, build chatbots & automate customer journeys on the official WhatsApp Business API.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/book-demo"
            className="w-full sm:w-auto text-center font-semibold text-white bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.35)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2 group"
          >
            Book a Strategy Call
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto text-center font-medium text-slate-300 hover:text-white px-8 py-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 transition-all"
          >
            See How It Works
          </a>
        </div>

        {/* Hero Dashboard Mockup */}
        <div className="mt-16 w-full rounded-2xl border border-slate-900 bg-slate-900/10 p-2 shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          <div className="rounded-xl border border-slate-800/80 bg-[#070a13] aspect-[16/10] overflow-hidden flex flex-col text-left select-none">
            {/* Window bar */}
            <div className="h-10 border-b border-slate-900/80 flex items-center px-4 justify-between bg-[#0b0f19]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">mjchatsyncs-enterprise-dashboard</span>
              <div className="w-12" />
            </div>

            {/* Inner Dashboard Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-52 shrink-0 border-r border-slate-900/80 bg-[#0b0f19] flex flex-col justify-between py-4 font-sans text-xs">
                {/* Logo & Brand */}
                <div className="px-4 mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold tracking-tight text-white">MJChatSyncs</span>
                </div>

                {/* Sidebar Navigation */}
                <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
                  {[
                    { label: "Dashboard", icon: LayoutDashboard, active: true },
                    { label: "Inbox", icon: Inbox },
                    { label: "Contacts", icon: Users },
                    { label: "Campaigns", icon: Send },
                    { label: "Integrations", icon: Link2 },
                    { label: "Manage", icon: Settings, hasChevron: true },
                    { label: "Gallery", icon: ImageIcon },
                    { label: "FAQ Bot", icon: HelpCircle },
                    { label: "Chatbot", icon: Bot },
                    { label: "Ai assistant", icon: Brain },
                    { label: "Flows", icon: GitBranch },
                    { label: "Projects", icon: Folder },
                    { label: "Tasks", icon: CheckSquare },
                    { label: "Settings", icon: Settings },
                    { label: "Knowledge Base", icon: Database },
                    { label: "Developers", icon: Terminal, hasChevron: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                        item.active
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="text-[11px]">{item.label}</span>
                      </div>
                      {item.hasChevron && <ChevronRight className="h-3 w-3 text-slate-505" />}
                    </div>
                  ))}
                </div>

                {/* Profile Section */}
                <div className="px-3 pt-3 border-t border-slate-900/80 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shadow-inner">
                    LU
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">lakshit ukani</p>
                    <p className="text-[9px] text-slate-500 truncate">Workspace Admin</p>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-[#070a13] flex flex-col overflow-hidden">
                {/* Top Nav */}
                <div className="h-11 border-b border-slate-900/80 bg-[#070a13] flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white">
                      <div className="w-4 h-3.5 flex flex-col justify-between">
                        <span className="w-full h-0.5 bg-current rounded-full" />
                        <span className="w-3/4 h-0.5 bg-current rounded-full" />
                        <span className="w-full h-0.5 bg-current rounded-full" />
                      </div>
                    </button>
                    <span className="text-xs font-semibold text-white">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400 hover:text-white cursor-pointer" />
                    <div className="h-6 w-6 rounded-full bg-slate-850 border border-slate-700 cursor-pointer" />
                  </div>
                </div>

                {/* Grid Layout */}
                <div className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-y-auto custom-scrollbar">
                  {/* Card 1: Messages (col-span-4) */}
                  <div className="col-span-12 lg:col-span-4 bg-[#0d1222]/60 border border-slate-900/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="flex items-center gap-2 text-slate-200">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-[13px]">Messages</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Message Response Analytics</span>
                      <div className="space-y-1.5">
                        {[
                          { name: "Whatsapp", change: "+25%", up: true },
                          { name: "LinkedIn", change: "-25%", up: false },
                          { name: "Instagram", change: "+25%", up: true },
                          { name: "Twitter", change: "+25%", up: true },
                        ].map((chan) => (
                          <div key={chan.name} className="flex items-center justify-between text-[11px] py-0.5">
                            <span className="text-slate-300 font-medium">{chan.name}</span>
                            <span className={cn("font-semibold flex items-center gap-1", chan.up ? "text-emerald-500" : "text-red-500")}>
                              {chan.change}
                              {chan.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Message analytics (col-span-5) */}
                  <div className="col-span-12 lg:col-span-5 bg-[#0d1222]/60 border border-slate-900/80 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[13px] text-slate-200">Message analytics</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 border border-slate-800 bg-[#12182b]/60 px-2.5 py-1 rounded-lg cursor-pointer">
                        <span>Current Year</span>
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                    {/* Mock Stacked Bar Chart */}
                    <div className="flex-1 flex flex-col justify-between min-h-[140px] pt-4">
                      <div className="flex-1 flex items-stretch gap-2.5 relative">
                        {/* Y-Axis */}
                        <div className="flex flex-col justify-between text-[9px] text-slate-600 w-4 select-none">
                          <span>100</span>
                          <span>75</span>
                          <span>50</span>
                          <span>25</span>
                          <span>0</span>
                        </div>
                        {/* Bars Area */}
                        <div className="flex-1 border-b border-slate-900/80 relative flex items-end justify-between px-2 pb-1 gap-1">
                          {/* Horizontal Grid lines */}
                          <div className="absolute inset-x-0 top-0 border-t border-slate-900/20" />
                          <div className="absolute inset-x-0 top-1/4 border-t border-slate-900/20" />
                          <div className="absolute inset-x-0 top-2/4 border-t border-slate-900/20" />
                          <div className="absolute inset-x-0 top-3/4 border-t border-slate-900/20" />

                          {/* 12 Months */}
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"].map((mon) => (
                            <div key={mon} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              {mon === "Mar" ? (
                                <div className="w-full flex flex-col justify-end h-full">
                                  {/* Stacked Bar */}
                                  <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: "45%" }} />
                                  <div className="w-full bg-blue-600" style={{ height: "45%" }} />
                                </div>
                              ) : (
                                <div className="w-full bg-slate-900/20 rounded-t-sm" style={{ height: "2%" }} />
                              )}
                              <span className="text-[8px] text-slate-600 font-mono scale-90">{mon}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 text-[10px] mt-3 pt-2 border-t border-slate-900/20">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span className="text-slate-400 font-medium">Sent</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-slate-400 font-medium">Received</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Your Plan (col-span-3) */}
                  <div className="col-span-12 lg:col-span-3 bg-[#0d1222]/60 border border-slate-900/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="text-[13px]">👑</span>
                      <span className="font-bold text-[13px]">Your Plan</span>
                    </div>
                    <div className="bg-[#12182b]/80 border border-slate-900/40 p-3 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 w-full" />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white">Features</span>
                        <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15">
                          Archived
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Your enterprise subscription features and usage limits.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Feature Breakdown</span>
                      <div className="border border-slate-900/60 rounded-lg overflow-hidden text-[9px]">
                        <div className="grid grid-cols-4 bg-[#0b0f19] px-2.5 py-1.5 text-slate-500 font-bold border-b border-slate-900/80">
                          <span>Feature</span>
                          <span className="text-right">Limit</span>
                          <span className="text-right">Current</span>
                          <span className="text-right">Addons</span>
                        </div>
                        <div className="divide-y divide-slate-900/40 bg-[#12182b]/20">
                          {[
                            { name: "Agents", limit: "10", cur: "4", add: "-" },
                            { name: "Campaigns", limit: "50", cur: "12", add: "+5" },
                            { name: "Workflows", limit: "20", cur: "8", add: "-" },
                          ].map((row) => (
                            <div key={row.name} className="grid grid-cols-4 px-2.5 py-1.5 text-slate-400">
                              <span className="font-medium text-slate-300">{row.name}</span>
                              <span className="text-right">{row.limit}</span>
                              <span className="text-right">{row.cur}</span>
                              <span className="text-right">{row.add}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-center font-semibold rounded-lg transition-colors text-[11px] shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                      View Details
                    </button>
                  </div>

                  {/* Bottom Row (All col-span-4) */}
                  <div className="col-span-12 lg:col-span-4 bg-[#0d1222]/40 border border-slate-900/60 rounded-xl p-3 flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-300">Contact Source Distribution</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border border-slate-900 bg-[#12182b]/40 px-2 py-0.5 rounded-md">
                      <span>All</span>
                      <ChevronDown className="h-2.5 w-2.5" />
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 bg-[#0d1222]/40 border border-slate-900/60 rounded-xl p-3 flex flex-col justify-center">
                    <span className="font-bold text-[11px] text-slate-300">Lead Analytics</span>
                    <span className="text-[9px] text-slate-500 mt-0.5">Check effectiveness of your ads</span>
                  </div>
                  <div className="col-span-12 lg:col-span-4 bg-[#0d1222]/40 border border-slate-900/60 rounded-xl p-3 flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-300">Leads</span>
                    <span className="text-[10px] text-slate-600 font-mono">Real-time Feed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          PORTED SECTIONS FROM WACRM.TECH
         ========================================== */}
      <FeaturesGrid />

      <FeatureSpotlight
        anchorId="inbox"
        eyebrow="Shared inbox"
        title="Never drop a WhatsApp conversation again"
        body="Your whole team works from one inbox. Conversations can be assigned, tagged, and handed off without losing context. Real-time updates so two agents never reply to the same thread at the same time."
        bullets={[
          'Assign threads to specific agents or round-robin across the team',
          'Internal notes that only your team sees',
          'Unread indicators so urgent replies never slip through',
          'Deep-link into any conversation from the dashboard',
        ]}
        visual={<InboxMock />}
      />

      <HowItWorks />

      <FeatureSpotlight
        anchorId="automations"
        eyebrow="No-code automations"
        title="Automate the repetitive, focus on the humans"
        body="Build flows that react to WhatsApp events: welcome new contacts, chase unanswered replies, route leads by keyword. Conditions, waits, tags, deals — all with a visual builder that feels like Figma for workflows."
        bullets={[
          'Triggers for new messages, new contacts, tag changes, keywords, schedules',
          'Actions: send message / template, add tag, create deal, webhook, and more',
          'Conditional branches and wait steps for human-time delays',
          'Per-run logs so you always know what ran and why',
        ]}
        reverse
        visual={<AutomationMock />}
      />

      <FeatureSpotlight
        anchorId="pipelines"
        eyebrow="Sales pipelines"
        title="Turn conversations into revenue"
        body="Drag deals through custom stages, link them to contacts, and see exactly where revenue is getting stuck. Every deal keeps its WhatsApp thread one click away — so context never gets lost on a handoff."
        bullets={[
          'Unlimited pipelines and stages',
          'Kanban board with drag-and-drop',
          'Deal value totals per stage and pipeline-wide',
          'Linked contacts, conversations, and notes per deal',
        ]}
        visual={<PipelineMock />}
      />

      <FeatureSpotlight
        anchorId="analytics"
        eyebrow="Real-time analytics"
        title="See what is actually working"
        body="Response times, daily volume, pipeline value, and a cross-module activity feed. The dashboard tells you where attention is needed without you building a single chart."
        bullets={[
          'Active conversations, new contacts, open deal value — live',
          'Conversations over time for 7, 30, or 90 days',
          'Average first-response time by weekday against your target',
          'Activity feed merged across messages, deals, broadcasts, automations',
        ]}
        reverse
        visual={<AnalyticsMock />}
      />

      <FAQ />

      <CtaBanner />
    </div>
  );
}
