'use client';

import { AppearancePanel } from '@/components/settings/appearance-panel';

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Appearance</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize CRM application visual preferences and UI layout themes.
        </p>
      </div>
      <AppearancePanel />
    </div>
  );
}
