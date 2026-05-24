"use client";

import { WidgetManager } from "@/components/settings/widget-manager";

export default function WidgetsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Website Widgets</h1>
        <p className="text-sm text-slate-400">Create embeddable chat widgets to engage with your website visitors.</p>
      </div>
      <WidgetManager />
    </div>
  );
}
