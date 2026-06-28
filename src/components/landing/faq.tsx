"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Section, SectionHeader } from './section'
import { cn } from '@/lib/utils'

const QA = [
  {
    q: "What is MJChatSyncs?",
    a: "MJChatSyncs is a WhatsApp automation platform that helps businesses automate customer conversations, follow up on leads instantly, run broadcast campaigns, and build no-code workflows — all powered by the official WhatsApp Business API. It includes a shared inbox, AI assistant, knowledge base, chatbot builder, and 20+ integrations."
  },
  {
    q: "Do I need to know how to code?",
    a: "Not at all. MJChatSyncs is built for business owners and teams, not developers. The chatbot builder, flow automation, and AI assistant are all no-code — drag, drop, and configure. If you want to go deeper, the API and Webhook integrations are available too."
  },
  {
    q: "What is the AI Assistant and how is it different from a regular chatbot?",
    a: "A regular chatbot follows fixed rules — if the customer says X, reply with Y. The AI Assistant is different: you upload your own knowledge base (product docs, FAQs, policies, URLs), and the AI reads and understands it. When a customer asks a question, the AI answers from your content — accurately, in your brand voice — even for questions you never explicitly programmed."
  },
  {
    q: "What is the Knowledge Base?",
    a: "The Knowledge Base is where you share the information that powers your AI Assistant. You can upload documents, paste text, or add URLs. MJChatSyncs uses this content to train the AI so it can answer customer questions the way you would."
  },
  {
    q: "Which integrations does MJChatSyncs support?",
    a: "MJChatSyncs supports 20+ native flow integrations including Shopify, WooCommerce, Razorpay, Google Sheets, Google Calendar, Calendly, OpenAI, Google Gemini, Telegram, SMTP, Zoom, TradeIndia, IndiaMart, JustDial, ExportersIndia, Facebook Lead Ads, and more. Beyond that, the WhatsApp API and Webhook access mean you can connect any tool that supports HTTP — custom CRMs, internal systems, low-code platforms like Zapier, Make, or n8n, or your own server. There is no real limit to what you can integrate."
  },
  {
    q: "Can I capture leads from IndiaMart, JustDial, or Facebook Ads automatically?",
    a: "Yes, MJChatSyncs has native integrations with IndiaMart, JustDial, ExportersIndia, TradeIndia, and Facebook Lead Ads. The moment a lead comes in from any of these sources, MJChatSyncs automatically sends them a WhatsApp message and adds them to your contact list."
  },
  {
    q: "What is a Flow?",
    a: "A Flow is a visual automation that runs in the background and triggers actions based on events. For example: when a Shopify order is placed -> send a WhatsApp confirmation. When a Razorpay payment is received -> update a Google Sheet and send a receipt. When a lead fills a form -> add to contacts and start a follow-up sequence. You build flows with a drag-and-drop editor — no code required."
  },
  {
    q: "What is the Shared Inbox?",
    a: "The inbox is where all your WhatsApp conversations live — in one place, accessible by your entire team. You can assign conversations to specific team members, add internal notes, see the full customer history, and hand off from a chatbot to a human agent when needed."
  },
  {
    q: "How do I get started?",
    a: "Sign up for a free 7-day trial — no credit card required. You'll connect your WhatsApp Business number, set up your first chatbot or flow, and start seeing results the same day. Our onboarding guide walks you through every step, or our team can do it all for you with the Managed plan."
  },
  {
    q: "How much does it cost?",
    a: "MJChatSyncs has three plans: Starter at ₹2,999/month — full platform access, you build and run everything yourself. Growth at ₹9,999/month — our team sets you up (2 automation flows built for you, custom templates, monthly 1-on-1 strategy call), then you run it. Day-to-day Managed at ₹29,999/month — our expert team builds, integrates, and manages your entire WhatsApp system for you every month. WhatsApp message delivery is billed separately at the exact Meta rate, with zero markup. Visit the Pricing page for the full breakdown."
  },
  {
    q: "Is my data safe?",
    a: "Yes. MJChatSyncs is built on secure infrastructure. Your data and your customers' data are handled with full confidentiality. We use the official WhatsApp Business API, which means all messaging is compliant with Meta's policies."
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Absolutely. No lock-in contracts. You can cancel your subscription at any time from your account settings."
  }
]

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <Section id="faq">
      <SectionHeader
        eyebrow="FAQ"
        title="Questions, answered"
        description="If you cannot find what you are looking for, reach out and we will get back to you."
      />

      <div className="mx-auto max-w-3xl divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
        {QA.map((item, i) => {
          const isOpen = openIdx === i
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-900/70"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-slate-500 transition-transform',
                    isOpen && 'rotate-180 text-purple-400',
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
