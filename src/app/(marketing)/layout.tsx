import type { Metadata } from "next";
import { Header } from "./header";
import Link from "next/link";
import { Shield, Mail, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "MJChatSyncs — Enterprise AI WhatsApp CRM & Automation",
  description: "More leads. Faster follow-up. More revenue. The ultimate AI-powered Business Operating System for WhatsApp Business API.",
};

const FOOTER_LINKS = [
  {
    title: "Product",
    items: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/services", label: "Services" },
      { href: "/#how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/#about", label: "About Us" },
      { href: "/#contact", label: "Contact" },
      { href: "/#careers", label: "Careers" },
      { href: "/#roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Developers",
    items: [
      { href: "/documentation", label: "Documentation" },
      { href: "/developer-hub", label: "API Reference" },
      { href: "/developer-hub", label: "Webhooks" },
      { href: "/developer-hub", label: "MCP Server" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund", label: "Refund Policy" },
      { href: "/data-deletion", label: "Data Deletion" },
    ],
  },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-blue-500/30 selection:text-white">
      {/* Sticky Header */}
      <Header />

      {/* Page Content */}
      <div className="flex-1 pt-16">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            {/* Branding */}
            <div className="space-y-6 xl:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">
                  MJChatSyncs
                </span>
              </Link>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Empowering growing businesses to scale sales, support, and marketing campaigns natively on the WhatsApp Business Cloud API.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>support@mjchatsyncs.com</span>
              </div>
            </div>

            {/* Links Grid */}
            <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 sm:grid-cols-4">
              {FOOTER_LINKS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t border-slate-900 pt-8 space-y-2">
            <p className="text-xs text-slate-500">
              &copy; 2026 wacrm. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Built on the official WhatsApp Business API.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              WhatsApp&reg; is a registered trademark of Meta Platforms, Inc. Hostinger is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
