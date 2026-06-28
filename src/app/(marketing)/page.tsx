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

// --- DATA ---

const STATS = [
  { value: "10,000+", label: "Active Users" },
  { value: "50M+", label: "Messages Sent" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "24/7", label: "Support Availability" },
];

const CAPABILITIES = [
  { title: "Bulk Broadcasts", desc: "Send personalized campaigns to your entire opted-in list with 0% message markup." },
  { title: "Interactive Messages", desc: "Use WhatsApp buttons, list menus, and call-to-action links to boost engagement." },
  { title: "Dynamic Variables", desc: "Personalize every message with customer names, order IDs, or custom attributes." },
  { title: "Advanced Routing", desc: "Automatically assign conversations to agents based on load, department, or tags." },
  { title: "Custom Fields", desc: "Store custom customer data and segment your audience for targeted marketing." },
  { title: "Role-Based Access", desc: "Define granular permissions for agents, supervisors, and system administrators." },
  { title: "Analytics & Reports", desc: "Track response times, resolution rates, and team performance in real-time." },
  { title: "Smart Delays", desc: "Add natural pauses in automation sequences to mimic human conversation." },
  { title: "Multi-Language Support", desc: "Configure your chatbots and automated replies in multiple local languages." },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect & Verify",
    desc: "We link your phone number to the official WhatsApp Business Cloud API and assist with Meta Business Manager verification.",
  },
  {
    step: "02",
    title: "Build & Integrate",
    desc: "We design your custom chatbot, configure automated drip workflows, and connect Shopify, Razorpay, or your CRM.",
  },
  {
    step: "03",
    title: "Launch & Optimize",
    desc: "We train your team, launch your campaigns, and optimize performance based on real-time analytics and feedback.",
  },
];

const WABA_CARDS = [
  {
    title: "0% Message Markup",
    desc: "Pay Meta's official conversation rates directly. We charge absolutely zero markup fees on your messages, saving you up to 50% compared to other providers.",
  },
  {
    title: "Green Tick Verification",
    desc: "Build trust with a verified green badge next to your business name. Our team assists with the official Meta application process.",
  },
  {
    title: "Official API Safety",
    desc: "Broadcast campaigns securely without getting banned. The official Cloud API ensures full compliance with WhatsApp's spam and messaging policies.",
  },
  {
    title: "Multi-Device Support",
    desc: "Scale your customer service. Have 10, 50, or 100+ agents handling chats simultaneously from a single WhatsApp number.",
  },
];

const TESTIMONIALS = [
  {
    quote: "MJChatSyncs reduced our WhatsApp response time by 70%. The AI chatbot handles 80% of our FAQs, allowing our sales team to focus on high-value deals.",
    author: "Rahul Sharma",
    role: "Director of Sales, PropTech Group",
  },
  {
    quote: "Finally a CRM built for WhatsApp, not bolted onto it. The visual flow builder and Shopify integration alone have recovered 20% of our abandoned carts.",
    author: "Priya Mehta",
    role: "Founder, D2C Apparel Brand",
  },
  {
    quote: "We send broadcasts to over 25,000 customers weekly. The analytics dashboard helps us optimize our campaigns and track ROI down to the rupee.",
    author: "Amit Joshi",
    role: "Marketing Head, EdTech Platform",
  },
];

const FAQS = [
  {
    q: "What is MJChatSyncs?",
    a: "MJChatSyncs is a self-hostable, enterprise-grade AI WhatsApp CRM and automation platform. It allows businesses to manage shared team inboxes, launch broadcast campaigns, build no-code chatbots, and integrate custom AI agents trained on their business data.",
  },
  {
    q: "Do I need a developer to set it up?",
    a: "No! You can connect your official Meta WhatsApp Business API in minutes using our guided onboarding. For self-hosting, we provide a one-line Docker Compose setup that takes less than 5 minutes.",
  },
  {
    q: "How does the AI Assistant work?",
    a: "Unlike basic keyword bots, MJChatSyncs's AI uses RAG (Retrieval-Augmented Generation) powered by MongoDB Atlas. You can upload PDFs, paste website links, or write FAQs, and the AI will understand the context and answer customer queries in natural language.",
  },
  {
    q: "Are there any hidden markups on WhatsApp messages?",
    a: "No. MJChatSyncs offers 0% message markup. You pay Meta directly for your conversation charges via your own Meta Business Manager. This saves you up to 50% compared to other SaaS providers who charge per-message markups.",
  },
  {
    q: "Can I migrate from platforms like Wati, AiSensy, or Interakt?",
    a: "Yes. You can easily migrate your WhatsApp number to MJChatSyncs. Since it uses the official Meta Cloud API, your number remains active, and you can import all your contacts and templates via CSV.",
  },
  {
    q: "What integrations are supported?",
    a: "We support Shopify, Razorpay, Zapier, Make, and custom REST APIs/Webhooks. You can trigger WhatsApp notifications when an order is placed, a payment fails, or a lead form is submitted.",
  },
];

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="space-y-24 pb-20 overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-white">
      
      {/* ==========================================
          1. HERO SECTION
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
          More Leads. Faster Follow-Up. <span className="text-blue-500">More Revenue.</span>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#12182b]/60 border border-slate-900/40 p-3 rounded-lg space-y-1">
                        <span className="text-[10px] text-slate-500 font-medium">Total Sent</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-white">44</span>
                          <span className="text-[10px] font-medium text-red-500">-5%</span>
                        </div>
                        <span className="text-[8px] text-slate-600 block">Current Year</span>
                      </div>
                      <div className="bg-[#12182b]/60 border border-slate-900/40 p-3 rounded-lg space-y-1">
                        <span className="text-[10px] text-slate-500 font-medium">Total Received</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-white">48</span>
                          <span className="text-[10px] font-medium text-emerald-500">+5%</span>
                        </div>
                        <span className="text-[8px] text-slate-600 block">Current Year</span>
                      </div>
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
          2. FEATURES SECTION
         ========================================== */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Features Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Features</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white">
            See the tools that drive <span className="text-blue-500">real results</span>
          </h3>
          <p className="text-slate-450 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            We build your WhatsApp channel, so you can focus on scaling your business.
          </p>
        </div>

        {/* Staggered Features List */}
        <div className="space-y-24">
          
          {/* Feature 1: Shared Inbox */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 text-left">
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">Shared Inbox</span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">The Ultimate Shared Team Inbox</h4>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Connect your team to a single WhatsApp number. Automatically assign incoming chats to agents, leave internal notes, tag conversations, and collaborate without stepping on each other's toes.
              </p>
            </div>
            {/* Inbox Mockup */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 shadow-xl aspect-[4/3] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-300">Active Conversations</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 pt-3 overflow-hidden">
                {/* Chat List */}
                <div className="border-r border-slate-900/80 pr-2 space-y-2 text-left">
                  {[
                    { name: "Ashish K.", msg: "Need quote for setup", time: "2m", active: true },
                    { name: "Priya M.", msg: "Order confirmed", time: "10m", active: false },
                    { name: "Amit J.", msg: "Webinar link?", time: "1h", active: false },
                  ].map((chat, idx) => (
                    <div key={idx} className={cn("p-2 rounded-lg text-xs space-y-0.5 cursor-pointer", chat.active ? "bg-blue-600/10 border border-blue-500/20" : "bg-slate-900/20")}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{chat.name}</span>
                        <span className="text-[9px] text-slate-600">{chat.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{chat.msg}</p>
                    </div>
                  ))}
                </div>
                {/* Active Chat Window */}
                <div className="col-span-2 flex flex-col justify-between h-full text-left">
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-900 text-[11px] text-slate-400 max-w-[90%]">
                      Hello! I want to integrate the WhatsApp API with my Shopify store. Can you share the pricing?
                    </div>
                    <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/10 text-[11px] text-slate-300 max-w-[90%] ml-auto text-right">
                      Sure! Our setup is flat ₹2,999/month. Would you like to schedule a quick onboarding call?
                    </div>
                  </div>
                  {/* Quick Replies bar */}
                  <div className="border-t border-slate-900 pt-3 flex gap-1">
                    <button className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-md">Send Pricing PDF 📄</button>
                    <button className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-md">Book Onboarding 📅</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Campaign Analytics */}
          <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="space-y-5 text-left md:order-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">Broadcasts</span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">Real-Time Campaign Analytics</h4>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Blast bulk campaigns to thousands of users securely. Monitor delivery rates, read receipts, and link clicks instantly. Optimize your message templates based on actual conversion data.
              </p>
            </div>
            {/* Analytics Mockup */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-xl aspect-[4/3] flex flex-col justify-between text-left md:order-1">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">Active Campaign</span>
                <h5 className="text-base font-bold text-white">Festival Offer Broadcast</h5>
              </div>
              {/* Campaign Stats */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { label: "Sent", val: "10k", color: "text-blue-400" },
                  { label: "Delivered", val: "99.2%", color: "text-cyan-400" },
                  { label: "Read", val: "84.5%", color: "text-emerald-400" },
                  { label: "Clicks", val: "12.8%", color: "text-purple-400" },
                ].map((stat, i) => (
                  <div key={i} className="border border-slate-900 bg-slate-900/20 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] text-slate-600 block">{stat.label}</span>
                    <span className={`text-sm sm:text-base font-bold ${stat.color}`}>{stat.val}</span>
                  </div>
                ))}
              </div>
              {/* Pie Chart / Progress */}
              <div className="flex-1 flex items-center justify-between pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-400">Delivered & Read (8,450)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-400">Delivered & Unread (1,470)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-slate-400">Failed (80)</span>
                  </div>
                </div>
                {/* SVG Circular Progress */}
                <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                    <path className="text-slate-900" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-emerald-500" strokeDasharray="85, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="absolute text-xs font-bold text-white">84.5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Drip Campaigns */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 text-left">
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">Automation</span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">No-Code Automated Drip Campaigns</h4>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Nurture leads and drive recurring sales. Schedule automated message sequences (drips) based on triggers like order placement, cart abandonment, or custom signup events.
              </p>
            </div>
            {/* Drip Mockup */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-xl aspect-[4/3] flex flex-col justify-between text-left">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs font-bold text-slate-300">Customer Drip Sequence</span>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
              {/* Timeline */}
              <div className="flex-1 flex flex-col justify-between pt-4 relative">
                {/* Vertical Line */}
                <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-slate-900" />
                {[
                  { delay: "Immediate", label: "Send Welcome Template", desc: "Interactive button: 'Get Started'" },
                  { delay: "After 2 Days", label: "Send Resource PDF", desc: "Delivers 'Ultimate Automation Guide.pdf'" },
                  { delay: "After 5 Days", label: "Send Discount Offer", desc: "10% coupon code to close the sale" },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start pl-3 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-blue-600/10 border border-blue-500 text-[10px] font-bold text-blue-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{step.label}</span>
                        <span className="text-[9px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{step.delay}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 4: Chatbot Builder */}
          <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="space-y-5 text-left md:order-2">
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">Visual Builder</span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">Enterprise-Grade Chatbot Builder</h4>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Design advanced WhatsApp conversational flows without coding. Our drag-and-drop flow builder lets you build welcome menus, lead capture sequences, and conditional decision routing.
              </p>
            </div>
            {/* Flow Builder Mockup */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-xl aspect-[4/3] flex flex-col justify-between text-left md:order-1 overflow-hidden relative">
              {/* Dot Grid Background */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 relative z-10">
                <span className="text-xs font-bold text-slate-300">Flow: Lead Capture Bot</span>
                <span className="text-[10px] text-slate-500 font-mono">v1.2 Draft</span>
              </div>

              {/* Visual Flow Nodes */}
              <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4 relative z-10">
                {/* Trigger Node */}
                <div className="border border-blue-500/30 bg-blue-950/25 p-3 rounded-xl w-48 text-center space-y-1">
                  <span className="text-[9px] text-blue-400 uppercase font-semibold">Trigger</span>
                  <p className="text-xs font-bold text-slate-200">Keyword: 'START'</p>
                </div>
                {/* Connector Line */}
                <div className="w-0.5 h-6 bg-slate-800 relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
                {/* Message Node */}
                <div className="border border-slate-800 bg-slate-900/40 p-3 rounded-xl w-56 text-center space-y-1 relative">
                  <span className="text-[9px] text-purple-400 uppercase font-semibold">Send Message</span>
                  <p className="text-xs font-semibold text-slate-200">Welcome Menu Template</p>
                  <div className="flex gap-1 justify-center pt-1.5">
                    <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Option A</span>
                    <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Option B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: AI Knowledge Base */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 text-left">
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">AI & RAG</span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">Train AI on Your Own Knowledge Base</h4>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Transform your customer support. Upload PDFs, connect website links, or paste FAQs. Our RAG-powered AI learns your business details and responds to complex queries instantly.
              </p>
            </div>
            {/* AI Training Mockup */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-xl aspect-[4/3] flex flex-col justify-between text-left">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs font-bold text-slate-300">AI Training Center</span>
                <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1"><Sparkles className="h-3 w-3" /> RAG Enabled</span>
              </div>
              {/* Document List */}
              <div className="flex-1 pt-4 space-y-3.5">
                {[
                  { name: "refund_policy_v2.pdf", size: "1.2 MB", progress: 100, status: "Trained" },
                  { name: "product_catalog_2026.xlsx", size: "3.4 MB", progress: 100, status: "Trained" },
                  { name: "faq_documentation.docx", size: "840 KB", progress: 65, status: "Training..." },
                ].map((doc, i) => (
                  <div key={i} className="border border-slate-900 bg-slate-900/15 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{doc.name}</span>
                      <span className={cn("text-[10px]", doc.progress === 100 ? "text-emerald-400" : "text-blue-400 animate-pulse")}>
                        {doc.status}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${doc.progress}%` }}
                        className={cn("h-full rounded-full", doc.progress === 100 ? "bg-emerald-500" : "bg-blue-500")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 6: Integrations */}
          <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="space-y-5 text-left md:order-2">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">Integrations</span>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">No-Code Integrations & Webhooks</h4>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Connect MJChatSyncs to Shopify, Razorpay, Zapier, Make, or your custom ERP. Trigger instant WhatsApp notifications when an order is placed, a payment fails, or a lead form is submitted.
              </p>
            </div>
            {/* Integrations Mockup */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-xl aspect-[4/3] flex flex-col justify-between text-left md:order-1">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs font-bold text-slate-300">Connected Platforms</span>
                <span className="text-[10px] text-slate-500">3 Apps Live</span>
              </div>
              {/* Apps Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4 pt-4">
                {[
                  { name: "Shopify", desc: "Cart & Order updates", status: true },
                  { name: "Razorpay", desc: "Payment links & alerts", status: true },
                  { name: "HubSpot", desc: "CRM contact sync", status: false },
                  { name: "Zapier", desc: "5000+ app connections", status: true },
                ].map((app, i) => (
                  <div key={i} className="border border-slate-900 bg-slate-900/10 p-3 rounded-xl flex flex-col justify-between h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{app.name}</span>
                      {/* Custom Toggle Switch */}
                      <span className={cn("w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer", app.status ? "bg-blue-600" : "bg-slate-800")}>
                        <span className={cn("w-3 h-3 rounded-full bg-white block transition-transform", app.status ? "translate-x-3" : "translate-x-0")} />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{app.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          3. CAPABILITIES SECTION
         ========================================== */}
      <section className="bg-slate-900/10 border-y border-slate-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">
              Everything you need to <span className="text-blue-500">automate WhatsApp</span>
            </h3>
            <p className="text-slate-450 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Powering sales, marketing, and support operations in one unified platform.
            </p>
          </div>

          {/* 3x3 Capabilities Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {CAPABILITIES.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-5 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800 transition-colors group">
                <div className="shrink-0 p-2.5 h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          4. HOW IT WORKS SECTION
         ========================================== */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Process</h2>
          <h3 className="text-3xl font-bold text-white">How It Works</h3>
          <p className="text-slate-450 text-sm sm:text-base">Get started in 3 simple steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line for Desktop */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-900 -translate-y-1/2 hidden md:block -z-10" />

          {HOW_IT_WORKS.map((step, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-900 bg-slate-950 p-8 space-y-4 relative text-left">
              <span className="absolute -top-6 left-6 text-xs font-extrabold text-blue-500 bg-slate-950 border border-slate-900 px-3.5 py-2 rounded-full">
                {step.step}
              </span>
              <div className="pt-2 space-y-2">
                <h4 className="text-lg font-bold text-white">{step.title}</h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          5. OFFICIAL WHATSAPP API SECTION
         ========================================== */}
      <section className="bg-slate-900/10 border-y border-slate-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="md:col-span-5 space-y-6 text-left">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block">Official API</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Built on the official <br className="hidden lg:block" />
              <span className="text-blue-500">WhatsApp Business API</span>
            </h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We connect you directly to the official Meta Cloud API. No third-party relays, no message delays, and 100% compliance with WhatsApp's policies.
            </p>
            <div className="pt-2">
              <Link
                href="/book-demo"
                className="inline-flex items-center gap-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl shadow-md transition-all text-sm"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-6">
            {WABA_CARDS.map((card, idx) => (
              <div key={idx} className="border border-slate-900 bg-slate-950 p-6 rounded-2xl space-y-3 text-left hover:border-slate-800 transition-colors">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {card.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
          6. STATS SECTION
         ========================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Stats</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white">
            Trusted by <span className="text-blue-500">10,000+ businesses</span>
          </h3>
          <p className="text-slate-450 text-sm sm:text-base leading-relaxed">
            Helping brands automate customer communication and scale revenue.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {STATS.map((stat, idx) => (
            <div key={idx} className="border border-slate-900 bg-slate-900/10 p-6 rounded-2xl backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          7. TESTIMONIALS SECTION
         ========================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="border border-slate-900 bg-slate-900/10 p-6 rounded-2xl flex flex-col justify-between text-left hover:border-slate-850 transition-colors"
            >
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="mt-6 pt-4 border-t border-slate-900 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.author}</h4>
                  <p className="text-[10px] text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          8. FAQS SECTION
         ========================================== */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <HelpCircle className="h-8 w-8 text-blue-500 mx-auto" />
          <h3 className="text-3xl font-bold text-white">
            Still have <span className="text-blue-500">questions?</span>
          </h3>
          <p className="text-slate-450 text-xs sm:text-sm">Everything you need to know about MJChatSyncs.</p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-900 bg-slate-900/15 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-200 hover:text-white hover:bg-slate-900/30 transition-all"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
                </button>
                <div
                  className={`transition-all duration-200 ease-in-out ${
                    isOpen ? "max-h-60 border-t border-slate-900/50 p-5" : "max-h-0 overflow-hidden"
                  }`}
                >
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==========================================
          9. FINAL CTA SECTION
         ========================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 p-12 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 blur-[90px] rounded-full pointer-events-none -z-10" />

          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            More leads. Faster follow-up. <span className="text-blue-500">More revenue.</span>
          </h3>
          <p className="mt-4 text-slate-455 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Start with our DIY plan at ₹2,999/month, or let our experts manage your entire automation stack.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="w-full sm:w-auto text-center font-semibold text-white bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
            >
              Get Started
            </Link>
            <Link
              href="/book-demo"
              className="w-full sm:w-auto text-center font-medium text-slate-300 hover:text-white px-8 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 transition-all"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
