'use client';

import { PipelineManager } from '@/components/settings/pipeline-manager';

export default function PipelineManagerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline Manager</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure multiple pipelines, deal stages, stage orders, and branding colors.
        </p>
      </div>
      <PipelineManager />
    </div>
  );
}
