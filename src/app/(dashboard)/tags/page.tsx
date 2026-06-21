'use client';

import { TagManager } from '@/components/settings/tag-manager';

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tags</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage contact tags and label categories for better organization and automation.
        </p>
      </div>
      <TagManager />
    </div>
  );
}
