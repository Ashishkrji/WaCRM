"use client";

import Link from "next/link";
import {
  ArrowRight, MessageSquare, Users, Zap, BarChart3, ShieldCheck, Globe,
  CheckCircle2, GitBranch, LayoutDashboard, Workflow, HeartHandshake,
  Laptop, Lock, Server, Database, Star, ChevronDown, Building2,
  ShoppingCart, GraduationCap, Headphones, Store, Home, Radio,
  Webhook, Bell, Tag, UserCheck, Clock, Layers, Play,
  Mail, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";



// ─── DATA ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "5,000+", label: "Conversations Managed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "Multi", label: "Agent Support" },
  { value: "100%", label: "Data Ownership" },
];

const TECH_STACK = [
  "Meta WhatsApp API",
  "Next.js",
  "Supabase",
  "Docker",
  "Node.js",
  "TypeScript",
];

const FEATURES = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Shared Team Inbox",
    desc: "Bring your whole team onto one WhatsApp number. Assign chats, leave internal notes, and never miss a customer message again.",
  },
  {
    icon: <GitBranch className="h-6 w-6" />,
    title: "Visual Sales Pipelines",
    desc: "Drag-and-drop Kanban boards to track every deal. See revenue potential at each stage and forecast with confidence.",
  },
  {
    icon: <Radio className="h-6 w-6" />,
    title: "Broadcast Campaigns",
    desc: "Send personalized WhatsApp messages to thousands instantly. Track read receipts, delivery rates, and click-through.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "No-Code Automations",
    desc: "Automate welcome messages, follow-ups, and complex multi-step workflows — zero engineering required.",
  },
  {
    icon: <Workflow className="h-6 w-6" />,
    title: "Interactive Flows",
    desc: "Build rich conversational experiences with WhatsApp Flows. Collect orders, book appointments, run surveys natively.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Live Analytics",
    desc: "Track response times, conversion rates, and team performance with beautiful real-time dashboards.",
  },
  {
    icon: <Tag className="h-6 w-6" />,
    title: "Custom Tags & Labels",
    desc: "Segment contacts by product interest, source, or any custom attribute. Power your targeted campaigns.",
  },
  {
    icon: <UserCheck className="h-6 w-6" />,
    title: "Role-Based Access",
    desc: "Assign Agents, Supervisors, and Admins. Control who can read, write, or manage every section of the CRM.",
  },
  {
    icon: <Webhook className="h-6 w-6" />,
    title: "Webhooks & API",
    desc: "Connect your existing stack via REST API or webhooks. Send data in and out in real-time.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect WhatsApp",
    desc: "Link your WhatsApp Business API account in minutes. Scan a QR or paste your API credentials — you're live.",
    icon: <MessageSquare className="h-6 w-6" />,
  },
  {
    step: "02",
    title: "Import Team & Contacts",
    desc: "Add agents, set permissions, and bulk-import your customer list via CSV or API integration.",
    icon: <Users className="h-6 w-6" />,
  },
  {
    step: "03",
    title: "Start Closing Deals",
    desc: "Handle conversations, trigger automations, launch broadcasts, and watch your pipeline fill up.",
    icon: <BarChart3 className="h-6 w-6" />,
  },
];

const WORKFLOW_STEPS = [
  { label: "New Lead", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  { label: "Assign Agent", color: "text-violet-400 border-violet-400/30 bg-violet-400/10" },
  { label: "Send Welcome", color: "text-primary border-primary/30 bg-primary/10" },
  { label: "Follow-up", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  { label: "Move Pipeline", color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" },
  { label: "Close Deal 🎉", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
];

const USE_CASES = [
  {
    icon: <Home className="h-6 w-6" />,
    title: "Real Estate",
    desc: "Manage property inquiries, assign agents to hot leads, and automate follow-ups for site visits.",
    tags: ["Lead Nurturing", "Follow-ups", "Site Visits"],
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: "Ecommerce",
    desc: "Send order updates, abandoned cart reminders, and loyalty offers at scale via WhatsApp.",
    tags: ["Broadcasts", "Order Updates", "Retargeting"],
  },
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Agencies",
    desc: "Manage multiple client WhatsApp numbers and campaigns from a single workspace.",
    tags: ["Multi-number", "Campaigns", "Reporting"],
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Coaching & Education",
    desc: "Collect leads from ads, enroll students, send class reminders, and collect fees — all on WhatsApp.",
    tags: ["Enrollment", "Reminders", "Automation"],
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: "Customer Support",
    desc: "Route tickets to the right agent instantly. Reduce response time and increase CSAT scores.",
    tags: ["Routing", "SLA Tracking", "Team Inbox"],
  },
  {
    icon: <Store className="h-6 w-6" />,
    title: "Local Businesses",
    desc: "Take bookings, send daily specials, collect reviews, and build loyal customer relationships.",
    tags: ["Bookings", "Promotions", "Reviews"],
  },
];

const INTEGRATIONS = [
  { name: "WhatsApp API", emoji: "💬", desc: "Official Meta WABA", status: "live" },
  { name: "OpenAI (ChatGPT)", emoji: "🧠", desc: "AI Chatbots & Auto-replies", status: "live" },
  { name: "Salesforce", emoji: "☁️", desc: "Enterprise CRM Sync", status: "live" },
  { name: "HubSpot", emoji: "🦊", desc: "Lead & Contact Sync", status: "live" },
  { name: "Google Sheets", emoji: "📊", desc: "Export & sync data", status: "live" },
  { name: "Notion", emoji: "📓", desc: "Save chats & deals", status: "live" },
  { name: "Facebook Ads", emoji: "📢", desc: "Trigger on Lead Forms", status: "live" },
  { name: "Instagram", emoji: "📸", desc: "Unified Inbox for DMs", status: "live" },
  { name: "Shopify", emoji: "🛍️", desc: "Ecommerce automation", status: "live" },
  { name: "WooCommerce", emoji: "🛒", desc: "Order alerts & carts", status: "live" },
  { name: "Stripe", emoji: "💳", desc: "In-chat payment links", status: "live" },
  { name: "Razorpay", emoji: "₹", desc: "Indian payment gateway", status: "live" },
  { name: "Zendesk", emoji: "🎧", desc: "Support ticket routing", status: "live" },
  { name: "Mailchimp", emoji: "🐵", desc: "Newsletter sync", status: "live" },
  { name: "Zapier", emoji: "⚡", desc: "5000+ app connections", status: "live" },
  { name: "Make", emoji: "⚙️", desc: "Advanced workflows", status: "live" },
  { name: "Webhook API", emoji: "🔗", desc: "Custom integrations", status: "live" },
];

const SECURITY = [
  { icon: <Server className="h-5 w-5" />, title: "Self-Hosted", desc: "Deploy on your own server. AWS, DigitalOcean, or bare metal." },
  { icon: <Database className="h-5 w-5" />, title: "Data Ownership", desc: "Your data never leaves your infrastructure. Zero vendor lock-in." },
  { icon: <Lock className="h-5 w-5" />, title: "End-to-End Encryption", desc: "API keys, tokens, and sensitive data are AES-256 encrypted at rest." },
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Docker Ready", desc: "One-command deployment with Docker Compose. Up in under 5 minutes." },
  { icon: <UserCheck className="h-5 w-5" />, title: "Role-Based Access", desc: "Granular permissions per user. Control access to every feature." },
  { icon: <Clock className="h-5 w-5" />, title: "Audit Logs", desc: "Full activity log for compliance, debugging, and team accountability." },
];

const TESTIMONIALS = [
  {
    quote: "WaCRM reduced our WhatsApp response time by 70%. Our sales team closes deals 3x faster now.",
    author: "Rahul Sharma",
    role: "Sales Head, PropTech Startup",
    rating: 5,
  },
  {
    quote: "Finally a CRM built for WhatsApp, not bolted onto it. The pipeline view alone is worth the switch.",
    author: "Priya Mehta",
    role: "Founder, Digital Agency",
    rating: 5,
  },
  {
    quote: "We broadcast to 10,000+ customers weekly. The analytics help us improve every campaign.",
    author: "Amit Joshi",
    role: "Marketing Manager, D2C Brand",
    rating: 5,
  },
];



const FAQS = [
  {
    q: "Is this the official WhatsApp Business API?",
    a: "Yes. WaCRM integrates with the official Meta WhatsApp Business API (WABA). You'll need a verified Meta Business Manager account and a WABA phone number to connect.",
  },
  {
    q: "Can I self-host WaCRM on my own server?",
    a: "Absolutely. WaCRM is designed to be fully self-hosted. Deploy it on any VPS, AWS, DigitalOcean, or your own hardware using our Docker setup. Your data stays on your infrastructure.",
  },
  {
    q: "Does it support multiple agents replying from one number?",
    a: "Yes — that's one of the core features. Multiple agents can see, claim, and respond to conversations simultaneously. Admins can assign chats manually or use auto-assignment rules.",
  },
  {
    q: "Can I send bulk WhatsApp broadcasts?",
    a: "Yes. You can create targeted campaigns and send personalized broadcasts to thousands of contacts at once. Built-in analytics show delivery, read, and reply rates.",
  },
  {
    q: "Is my customer data secure?",
    a: "Completely. Since WaCRM is self-hosted, your data never leaves your own server. API keys and tokens are AES-256 encrypted. You have full control over backups and access.",
  },
  {
    q: "Can I connect WaCRM to other tools?",
    a: "Yes. WaCRM exposes a REST API and supports outbound webhooks, so you can integrate with Zapier, Google Sheets, Slack, your CRM, or any custom system.",
  },
];

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white selection:bg-primary/30">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#020617]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight">WaCRM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Use Cases", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-sm shadow-primary/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-24 pb-40 lg:pt-36 lg:pb-52">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-[-100px] w-[900px] h-[600px] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute left-10 bottom-0 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute right-10 top-32 w-[300px] h-[200px] bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge variant="outline" className="mb-8 py-1.5 px-4 bg-primary/5 text-primary border-primary/20 inline-flex items-center">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
              The Complete WhatsApp Business CRM
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[1.05]">
              Manage WhatsApp Sales{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-green-300 to-primary">
                Like a Pro.
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Self-hostable CRM built for WhatsApp. Shared inbox, visual pipelines, automated broadcasts, and no-code workflows — all from one powerful dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-200">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10">
                  <Play className="mr-2 h-4 w-4 fill-primary text-primary" />
                  Book Live Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5 backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-white">{s.value}</span>
                  <span className="text-sm text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Dashboard mockup */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10 pointer-events-none bottom-0 top-1/2" />
              <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A] shadow-2xl shadow-black/50 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#0a1628] border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="h-5 w-48 bg-white/5 rounded border border-white/[0.06] text-xs text-slate-500 flex items-center justify-center">
                      crm.yourcompany.com/dashboard
                    </div>
                  </div>
                </div>
                {/* App shell */}
                <div className="flex h-72 md:h-96 relative overflow-hidden bg-[#0a1628]">
                  <img src="/assets/images/hero_dashboard_1779613750221.png" alt="WaCRM Dashboard Preview" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Bar ── */}
        <section className="py-10 border-y border-white/[0.06] bg-[#0a1628]/50">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
              Built on trusted technology
            </p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {TECH_STACK.map((tech) => (
                <span key={tech} className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-default">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Businesses Need WhatsApp CRM ── */}
        <section id="why-wacrm" className="py-28 relative bg-[#0a1628]/40 border-y border-white/[0.06] overflow-hidden">
          <div className="absolute left-0 top-0 w-full h-full bg-[linear-gradient(to_bottom,transparent,#020617_100%)] pointer-events-none opacity-50" />
          <div className="absolute right-10 top-10 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20 max-w-4xl mx-auto">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Business Growth Solution</Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Why Every Modern Business Needs a WhatsApp CRM</h2>
              <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
                Manage customer conversations, automate follow-ups, organize leads, and scale sales operations from a single WhatsApp CRM dashboard.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side: Long form content & Benefits */}
              <div className="space-y-8">
                <div className="space-y-6 text-slate-300 text-lg leading-relaxed">
                  <p>
                    WhatsApp CRM has become an essential tool for businesses that handle customer communication, sales inquiries, support requests, and lead follow-ups through WhatsApp. Businesses like Real Estate agencies, Coaching Institutes, Ecommerce stores, Digital Marketing Agencies, Clinics, Travel Agencies, Insurance Advisors, Customer Support teams, and Local Businesses use WhatsApp daily to connect with customers. As conversations grow, managing everything manually becomes difficult, leads get missed, and team coordination starts failing.
                  </p>
                  <p>
                    A WhatsApp CRM solves this problem by centralizing all customer conversations into one powerful dashboard. Businesses can assign chats to team members, organize leads using pipelines, automate replies and follow-ups, track customer history, and improve response speed. This helps companies increase conversions, improve customer satisfaction, and scale communication without chaos.
                  </p>
                  <p>
                    Ecommerce brands can automate order updates and abandoned cart recovery. Coaching institutes can manage student inquiries and admission follow-ups. Real Estate companies can track property leads and automate visit reminders. Agencies and support teams can allow multiple agents to manage one WhatsApp number professionally from a shared inbox.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                  <div className="p-4 bg-[#0F172A] border border-white/[0.06] rounded-xl hover:border-primary/30 transition-colors col-span-2">
                     <h4 className="text-3xl font-bold text-primary mb-1">70%</h4>
                     <p className="text-sm text-slate-400">Faster Response Time</p>
                  </div>
                  <div className="p-4 bg-[#0F172A] border border-white/[0.06] rounded-xl hover:border-primary/30 transition-colors col-span-2">
                     <h4 className="text-3xl font-bold text-primary mb-1">3X</h4>
                     <p className="text-sm text-slate-400">Better Lead Management</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Industry Use Cases */}
              <div className="space-y-4">
                {[
                  { industry: "Real Estate", usage: "Track property leads, automate site visit follow-ups, manage buyer conversations", icon: <Home className="h-5 w-5 text-blue-400" /> },
                  { industry: "Ecommerce", usage: "Order updates, abandoned cart recovery, customer support, promotions", icon: <ShoppingCart className="h-5 w-5 text-emerald-400" /> },
                  { industry: "Coaching Institutes", usage: "Student inquiries, admissions, fee reminders, notifications", icon: <GraduationCap className="h-5 w-5 text-violet-400" /> },
                  { industry: "Digital Marketing Agencies", usage: "Lead management, client communication, campaign follow-ups", icon: <BarChart3 className="h-5 w-5 text-amber-400" /> },
                  { industry: "Customer Support Teams", usage: "Shared inbox, faster response handling, support ticket communication", icon: <Headphones className="h-5 w-5 text-cyan-400" /> },
                  { industry: "Local Businesses", usage: "Customer engagement, booking confirmations, sales communication", icon: <Store className="h-5 w-5 text-rose-400" /> }
                ].map((item) => (
                  <div key={item.industry} className="group p-5 bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.06] rounded-xl hover:border-primary/40 hover:bg-[#0F172A] transition-all duration-300 shadow-lg hover:shadow-primary/10 flex items-start gap-4 cursor-default relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="p-3 bg-white/[0.04] rounded-lg border border-white/[0.08] shrink-0 group-hover:scale-110 transition-transform">
                        {item.icon}
                     </div>
                     <div>
                        <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">{item.industry}</h4>
                        <p className="text-sm text-slate-400">{item.usage}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-16 text-center">
                <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-[#0F172A]/50 p-2 rounded-2xl border border-white/[0.08] backdrop-blur-sm">
                    <Link href="/signup">
                        <Button size="lg" className="h-12 px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-200">Start Free Trial</Button>
                    </Link>
                    <Link href="/login">
                        <Button size="lg" variant="ghost" className="h-12 px-8 text-slate-300 hover:text-white">Book Live Demo</Button>
                    </Link>
                </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-28 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Features</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Every tool your WhatsApp sales team needs</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                WaCRM isn&apos;t a generic CRM with WhatsApp bolted on. It&apos;s built from the ground up around how WhatsApp sales actually work.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group p-7 bg-[#0F172A] border border-white/[0.06] rounded-2xl hover:border-primary/30 hover:bg-[#0F172A]/80 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col overflow-hidden relative"
                >
                  <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-5 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 relative z-10">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 relative z-10">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">{f.desc}</p>
                  
                  {/* Dynamic image snippets for specific features */}
                  {f.title === "Shared Team Inbox" && (
                     <div className="mt-auto -mx-7 -mb-7 pt-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent z-10 pointer-events-none" />
                        <img src="/assets/images/whatsapp_inbox_1779613801648.png" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Inbox UI" />
                     </div>
                  )}
                  {f.title === "Visual Sales Pipelines" && (
                     <div className="mt-auto -mx-7 -mb-7 pt-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent z-10 pointer-events-none" />
                        <img src="/assets/images/sales_pipeline_1779614053062.png" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Pipeline UI" />
                     </div>
                  )}
                  {f.title === "Live Analytics" && (
                     <div className="mt-auto -mx-7 -mb-7 pt-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent z-10 pointer-events-none" />
                        <img src="/assets/images/crm_analytics_1779613782716.png" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Analytics UI" />
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section id="how-it-works" className="py-28 bg-[#0a1628]/40 border-y border-white/[0.06]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">How it Works</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Up and running in minutes</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">Three simple steps to transform WhatsApp into your most powerful sales channel.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
              <div className="absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block" />
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="relative text-center flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-[#0F172A] border border-white/[0.08] flex items-center justify-center text-primary shadow-xl shadow-black/30 mx-auto">
                      {step.icon}
                    </div>
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Automation Workflow ── */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Automation</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Sales on autopilot</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-16">
              Build complex automation workflows without a single line of code. Every step triggers automatically based on customer actions.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto mb-16">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`px-5 py-3 rounded-xl border font-semibold text-sm ${step.color} backdrop-blur-sm shadow-lg`}>
                    {step.label}
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-slate-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Workflow Image */}
            <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]">
               <img src="/assets/images/automation_workflow_1779614031181.png" alt="Automation Workflow" className="w-full h-auto object-cover" />
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-slate-500">This entire flow runs automatically, 24/7, without any manual effort.</p>
              <Link href="/signup">
                <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                  Build your first workflow <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Use Cases ── */}
        <section id="use-cases" className="py-28 bg-[#0a1628]/40 border-y border-white/[0.06]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Use Cases</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for every industry</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">Businesses of all shapes and sizes use WaCRM to win more customers on WhatsApp.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {USE_CASES.map((uc) => (
                <div key={uc.title} className="group p-7 bg-[#0F172A] border border-white/[0.06] rounded-2xl hover:border-primary/30 transition-all duration-300">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-5 group-hover:scale-105 transition-transform">
                    {uc.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{uc.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-5">{uc.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {uc.tags.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/[0.06] text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Integrations ── */}
        <section id="integrations" className="py-28 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Integrations</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Connect your stack</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">WaCRM works with the tools your team already uses.</p>
            </div>
            <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] mb-16">
               <img src="/assets/images/integration_logos_1779614157496.png" alt="WaCRM Integrations" className="w-full h-auto object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {INTEGRATIONS.map((integration) => (
                <div key={integration.name} className="group p-6 bg-[#0F172A] border border-white/[0.06] rounded-2xl hover:border-primary/30 transition-all duration-300 flex items-center gap-4">
                  <span className="text-3xl">{integration.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm truncate">{integration.name}</h4>
                      {integration.status === "soon" && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{integration.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security ── */}
        <section id="security" className="py-28 bg-[#0a1628]/40 border-y border-white/[0.06] relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div>
                <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Security & Privacy</Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Your data. Your server. Your control.</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Unlike SaaS CRMs that store your customer data on their servers, WaCRM is fully self-hosted. Your sensitive business data never touches our infrastructure.
                </p>
                <Link href="/signup">
                  <Button className="shadow-lg shadow-primary/20 mb-8">
                    Deploy Securely <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] mt-6 max-w-md mx-auto lg:mx-0 shadow-2xl">
                  <img src="/assets/images/security_visual_1779614097435.png" alt="Self-Hosted Server Security" className="w-full h-auto object-cover" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {SECURITY.map((item) => (
                  <div key={item.title} className="p-5 bg-[#0F172A] border border-white/[0.06] rounded-xl hover:border-primary/20 transition-colors">
                    <div className="text-primary mb-3">{item.icon}</div>
                    <h4 className="font-semibold mb-1.5 text-sm">{item.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-28 relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[300px] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">Testimonials</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by sales teams</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">See what businesses are saying after switching to WaCRM.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TESTIMONIALS.map((t) => (
                <div key={t.author} className="p-7 bg-[#0F172A]/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl flex flex-col hover:border-primary/20 transition-all">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.author}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ── FAQ ── */}
        <section id="faq" className="py-28 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-5 border-primary/20 text-primary bg-primary/5">FAQ</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Got questions?</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">Everything you need to know before getting started.</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {FAQS.map((faq, i) => (
                <details key={i} className="group bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <span className="font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                  </summary>
                  <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-32 relative overflow-hidden border-t border-white/[0.06]">
          <img src="/assets/images/cta_bg_1779614140915.png" className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none mix-blend-screen" alt="" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/15 blur-[130px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
              Ready to scale your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-300">
                WhatsApp sales?
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of businesses managing their sales and support efficiently with WaCRM. Set up in minutes, self-hosted forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-base shadow-2xl shadow-primary/25 hover:scale-105 transition-transform duration-200 relative">
                  <span className="absolute inset-0 rounded-lg bg-primary/20 blur animate-pulse" />
                  <span className="relative">Get Started Free</span>
                  <ArrowRight className="relative ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base border-white/10 bg-white/5 hover:bg-white/10">
                  Book a Live Demo
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Open Source</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Self Hostable</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Free to Start</span>
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="py-24 border-t border-white/[0.06] bg-[#020617] relative overflow-hidden">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="bg-gradient-to-br from-[#0F172A] to-[#020617] border border-white/[0.08] rounded-3xl p-10 md:p-16 lg:p-20 overflow-hidden relative shadow-2xl max-w-6xl mx-auto">
              {/* Corner Glows */}
              <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 relative z-10">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                    <Mail className="h-4 w-4" /> Weekly Digest
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-[1.15]">
                    Scale your WhatsApp <br className="hidden lg:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">
                      sales strategy.
                    </span>
                  </h2>
                  <p className="text-slate-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Join 5,000+ businesses receiving our latest tips, automation templates, and product updates every Tuesday.
                  </p>
                </div>
                
                <div className="w-full lg:w-[420px] shrink-0">
                  <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="email"
                        placeholder="Enter your work email"
                        className="w-full bg-[#020617]/60 border border-white/10 rounded-xl pl-12 pr-5 py-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-slate-500 backdrop-blur-md"
                        required
                      />
                    </div>
                    <Button size="lg" className="w-full rounded-xl shadow-lg shadow-primary/25 h-auto py-4 text-base group overflow-hidden relative">
                      <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center justify-center">
                        Subscribe Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </form>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No spam</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Unsubscribe anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Minimal Footer ── */}
      <footer className="bg-[#020617] border-t border-white/[0.06] py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} WaCRM. All rights reserved.</p>
          <span className="flex items-center gap-1.5">
            Made with <span className="text-red-500">❤️</span> for WhatsApp Teams
          </span>
        </div>
      </footer>
    </div>
  );
}
