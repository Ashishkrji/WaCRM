"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pipeline, PipelineStage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { GitBranch, Plus, Settings2, GripVertical } from "lucide-react";
import { PipelineSettings } from "@/components/pipelines/pipeline-settings";
import { toast } from "sonner";

const SPEC_DEFAULT_STAGES = [
  { name: "New Lead", color: "#3b82f6", position: 0 },
  { name: "Qualified", color: "#eab308", position: 1 },
  { name: "Proposal Sent", color: "#f97316", position: 2 },
  { name: "Negotiation", color: "#8b5cf6", position: 3 },
  { name: "Won", color: "#22c55e", position: 4 },
];

export function PipelineManager() {
  const supabase = createClient();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stagesByPipeline, setStagesByPipeline] = useState<Record<string, PipelineStage[]>>({});
  const [loading, setLoading] = useState(true);

  const [newPipelineOpen, setNewPipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: pData } = await supabase.from("pipelines").select("*").order("created_at");
    const plines = pData ?? [];
    setPipelines(plines);

    if (plines.length > 0) {
      const { data: sData } = await supabase
        .from("pipeline_stages")
        .select("*")
        .in(
          "pipeline_id",
          plines.map((p) => p.id)
        )
        .order("position");

      const stagesMap: Record<string, PipelineStage[]> = {};
      plines.forEach((p) => {
        stagesMap[p.id] = (sData ?? []).filter((s) => s.pipeline_id === p.id);
      });
      setStagesByPipeline(stagesMap);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreatePipeline() {
    const name = newPipelineName.trim();
    if (!name) return;
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setCreating(false);
      return;
    }

    const { data: pipeline, error } = await supabase
      .from("pipelines")
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error || !pipeline) {
      toast.error("Failed to create pipeline");
      setCreating(false);
      return;
    }

    const stagesPayload = SPEC_DEFAULT_STAGES.map((s) => ({
      pipeline_id: pipeline.id,
      name: s.name,
      color: s.color,
      position: s.position,
    }));
    await supabase.from("pipeline_stages").insert(stagesPayload);

    setNewPipelineName("");
    setNewPipelineOpen(false);
    await loadData();
    setCreating(false);
    toast.success("Pipeline created");
  }

  async function handleLoadReferencePipeline() {
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setCreating(false);
      return;
    }

    const { data: pipeline, error } = await supabase
      .from("pipelines")
      .insert({ user_id: user.id, name: "B2B Sales Pipeline" })
      .select()
      .single();

    if (error || !pipeline) {
      toast.error("Failed to load reference pipeline");
      setCreating(false);
      return;
    }

    const stagesPayload = SPEC_DEFAULT_STAGES.map((s) => ({
      pipeline_id: pipeline.id,
      name: s.name,
      color: s.color,
      position: s.position,
    }));
    await supabase.from("pipeline_stages").insert(stagesPayload);

    await loadData();
    setCreating(false);
    toast.success("Example pipeline loaded");
  }

  const activePipeline = pipelines.find((p) => p.id === editingPipelineId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Sales Pipelines</h2>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage multiple pipelines for different products or sales motions.
          </p>
        </div>
        <Button
          onClick={() => setNewPipelineOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <GitBranch className="h-10 w-10 text-slate-600 mb-4" />
          <p className="text-sm font-medium text-white">No pipelines found</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">You haven't created any sales pipelines yet.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setNewPipelineOpen(true)} className="border-slate-700 text-slate-300">
              Create your first pipeline
            </Button>
            <Button variant="outline" onClick={handleLoadReferencePipeline} disabled={creating} className="border-slate-700 text-slate-300 bg-slate-800">
              Load Example Pipeline
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pipelines.map((pipeline) => {
            const stages = stagesByPipeline[pipeline.id] ?? [];
            return (
              <div
                key={pipeline.id}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{pipeline.name}</h3>
                      <p className="text-xs text-slate-500">{stages.length} stages</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingPipelineId(pipeline.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-800/50">
                  {stages.slice(0, 5).map((stage) => (
                    <div key={stage.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950 border border-slate-800">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">{stage.name}</span>
                    </div>
                  ))}
                  {stages.length > 5 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500">+{stages.length - 5} more</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Pipeline Dialog */}
      <Dialog open={newPipelineOpen} onOpenChange={setNewPipelineOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">New Pipeline</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-slate-300">Pipeline Name</Label>
            <Input
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              placeholder="e.g., Enterprise Sales"
              className="mt-2 bg-slate-800 border-slate-700 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreatePipeline();
              }}
            />
            <p className="mt-2 text-xs text-slate-400">
              Default stages (New Lead → Won) will be created automatically.
            </p>
          </div>
          <DialogFooter className="bg-slate-900/50 border-slate-700 pt-4 sm:pt-0">
            <Button
              variant="outline"
              onClick={() => setNewPipelineOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePipeline}
              disabled={creating || !newPipelineName.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {creating ? "Creating..." : "Create Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pipeline Settings Overlay */}
      {activePipeline && (
        <PipelineSettings
          open={!!editingPipelineId}
          onOpenChange={(open) => !open && setEditingPipelineId(null)}
          pipeline={activePipeline}
          stages={stagesByPipeline[activePipeline.id] ?? []}
          onPipelinesChanged={loadData}
          onStagesChanged={loadData}
          onCreateNewPipeline={() => {
            setEditingPipelineId(null);
            setNewPipelineOpen(true);
          }}
        />
      )}
    </div>
  );
}
