'use client';

import { TemplateManager } from '@/components/settings/template-manager';

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure and sync your WhatsApp message templates from Meta Business Manager.
        </p>
      </div>
      <TemplateManager />
    </div>
  );
}
