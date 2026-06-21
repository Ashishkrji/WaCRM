'use client';

import { WorkspaceBranding } from '@/components/settings/workspace-branding';

export default function WorkspaceBrandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workspace & Branding</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize your workspace name, branding color scheme, and white-labeling preferences.
        </p>
      </div>
      <WorkspaceBranding />
    </div>
  );
}
