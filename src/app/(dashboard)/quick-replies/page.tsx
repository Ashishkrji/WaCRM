"use client";

import { QuickRepliesManager } from "@/components/settings/quick-replies-manager";

export default function QuickRepliesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Quick Replies</h1>
        <p className="text-sm text-slate-400">Manage your canned responses for faster communication in the inbox.</p>
      </div>
      <QuickRepliesManager />
    </div>
  );
}
