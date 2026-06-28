"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Zap, Plus, Save, Play, GitBranch, Trash2,
  ChevronRight, Settings, Clock, Bot, Webhook,
  GitMerge, CheckCircle2, XCircle, Loader2,
  ArrowLeft, Copy, History, Eye, Upload, Download,
  Bell, Users, DollarSign, MessageSquare, Target,
  CircleSlash, RefreshCw, Cpu,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { WorkflowNodeType, WorkflowCategory } from "@/types"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface BuilderNode {
  id: string
  node_type: WorkflowNodeType
  label: string
  config: Record<string, unknown>
  pos_x: number
  pos_y: number
}

export interface BuilderEdge {
  id: string
  source_node_id: string
  target_node_id: string
  edge_label: string
}

export interface WorkflowBuilderProps {
  initial?: {
    id?: string
    name?: string
    description?: string
    trigger_type?: string
    category?: WorkflowCategory
    nodes?: BuilderNode[]
    edges?: BuilderEdge[]
    is_active?: boolean
    status?: string
  }
}

// ─────────────────────────────────────────────
// Node Metadata
// ─────────────────────────────────────────────

interface NodeMeta {
  label: string
  icon: typeof Zap
  color: string
  bg: string
  description: string
}

const NODE_META: Record<WorkflowNodeType, NodeMeta> = {
  trigger: { label: "Trigger", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", description: "Start the workflow" },
  condition: { label: "Condition", icon: GitBranch, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", description: "Branch on a condition" },
  decision: { label: "AI Decision", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", description: "AI-powered routing" },
  delay: { label: "Delay", icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", description: "Wait before next step" },
  loop: { label: "Loop", icon: RefreshCw, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", description: "Repeat steps" },
  approval: { label: "Approval", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", description: "Require human approval" },
  action: { label: "Action", icon: Target, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", description: "Perform an action" },
  webhook: { label: "Webhook", icon: Webhook, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", description: "Call an external API" },
  ai_node: { label: "AI Agent", icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", description: "Run an AI agent" },
  end: { label: "End", icon: XCircle, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", description: "End the workflow" },
}

const TRIGGER_OPTIONS = [
  "new_message_received", "first_inbound_message", "keyword_match",
  "new_contact_created", "conversation_assigned", "tag_added",
  "deal_stage_changed", "invoice_generated", "payment_received",
  "task_created", "task_completed", "campaign_started", "campaign_completed",
  "customer_replied", "customer_inactive", "support_ticket_created",
  "meeting_scheduled", "meeting_completed", "webhook_received",
  "scheduled_time", "custom_event",
]

const ACTION_OPTIONS = [
  "send_message", "send_template", "send_email", "send_notification",
  "create_lead", "update_contact", "create_deal", "update_deal",
  "create_task", "assign_conversation", "schedule_meeting",
  "score_lead", "add_tag", "remove_tag", "start_campaign",
  "add_customer_segment", "notify_team", "create_webhook", "call_api",
  "run_ai_agent", "generate_proposal", "generate_quotation",
  "generate_invoice", "update_memory", "update_knowledge",
]

function uid(): string {
  return `node_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function WorkflowBuilder({ initial }: WorkflowBuilderProps) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [triggerType, setTriggerType] = useState(initial?.trigger_type ?? "new_message_received")
  const [category, setCategory] = useState<WorkflowCategory>(initial?.category ?? "custom")
  const [isActive, setIsActive] = useState(initial?.is_active ?? false)
  const [nodes, setNodes] = useState<BuilderNode[]>(initial?.nodes ?? [])
  const [edges, setEdges] = useState<BuilderEdge[]>(initial?.edges ?? [])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPalette, setShowPalette] = useState(true)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  // ─── Node CRUD ───────────────────────────────

  const addNode = useCallback((type: WorkflowNodeType) => {
    const meta = NODE_META[type]
    const newNode: BuilderNode = {
      id: uid(),
      node_type: type,
      label: meta.label,
      config: getDefaultConfig(type),
      pos_x: 100 + nodes.length * 220,
      pos_y: 200,
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(newNode.id)
  }, [nodes.length])

  const updateNode = useCallback((id: string, updates: Partial<BuilderNode>) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...updates } : n))
  }, [])

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => prev.filter((e) => e.source_node_id !== id && e.target_node_id !== id))
    if (selectedNodeId === id) setSelectedNodeId(null)
  }, [selectedNodeId])

  const connectNodes = useCallback((sourceId: string, targetId: string, label = "default") => {
    const exists = edges.some((e) => e.source_node_id === sourceId && e.target_node_id === targetId)
    if (exists || sourceId === targetId) return
    setEdges((prev) => [...prev, { id: uid(), source_node_id: sourceId, target_node_id: targetId, edge_label: label }])
  }, [edges])

  // ─── Save ───────────────────────────────────

  const handleSave = async (publish = false) => {
    if (!name.trim()) { toast.error("Workflow name is required"); return }

    setSaving(true)
    try {
      const body = {
        name, description, trigger_type: triggerType, category,
        is_active: publish || isActive,
        status: publish ? "published" : "draft",
        nodes: nodes.map(({ id: _id, ...n }) => n), // strip client id
        edges: edges.map(({ id: _id, source_node_id, target_node_id, edge_label }) => ({
          source_node_id, target_node_id, edge_label
        })),
        create_version: true,
      }

      const url = initial?.id
        ? `/api/workflows/${initial.id}`
        : `/api/workflows`
      const method = initial?.id ? "PATCH" : "POST"

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Save failed")
        return
      }

      const data = await res.json()
      toast.success(publish ? "Workflow published!" : "Draft saved")
      if (!initial?.id) {
        router.push(`/workflows/${data.workflow.id}`)
      }
    } catch (err) {
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  // ─── Test ────────────────────────────────────

  const handleTest = async () => {
    if (!initial?.id) { toast.error("Save the workflow first to test it"); return }
    setTesting(true)
    try {
      const res = await fetch(`/api/workflows/${initial.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vars: { test_mode: true } }),
      })
      const data = await res.json()
      toast.success(`Test run: ${data.result?.status ?? "completed"}`, {
        description: `${data.result?.steps_executed?.length ?? 0} steps executed`,
      })
    } catch {
      toast.error("Test failed")
    } finally {
      setTesting(false)
    }
  }

  // ─── Render ─────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")} className="text-slate-400">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Workflows
        </Button>

        <div className="h-5 w-px bg-slate-700" />

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workflow name..."
          className="h-8 w-56 border-slate-700 bg-slate-800 text-sm text-slate-100"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as WorkflowCategory)}
          className="h-8 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300"
        >
          {["crm","lead","sales","marketing","support","ai","meeting","proposal","quotation","payment","retention","custom"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            Active
          </label>

          <Button variant="ghost" size="sm" onClick={handleTest} disabled={testing} className="text-slate-300">
            {testing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
            Test
          </Button>

          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="border-slate-700 text-slate-300">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save Draft
          </Button>

          <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="bg-primary text-white">
            <Upload className="mr-1 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        {showPalette && (
          <div className="w-56 flex-none overflow-y-auto border-r border-slate-800 bg-slate-900 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Trigger</p>
            <PaletteItem type="trigger" onAdd={addNode} />

            <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Logic</p>
            {(["condition", "decision", "delay", "loop"] as WorkflowNodeType[]).map((t) => (
              <PaletteItem key={t} type={t} onAdd={addNode} />
            ))}

            <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Actions</p>
            {(["action", "approval", "webhook", "ai_node"] as WorkflowNodeType[]).map((t) => (
              <PaletteItem key={t} type={t} onAdd={addNode} />
            ))}

            <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">End</p>
            <PaletteItem type="end" onAdd={addNode} />
          </div>
        )}

        {/* Canvas */}
        <div className="relative flex-1 overflow-auto bg-[radial-gradient(circle,_rgba(99,102,241,0.06)_1px,_transparent_1px)] bg-[size:24px_24px]">
          {/* Trigger Config Banner */}
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-300">Trigger:</span>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="border-0 bg-transparent text-xs text-yellow-200 outline-none"
            >
              {TRIGGER_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-slate-100">
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
              <Zap className="h-16 w-16 opacity-20" />
              <p className="text-lg font-medium">Add nodes from the palette</p>
              <p className="text-sm">Click a node type on the left to add it to the canvas</p>
            </div>
          )}

          {/* Nodes */}
          <div className="relative min-h-full min-w-full p-20">
            {/* Edge Lines (simple SVG) */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              {edges.map((edge) => {
                const src = nodes.find((n) => n.id === edge.source_node_id)
                const tgt = nodes.find((n) => n.id === edge.target_node_id)
                if (!src || !tgt) return null
                const x1 = src.pos_x + 96
                const y1 = src.pos_y + 40
                const x2 = tgt.pos_x + 96
                const y2 = tgt.pos_y
                const cy = (y1 + y2) / 2
                return (
                  <g key={edge.id}>
                    <path
                      d={`M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`}
                      fill="none"
                      stroke={edge.edge_label === "yes" ? "#22c55e" : edge.edge_label === "no" ? "#ef4444" : "#6366f1"}
                      strokeWidth={2}
                      strokeDasharray={edge.edge_label === "default" ? "none" : "4,3"}
                    />
                    <text x={(x1 + x2) / 2} y={cy - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">
                      {edge.edge_label !== "default" ? edge.edge_label : ""}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Node Cards */}
            {nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => setSelectedNodeId(node.id)}
                onDelete={() => deleteNode(node.id)}
                onConnect={(targetId, label) => connectNodes(node.id, targetId, label)}
                allNodes={nodes}
              />
            ))}
          </div>
        </div>

        {/* Config Panel */}
        {selectedNode && (
          <div className="w-80 flex-none overflow-y-auto border-l border-slate-800 bg-slate-900 p-4">
            <NodeConfigPanel
              node={selectedNode}
              onChange={(updates) => updateNode(selectedNode.id, updates)}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Palette Item
// ─────────────────────────────────────────────

function PaletteItem({ type, onAdd }: { type: WorkflowNodeType; onAdd: (t: WorkflowNodeType) => void }) {
  const meta = NODE_META[type]
  const Icon = meta.icon
  return (
    <button
      onClick={() => onAdd(type)}
      className={cn(
        "mb-1 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-all hover:scale-[1.02]",
        meta.bg,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 flex-none", meta.color)} />
      <span className="text-slate-200">{meta.label}</span>
    </button>
  )
}

// ─────────────────────────────────────────────
// Node Card
// ─────────────────────────────────────────────

interface NodeCardProps {
  node: BuilderNode
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  onConnect: (targetId: string, label: string) => void
  allNodes: BuilderNode[]
}

function NodeCard({ node, isSelected, onClick, onDelete, onConnect, allNodes }: NodeCardProps) {
  const meta = NODE_META[node.node_type]
  const Icon = meta.icon

  return (
    <div
      className={cn(
        "absolute flex w-48 cursor-pointer flex-col rounded-xl border bg-slate-800 shadow-lg transition-all hover:shadow-xl",
        meta.bg,
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-slate-900",
      )}
      style={{ left: node.pos_x, top: node.pos_y }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 rounded-t-xl px-3 py-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md bg-slate-900/50")}>
          <Icon className={cn("h-3.5 w-3.5", meta.color)} />
        </div>
        <span className="flex-1 text-xs font-semibold text-slate-100 truncate">{node.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Config preview */}
      <div className="rounded-b-xl px-3 pb-2 text-[10px] text-slate-500 truncate">
        {getConfigPreview(node)}
      </div>

      {/* Connect to another node */}
      {allNodes.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-slate-700 bg-slate-800 text-slate-100 text-xs w-48">
            <p className="px-2 py-1 text-[10px] text-slate-500">Connect to...</p>
            {["default","yes","no"].map((label) => (
              <DropdownMenuSeparator key={`sep-${label}`} className="bg-slate-700" />
            ))}
            {allNodes.filter((n) => n.id !== node.id).map((target) => (
              <DropdownMenuItem
                key={target.id}
                onClick={() => onConnect(target.id, node.node_type === "condition" ? "yes" : "default")}
                className="cursor-pointer hover:bg-slate-700"
              >
                <ChevronRight className="mr-1 h-3 w-3 text-primary" />
                {target.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Node Config Panel
// ─────────────────────────────────────────────

function NodeConfigPanel({
  node,
  onChange,
  onClose,
}: {
  node: BuilderNode
  onChange: (updates: Partial<BuilderNode>) => void
  onClose: () => void
}) {
  const meta = NODE_META[node.node_type]
  const Icon = meta.icon

  const updateConfig = (key: string, value: unknown) => {
    onChange({ config: { ...node.config, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", meta.color)} />
          <span className="text-sm font-semibold text-slate-100">{meta.label} Config</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="text-xs text-slate-400">Node Label</label>
        <Input
          value={node.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="mt-1 h-8 border-slate-700 bg-slate-800 text-xs text-slate-100"
        />
      </div>

      {/* Type-specific config */}
      {node.node_type === "action" && (
        <div>
          <label className="text-xs text-slate-400">Action</label>
          <select
            value={String(node.config.action ?? "send_message")}
            onChange={(e) => updateConfig("action", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
            ))}
          </select>

          {node.config.action === "send_message" && (
            <Textarea
              value={String(node.config.text ?? "")}
              onChange={(e) => updateConfig("text", e.target.value)}
              placeholder="Message text..."
              className="mt-2 border-slate-700 bg-slate-800 text-xs text-slate-100"
              rows={3}
            />
          )}
        </div>
      )}

      {node.node_type === "delay" && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-slate-400">Amount</label>
            <Input
              type="number"
              value={Number(node.config.amount ?? 1)}
              onChange={(e) => updateConfig("amount", parseInt(e.target.value))}
              className="mt-1 h-8 border-slate-700 bg-slate-800 text-xs text-slate-100"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400">Unit</label>
            <select
              value={String(node.config.unit ?? "hours")}
              onChange={(e) => updateConfig("unit", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
            >
              {["minutes","hours","days","weeks"].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      )}

      {node.node_type === "condition" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400">Condition Subject</label>
            <select
              value={String(node.config.subject ?? "contact_field")}
              onChange={(e) => updateConfig("subject", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
            >
              {["contact_replied","payment_status","ai_resolved","customer_replied","lead_score","message_content","time_of_day","contact_field"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Value</label>
            <Input
              value={String(node.config.value ?? "")}
              onChange={(e) => updateConfig("value", e.target.value)}
              placeholder="Expected value..."
              className="mt-1 h-8 border-slate-700 bg-slate-800 text-xs text-slate-100"
            />
          </div>
        </div>
      )}

      {node.node_type === "ai_node" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400">Agent Type</label>
            <select
              value={String(node.config.agent_type ?? "support")}
              onChange={(e) => updateConfig("agent_type", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
            >
              {["support","sales","marketing","seo","website","gst"].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={Boolean(node.config.search_knowledge)}
              onChange={(e) => updateConfig("search_knowledge", e.target.checked)}
              className="rounded"
            />
            Search Knowledge Base
          </label>
        </div>
      )}

      {node.node_type === "webhook" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400">Target URL</label>
            <Input
              value={String(node.config.url ?? "")}
              onChange={(e) => updateConfig("url", e.target.value)}
              placeholder="https://..."
              className="mt-1 h-8 border-slate-700 bg-slate-800 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Method</label>
            <select
              value={String(node.config.method ?? "POST")}
              onChange={(e) => updateConfig("method", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
            >
              {["GET","POST","PUT","PATCH","DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {node.node_type === "approval" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400">Title</label>
            <Input
              value={String(node.config.title ?? "")}
              onChange={(e) => updateConfig("title", e.target.value)}
              placeholder="Approval title..."
              className="mt-1 h-8 border-slate-700 bg-slate-800 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Approval Mode</label>
            <select
              value={String(node.config.approval_mode ?? "any_one")}
              onChange={(e) => updateConfig("approval_mode", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
            >
              <option value="any_one">Any One Approver</option>
              <option value="sequential">Sequential</option>
              <option value="parallel">All Must Approve</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Escalation After (hours)</label>
            <Input
              type="number"
              value={Number(node.config.escalation_after_hours ?? 24)}
              onChange={(e) => updateConfig("escalation_after_hours", parseInt(e.target.value))}
              className="mt-1 h-8 border-slate-700 bg-slate-800 text-xs text-slate-100"
            />
          </div>
        </div>
      )}

      <div className="rounded-md bg-slate-800/50 p-2 text-[10px] text-slate-500">
        {meta.description}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getDefaultConfig(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case "trigger": return { event: "new_message_received" }
    case "condition": return { subject: "contact_replied" }
    case "decision": return { use_ai: true, ai_prompt: "Route this customer to the best department" }
    case "delay": return { amount: 1, unit: "hours" }
    case "loop": return { max_iterations: 3 }
    case "approval": return { title: "Approval Required", approval_mode: "any_one", escalation_after_hours: 24 }
    case "action": return { action: "send_message", text: "" }
    case "webhook": return { url: "", method: "POST" }
    case "ai_node": return { agent_type: "support", search_knowledge: true }
    case "end": return {}
    default: return {}
  }
}

function getConfigPreview(node: BuilderNode): string {
  const c = node.config
  switch (node.node_type) {
    case "trigger": return String(c.event ?? "").replace(/_/g, " ")
    case "action": return String(c.action ?? "").replace(/_/g, " ")
    case "delay": return `${c.amount} ${c.unit}`
    case "condition": return String(c.subject ?? "").replace(/_/g, " ")
    case "ai_node": return `Agent: ${c.agent_type}`
    case "webhook": return String(c.url ?? "URL not set").slice(0, 30)
    case "approval": return String(c.approval_mode ?? "any_one")
    default: return ""
  }
}
