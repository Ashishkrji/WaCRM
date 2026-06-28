"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Key, Bot, Inbox, MessageSquare, Terminal, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { id: "intro", label: "Introduction to MJChatSyncs" },
      { id: "onboarding", label: "Quick Start Guide" },
      { id: "self-hosting", label: "Self-Hosting with Docker" },
    ],
  },
  {
    title: "WhatsApp API Setup",
    items: [
      { id: "meta-app", label: "Creating a Meta Developer App" },
      { id: "phone-number", label: "Connecting Your Number" },
      { id: "templates", label: "Managing Message Templates" },
    ],
  },
  {
    title: "Core Features",
    items: [
      { id: "inbox", label: "Shared Team Inbox & Routing" },
      { id: "broadcasts", label: "Running Broadcast Campaigns" },
      { id: "automations", label: "Building No-Code Workflows" },
    ],
  },
  {
    title: "AI & Integrations",
    items: [
      { id: "ai-rag", label: "Training the AI Knowledge Base" },
      { id: "shopify", label: "Shopify Integration" },
      { id: "webhooks", label: "Using Webhooks & REST API" },
    ],
  },
];

export default function DocsPage() {
  const [activeArticle, setActiveArticle] = useState("intro");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.05] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-950 rounded-xl focus:outline-none focus:border-blue-500 text-slate-200 placeholder:text-slate-600"
            />
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6">
            {DOCS_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-2 text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveArticle(item.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                          activeArticle === item.id
                            ? "bg-blue-600/10 text-blue-400 border border-blue-500/15"
                            : "text-slate-455 hover:text-slate-200 hover:bg-slate-900/40"
                        )}
                      >
                        {item.label}
                        {activeArticle === item.id && <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 border border-slate-900 bg-slate-900/10 rounded-2xl p-6 sm:p-10 backdrop-blur-sm text-left max-w-3xl">
          {activeArticle === "intro" && (
            <article className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Introduction to MJChatSyncs</h1>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Welcome to MJChatSyncs! MJChatSyncs is an enterprise-grade, self-hostable AI WhatsApp CRM and automation platform built on top of the official Meta WhatsApp Business Cloud API.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Whether you are a growing D2C brand recovering abandoned carts, a services business managing customer inquiries, or an enterprise looking for a unified team inbox with custom AI agents, MJChatSyncs provides the complete software stack to automate your WhatsApp communication securely.
              </p>
              <div className="border-t border-slate-900 pt-6">
                <h2 className="text-lg font-bold text-white mb-4">Core Platform Pillars</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase">1. Shared Team Inbox</h3>
                    <p className="text-[11px] text-slate-500 leading-normal">Multiple agents managing customer conversations from a single WhatsApp number with automated routing.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase">2. Visual Workflows</h3>
                    <p className="text-[11px] text-slate-500 leading-normal">Drag-and-drop conversational flow builder and scheduled drip marketing campaigns without writing code.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase">3. Knowledge-Base AI</h3>
                    <p className="text-[11px] text-slate-500 leading-normal">Upload your product catalogs, refund policy PDFs, or FAQs and let your custom RAG AI resolve support queries.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase">4. Developer First</h3>
                    <p className="text-[11px] text-slate-500 leading-normal">Robust REST APIs, secure incoming/outgoing webhooks, and native Model Context Protocol (MCP) support.</p>
                  </div>
                </div>
              </div>
            </article>
          )}

          {activeArticle === "onboarding" && (
            <article className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                  <Key className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Quick Start Guide</h1>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Follow these three simple steps to connect your WhatsApp number and send your first test broadcast message.
              </p>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-200">Step 1: Obtain Meta API Credentials</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Log in to the Meta for Developers portal, create a Business App, and set up the WhatsApp product. You will get a <strong>Temporary Access Token</strong>, a <strong>Phone Number ID</strong>, and a <strong>WhatsApp Business Account ID</strong>.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-200">Step 2: Save Credentials in MJChatSyncs</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Navigate to your MJChatSyncs dashboard, go to <strong>Settings &rarr; WhatsApp Config</strong>, and enter your Meta credentials. Your access token is securely encrypted using AES-256-GCM.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-200">Step 3: Send a Test Message</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Go to the <strong>Contacts</strong> page, create a new contact with your own phone number, and click on the chat icon. Type a message and hit send to verify the integration is working!
                  </p>
                </div>
              </div>
            </article>
          )}

          {activeArticle === "self-hosting" && (
            <article className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                  <Terminal className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Self-Hosting with Docker</h1>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Deploy MJChatSyncs on your own server or cloud instance using our official Docker Compose setup in under 5 minutes.
              </p>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Prerequisites</h3>
                <ul className="list-disc list-inside text-xs text-slate-455 space-y-1">
                  <li>Docker and Docker Compose installed.</li>
                  <li>A Supabase project (for database, auth, and storage).</li>
                  <li>A MongoDB Atlas database URI (for AI chat logging).</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200">Docker Compose Example</h3>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono border border-slate-900 text-slate-300 overflow-x-auto leading-relaxed">
{`version: '3.8'
services:
  mjchatsyncs:
    image: ghcr.io/mjchatsyncs/app:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=https://your-proj.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
      - SUPABASE_SERVICE_ROLE_KEY=your-service-key
      - MONGODB_URI=mongodb+srv://...
      - ENCRYPTION_KEY=your-64-hex-key`}
                </pre>
              </div>
            </article>
          )}

          {/* Fallback info for other articles */}
          {activeArticle !== "intro" && activeArticle !== "onboarding" && activeArticle !== "self-hosting" && (
            <div className="py-20 text-center space-y-3">
              <Bot className="h-12 w-12 text-slate-600 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-slate-300">Article Content Coming Soon</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We are actively writing this documentation article. If you need immediate assistance, please email support@mjchatsyncs.com.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
