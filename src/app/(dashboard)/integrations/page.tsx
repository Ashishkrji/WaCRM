'use client';

import { IntegrationsPanel } from '@/components/settings/integrations-panel';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect external webhooks, API access tokens, and developer configurations.
        </p>
      </div>
      <IntegrationsPanel />
    </div>
  );
}
