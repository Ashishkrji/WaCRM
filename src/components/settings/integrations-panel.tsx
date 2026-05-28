"use client";

import { Webhook, Plus, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "Connected" | "Available";
  connectType: "API Key" | "OAuth";
};

type Category = {
  title: string;
  items: Integration[];
};

const INTEGRATION_CATEGORIES: Category[] = [
  {
    title: "AI & Automation",
    items: [
      {
        id: "agent-router",
        name: "Agent Router AI",
        description: "Custom AI router for smart customer support & auto-replies.",
        icon: "🤖",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "openai",
        name: "OpenAI (ChatGPT)",
        description: "Automate smart replies to customer queries using ChatGPT.",
        icon: "🧠",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect WaCRM with 5,000+ apps to automate your workflows.",
        icon: "⚡",
        status: "Connected",
        connectType: "API Key",
      },
      {
        id: "make",
        name: "Make (Integromat)",
        description: "Build advanced visual automations and complex workflows.",
        icon: "⚙️",
        status: "Available",
        connectType: "API Key",
      },
    ]
  },
  {
    title: "Productivity & Databases",
    items: [
      {
        id: "google-sheets",
        name: "Google Sheets",
        description: "Export leads and sync contacts directly to your spreadsheets.",
        icon: "📊",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "notion",
        name: "Notion",
        description: "Save chats, meeting notes, and deal progress directly to Notion.",
        icon: "📓",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "airtable",
        name: "Airtable",
        description: "Sync your CRM pipeline directly into Airtable bases.",
        icon: "🪁",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Automatically send calendar invites when meetings are fixed on WhatsApp.",
        icon: "📅",
        status: "Available",
        connectType: "OAuth",
      },
    ]
  },
  {
    title: "Social Media & Ads",
    items: [
      {
        id: "facebook-ads",
        name: "Facebook Lead Ads",
        description: "Trigger instant WhatsApp welcome messages for new Facebook leads.",
        icon: "📢",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "instagram",
        name: "Instagram & Messenger",
        description: "Handle WhatsApp, IG DMs, and Messenger from one shared inbox.",
        icon: "📸",
        status: "Available",
        connectType: "OAuth",
      },
    ]
  },
  {
    title: "E-commerce & Payments",
    items: [
      {
        id: "shopify",
        name: "Shopify",
        description: "Sync orders, customers, and abandoned carts directly to WaCRM.",
        icon: "🛍️",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "woocommerce",
        name: "WooCommerce",
        description: "Send automated WhatsApp alerts for new orders and shipping updates.",
        icon: "🛒",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Generate and send secure payment links directly inside WhatsApp chats.",
        icon: "💳",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "razorpay",
        name: "Razorpay",
        description: "Send payment links and automated success confirmations.",
        icon: "₹",
        status: "Available",
        connectType: "API Key",
      },
    ]
  },
  {
    title: "Core CRMs & Support",
    items: [
      {
        id: "hubspot",
        name: "HubSpot",
        description: "Sync your WhatsApp contacts and chat logs directly to HubSpot.",
        icon: "🦊",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "salesforce",
        name: "Salesforce",
        description: "Enterprise sync for logging WhatsApp conversations into Salesforce.",
        icon: "☁️",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "pipedrive",
        name: "Pipedrive",
        description: "Automatically move deals in Pipedrive based on WhatsApp chats.",
        icon: "📈",
        status: "Available",
        connectType: "API Key",
      },
      {
        id: "zendesk",
        name: "Zendesk",
        description: "Create support tickets in Zendesk directly from WhatsApp conversations.",
        icon: "🎧",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "freshdesk",
        name: "Freshdesk",
        description: "Seamlessly turn customer queries into trackable Freshdesk tickets.",
        icon: "🎫",
        status: "Available",
        connectType: "API Key",
      },
    ]
  },
  {
    title: "Marketing & Email",
    items: [
      {
        id: "mailchimp",
        name: "Mailchimp",
        description: "Automatically add new WhatsApp leads to your email marketing lists.",
        icon: "🐵",
        status: "Available",
        connectType: "OAuth",
      },
      {
        id: "activecampaign",
        name: "ActiveCampaign",
        description: "Trigger complex email marketing automations from WhatsApp events.",
        icon: "✉️",
        status: "Available",
        connectType: "API Key",
      },
    ]
  }
];

export function IntegrationsPanel() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">Integrations Hub</CardTitle>
            <CardDescription>Connect WaCRM with your favorite tools via OAuth or API Keys.</CardDescription>
          </div>
          <Button variant="outline" className="gap-2 border-slate-700">
            <Webhook className="h-4 w-4" />
            Manage Webhooks
          </Button>
        </CardHeader>
        <CardContent className="space-y-10">
          
          {INTEGRATION_CATEGORIES.map((category) => (
            <div key={category.title} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
                {category.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex flex-col p-5 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-3 mb-3 mt-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xl group-hover:scale-110 transition-transform">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200 leading-tight">{integration.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            integration.status === 'Connected' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {integration.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            via {integration.connectType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 flex-1">
                      {integration.description}
                    </p>
                    {integration.status === 'Connected' ? (
                      <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Configured
                      </Button>
                    ) : (
                      <Button className="w-full gap-2 bg-slate-800 hover:bg-slate-700 text-white">
                        <Plus className="h-4 w-4" />
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Integration Action */}
          <div className="mt-8 border-t border-slate-800 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-lg">Custom API & Webhooks</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    Don't see your tool here? Build your own custom integration using our REST API and real-time event webhooks.
                  </p>
                </div>
              </div>
              <Link href="/developers">
                <Button size="lg" className="shrink-0 bg-primary hover:bg-primary/90">
                  View Developer Docs
                </Button>
              </Link>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
