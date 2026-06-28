"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Zap,
  Globe,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  ShoppingCart,
  GraduationCap,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INCLUSIONS = [
  {
    icon: <Bot className="h-6 w-6 text-blue-500" />,
    title: "Custom AI Agent Setup",
    desc: "We train a custom AI chatbot using your PDFs, website links, and FAQs so it can answer complex queries instantly and accurately in your brand voice.",
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-emerald-500" />,
    title: "Chatbot Copywriting",
    desc: "Our copywriters design high-converting WhatsApp message scripts, interactive buttons, and lists to maximize click-through and engagement rates.",
  },
  {
    icon: <Zap className="h-6 w-6 text-purple-500" />,
    title: "Multi-Step Flow Design",
    desc: "We build advanced, branching conversational flows to collect leads, confirm orders, schedule appointments, and capture customer feedback natively.",
  },
  {
    icon: <Layers className="h-6 w-6 text-amber-500" />,
    title: "Tool Integrations",
    desc: "We connect WaCRM to your existing stack: Shopify, WooCommerce, Razorpay, Stripe, HubSpot, Google Sheets, or custom backend databases via webhooks.",
  },
  {
    icon: <Globe className="h-6 w-6 text-cyan-500" />,
    title: "WABA Setup & Verification",
    desc: "We handle the technical setup: Meta Business Manager verification, WhatsApp Business API number connection, and template approval submissions.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-pink-500" />,
    title: "Monthly Optimization",
    desc: "We analyze your interaction logs, update your AI's knowledge base with new FAQs, test new campaign ideas, and optimize flows to improve conversion rates.",
  },
];

const ONBOARDING_STEPS = [
  {
    day: "Days 1 - 3",
    title: "Onboarding & Connection",
    desc: "Kickoff strategy call to define goals. We set up your Meta Cloud API, verify your Business Manager, and connect your WhatsApp number.",
  },
  {
    day: "Days 4 - 7",
    title: "Scriptwriting & Flow Architecture",
    desc: "Our copywriters design your interactive buttons, welcome menus, and automated follow-up sequences. You review and approve the copy.",
  },
  {
    day: "Days 8 - 12",
    title: "AI Training & Integrations",
    desc: "We ingest your FAQs and documentation to train the AI. We configure integrations with your store (Shopify/Razorpay) and test data flows.",
  },
  {
    day: "Days 13 - 15",
    title: "Testing, Training & Launch",
    desc: "End-to-end testing of all flows. We train your team on how to use the Shared Team Inbox, and hit 'go' on your new WhatsApp system.",
  },
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"d2c" | "coaching">("d2c");

  return (
    <div className="space-y-24 py-12 md:py-20 px-4 max-w-7xl mx-auto overflow-x-hidden">
      {/* --- HERO --- */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400">
          Managed Services
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          We build. We optimize. <span className="text-blue-500">You close more sales.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Let our team of engineers, copywriters, and AI specialists handle your WhatsApp Business API onboarding, chatbot builds, and campaign management.
        </p>
        <div className="pt-4">
          <Link
            href="/book-demo"
            className="inline-flex items-center gap-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
          >
            Book a Strategy Call
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* --- WHAT WE DO --- */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">What's Included in Managed Services</h2>
          <p className="text-slate-400 text-xs sm:text-sm">End-to-end WhatsApp automation handled by specialists.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {INCLUSIONS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-4 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-200"
            >
              <div className="p-3 w-12 h-12 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-200">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- INDUSTRY USE CASES (TABS) --- */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Pre-built Industry Automations</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Tailored setups designed for your business model.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-900/60 p-1 border border-slate-850">
            <button
              type="button"
              onClick={() => setActiveTab("d2c")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all",
                activeTab === "d2c"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              D2C E-commerce
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("coaching")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all",
                activeTab === "coaching"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Coaching & Courses
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-3xl border border-slate-900 bg-slate-950/40 p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center">
          {activeTab === "d2c" ? (
            <>
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">D2C E-commerce Automation</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Convert abandoned checkouts, reduce COD return-to-origin (RTO) rates, and send transactional updates automatically.
                  </p>
                </div>

                <ul className="space-y-4">
                  {[
                    "**Abandoned Cart Recovery**: Automatically send cart reminders with discount codes 15 mins after abandonment.",
                    "**COD Confirmation**: Verify cash-on-delivery orders with interactive 'Confirm' / 'Cancel' buttons before shipping.",
                    "**Order Tracking**: Send shipping confirmations with live tracking links via WhatsApp.",
                    "**Upsell Campaigns**: Trigger recommendations based on previous purchase history.",
                  ].map((bullet, idx) => {
                    const [bold, normal] = bullet.split(": ");
                    return (
                      <li key={idx} className="flex gap-3 text-xs sm:text-sm leading-relaxed text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                          {idx + 1}
                        </span>
                        <span>
                          <strong className="text-white">{bold.replace(/\*\*/g, "")}</strong>: {normal}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Right Column: Visual Mockup */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-5 space-y-4 max-w-sm mx-auto w-full font-sans">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300">Shopify Bot (Active)</span>
                </div>
                {/* Chat Bubbles */}
                <div className="space-y-3.5 text-xs">
                  <div className="rounded-xl bg-slate-800/50 p-3.5 max-w-[85%] text-slate-300 space-y-2 border border-slate-800/40">
                    <p className="font-semibold text-white">Hey Ashish! 👋</p>
                    <p>We noticed you left items in your cart. We've saved them for you!</p>
                    <p className="text-[11px] text-slate-400">🛒 1x WaCRM Enterprise Plan</p>
                    <p>Use code <span className="text-blue-400 font-bold">WAC10</span> for 10% off.</p>
                  </div>
                  {/* Interactive Button Mockup */}
                  <div className="flex gap-2 justify-end">
                    <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 shadow-md">
                      Checkout Now 🛒
                    </button>
                    <button className="rounded-lg border border-slate-800 text-slate-400 hover:text-white px-4 py-2">
                      View Cart
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Coaching & Education Automation</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Nurture prospects from ads, automate webinar show-up reminders, qualify student leads, and collect fees.
                  </p>
                </div>

                <ul className="space-y-4">
                  {[
                    "**Instant Lead Qualification**: Ask 2-3 qualifying questions (e.g., experience, budget) right when they click your ad.",
                    "**Webinar Reminders**: Trigger automated sequences 1 day, 1 hour, and 15 mins before going live.",
                    "**Resource Delivery**: Deliver PDFs, slides, or course outlines in-chat via rich media messaging.",
                    "**Fee Alerts & Collection**: Send payment reminders with direct UPI/Razorpay links to students.",
                  ].map((bullet, idx) => {
                    const [bold, normal] = bullet.split(": ");
                    return (
                      <li key={idx} className="flex gap-3 text-xs sm:text-sm leading-relaxed text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                          {idx + 1}
                        </span>
                        <span>
                          <strong className="text-white">{bold.replace(/\*\*/g, "")}</strong>: {normal}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Right Column: Visual Mockup */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-5 space-y-4 max-w-sm mx-auto w-full font-sans">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300">Academy Bot (Active)</span>
                </div>
                {/* Chat Bubbles */}
                <div className="space-y-3.5 text-xs">
                  <div className="rounded-xl bg-slate-800/50 p-3.5 max-w-[85%] text-slate-300 space-y-2 border border-slate-800/40">
                    <p className="font-semibold text-white">Webinar starts in 15 mins! ⏰</p>
                    <p>Hi Priya, our live training on 'Scaling with AI' is about to begin. Join the room now.</p>
                  </div>
                  {/* Interactive Button Mockup */}
                  <div className="flex gap-2 justify-end">
                    <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 shadow-md flex items-center gap-1.5">
                      Join Live Zoom 🚀
                    </button>
                    <button className="rounded-lg border border-slate-800 text-slate-400 hover:text-white px-4 py-2">
                      Get PDF Slides
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* --- ONBOARDING ROADMAP --- */}
      <section className="space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Our 15-Day Onboarding Roadmap</h2>
          <p className="text-slate-400 text-xs sm:text-sm">How we take your WhatsApp business from zero to live in two weeks.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ONBOARDING_STEPS.map((step, idx) => (
            <div
              key={step.day}
              className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 relative hover:border-slate-800 transition-colors"
            >
              <span className="absolute -top-4 left-6 text-[11px] font-extrabold text-blue-400 bg-slate-950 border border-slate-900 px-3 py-1 rounded-full uppercase tracking-wider">
                {step.day}
              </span>
              <div className="pt-2 space-y-2">
                <h4 className="text-base font-bold text-white">{step.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FINAL CALL TO ACTION --- */}
      <section className="text-center max-w-3xl mx-auto space-y-8 bg-slate-900/10 border border-slate-900 rounded-3xl p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none -z-10" />

        <h3 className="text-3xl font-bold text-white">Ready to automate your WhatsApp business?</h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Book a strategy call with our automation architects. We'll map out your flows, audit your current setups, and show you how WaCRM can scale your operations.
        </p>
        <div>
          <Link
            href="/book-demo"
            className="inline-flex items-center gap-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
          >
            Schedule Onboarding Call
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
