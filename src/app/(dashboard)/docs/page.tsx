"use client";

import { BookOpen, Search, Code, Layout, MessageSquare, Zap, Terminal, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DOCS_CATEGORIES = [
  {
    title: "Getting Started",
    icon: <Layout className="h-6 w-6 text-indigo-400" />,
    description: "Learn the basics of WaCRM and how to set up your workspace.",
    articles: ["Quick Start Guide", "Connecting WhatsApp", "Inviting your team"],
  },
  {
    title: "Conversations & Inbox",
    icon: <MessageSquare className="h-6 w-6 text-emerald-400" />,
    description: "Master the shared inbox, tags, and message templates.",
    articles: ["Using the Shared Inbox", "Creating Message Templates", "Managing Tags"],
  },
  {
    title: "Automations & Flows",
    icon: <Zap className="h-6 w-6 text-amber-400" />,
    description: "Build powerful automated workflows and interactive chatbots.",
    articles: ["Intro to Automations", "Building your first Flow", "Auto-replies"],
  },
  {
    title: "Developer API",
    icon: <Terminal className="h-6 w-6 text-blue-400" />,
    description: "Integrate WaCRM with your custom apps using our REST API.",
    articles: ["Authentication", "Webhooks Guide", "API Reference"],
  },
];

export default function DocumentationPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">
      <div className="text-center space-y-4 py-12 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">How can we help?</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Search our knowledge base or browse categories below to find exactly what you're looking for.
        </p>
        <div className="max-w-md mx-auto pt-4 relative px-4">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Search for articles, guides, and API docs..." 
            className="pl-12 py-6 rounded-full bg-slate-950 border-slate-700 focus-visible:ring-primary/50 text-base"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {DOCS_CATEGORIES.map((category) => (
          <Card key={category.title} className="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                  {category.icon}
                </div>
                <div className="space-y-4 w-full">
                  <div>
                    <h2 className="text-xl font-bold text-slate-200">{category.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {category.articles.map((article) => (
                      <li key={article}>
                        <a href="#" className="text-sm text-slate-300 hover:text-primary flex items-center justify-between group">
                          {article}
                          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-primary transition-colors" />
                        </a>
                      </li>
                    ))}
                  </ul>
                  <a href="#" className="text-sm text-primary font-medium hover:underline inline-block mt-2">
                    View all articles &rarr;
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
