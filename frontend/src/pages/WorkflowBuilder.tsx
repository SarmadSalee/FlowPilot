import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider, type Connection, type Edge, type NodeProps,
  Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft, Save, Trash2, Plus, Workflow, Search, MessageSquare, Cpu, GitBranch,
  Zap as ZapIcon, RefreshCw, Clock, PanelRight, Check, X, Settings2, Play, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge, Button, Input, Modal, Select, Textarea, Toggle } from "@/components/ui";
import { cn, nodeColor, statusColor, timeAgo } from "@/lib/utils";
import type { NodeDef, Workflow as WorkflowType, WorkflowEdge, Execution } from "@/lib/types";

const D1 = (o: Record<string, unknown>) => o as Record<string, any>;
const CAT_ICON: Record<string, React.ElementType> = {
  Triggers: ZapIcon, AI: Cpu, Logic: GitBranch, Actions: MessageSquare,
};

function FlowNode({ data, selected }: NodeProps) {
  const d = D1(data);
  const nodeType = `${d.nodeType}`;
  const color = nodeColor(nodeType);
  const cfg = d.config ?? {};
  const enabled = d.enabled !== false;
  const IconEl = (CAT_ICON[d.category] ?? d.iconEl ?? ZapIcon) as React.ElementType;
  let sub: string | null = null;
  if (nodeType === "condition") sub = `${cfg.field ?? "field"} ${cfg.operator ?? ">="} ${cfg.threshold ?? cfg.value ?? ""}`;
  else if (nodeType === "ai") sub = cfg.prompt?.slice(0, 24) ?? cfg.model ?? "AI action";
  else if (nodeType === "trigger") {
    sub = cfg.cron ? `every ${cfg.cron}` : cfg.formId ? `form ${cfg.formId}` : cfg.folder ? `folder ${cfg.folder}` : "manual";
  } else sub = cfg.to ?? cfg.channel ?? cfg.app ?? d.label;

  return (
    <div
      className={cn(
        "relative w-44 rounded-lg border bg-surface px-3 py-2.5 shadow-card transition-all",
        !enabled && "opacity-45 saturate-50",
      )}
      style={{ borderColor: selected ? color : undefined, boxShadow: selected ? `0 0 0 2px ${color}33` : undefined }}
    >
      {nodeType !== "trigger" && (
        <Handle type="target" position={Position.Left} className="!size-2 !border-0 !bg-line-strong" />
      )}
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}1c`, color }}>
          <IconEl className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink">{d.label}</p>
          {sub && <p className="truncate text-[10px] text-ink-faint">{sub}</p>}
        </div>
      </div>
      {!enabled && (
        <span className="absolute -top-2 right-2 rounded-full border border-warn/40 bg-warn/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-warn">
          Off
        </span>
      )}
      {nodeType === "condition" && (
        <>
          <Handle type="source" position={Position.Top} id="true" className="!left-[30%] !size-1.5 !bg-success" />
          <span className="absolute top-0 left-[30%] z-10 -translate-x-1/2 -translate-y-full text-[9px] font-semibold text-success">TRUE</span>
          <Handle type="source" position={Position.Bottom} id="false" className="!left-[70%] !size-1.5 !bg-danger" />
          <span className="absolute bottom-0 left-[70%] z-10 -translate-x-1/2 translate-y-full text-[9px] font-semibold text-danger">FALSE</span>
        </>
      )}
      <Handle type="source" position={Position.Right} className="!size-2 !border-0 !bg-line-strong" />
    </div>
  );
}

const nodeTypes = { fp: FlowNode };

function BuilderInner() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const rf = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [runResult, setRunResult] = useState<{ status: string; steps: { label: string; status: string; message: string }[] } | null>(null);
  const [runModal, setRunModal] = useState(false);
  const [filter, setFilter] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [panel, setPanel] = useState<"inspector" | "history">("inspector");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 960px)");
    setIsMobile(mq.matches);
    const on = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { data: workflow, isLoading } = useQuery<WorkflowType>({
    queryKey: ["workflow", id],
    queryFn: () => api(`/api/workflows/${id}`),
    enabled: !!id,
  });
  const { data: nodeDefs } = useQuery<NodeDef[]>({ queryKey: ["nodes"], queryFn: () => api("/api/nodes") });
  const nodeDefMap = useMemo(() => new Map((nodeDefs ?? []).map((d) => [d.key, d])), [nodeDefs]);
  const { data: executions } = useQuery<Execution[]>({ queryKey: ["executions"], queryFn: () => api("/api/executions?limit=50") });
  const wfExecutions = useMemo(() => (executions ?? []).filter((e) => e.workflowId === id), [executions, id]);

  useEffect(() => {
    if (!workflow) return;
    setName(workflow.name);
    setDesc(workflow.description ?? "");
    const wfNodes = (workflow.nodes ?? []).map((n) => {
      const def = nodeDefMap.get(n.key ?? n.type);
      const cat = def?.category ?? "Actions";
      return {
        id: n.id,
        type: "fp",
        position: n.position ?? { x: 80 + Math.random() * 140, y: 120 + Math.random() * 200 },
        data: {
          nodeType: n.type,
          nodeKey: n.key,
          label: n.label ?? "Untitled",
          category: cat,
          config: n.config ?? {},
          iconEl: (CAT_ICON[cat] ?? ZapIcon) as React.ElementType,
        },
      } as any;
    });
    const wfEdges = (workflow.edges ?? []).map((e) => ({
      id: e.id, source: e.source, target: e.target,
      ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
      ...(e.label ? { label: e.label } : {}),
      style: { strokeWidth: 1.5 },
    })) as Edge[];
    setNodes(wfNodes);
    setEdges(wfEdges);
  }, [workflow, nodeDefMap, setNodes, setEdges]);

  const onConnect = useCallback(
    (conn: Connection) => {
      const edge: Edge = {
        id: `e${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle ?? undefined,
        targetHandle: conn.targetHandle ?? undefined,
        style: { strokeWidth: 1.5 },
      };
      setEdges((eds) => addEdge(edge, eds as any));
    },
    [setEdges],
  );

  const selected = nodes.find((n) => n.id === selectedId);
  const sdata = selected ? D1(selected.data) : null;
  const selDef: NodeDef | undefined = sdata
    ? nodeDefMap.get(sdata.nodeKey ?? sdata.nodeType)
    : undefined;

  const updateNodeConfig = (key: string, value: unknown) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedId
          ? { ...n, data: { ...n.data, config: { ...(n.data.config ?? {}), [key]: value } } }
          : n,
      ),
    );
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const s = D1(selected.data);
    const newId = `n${Date.now()}-dup`;
    const dup = {
      id: newId,
      type: "fp",
      position: { x: selected.position.x + 60, y: selected.position.y + 80 },
      data: { ...s, config: { ...(s.config ?? {}) } },
    };
    setNodes((nds) => [...nds, dup]);
    setEdges((eds) => [
      ...eds,
      ...eds
        .filter((e) => e.source === selected.id || e.target === selected.id)
        .map((e) => {
          const src = e.source === selected.id ? newId : e.source;
          const tgt = e.target === selected.id ? newId : e.target;
          return { ...e, id: `e${newId}-${e.id}`, source: src, target: tgt, style: { strokeWidth: 1.5 } };
        }),
    ]);
    setSelectedId(newId);
  };

  const buildNode = (def: NodeDef, position: { x: number; y: number }) => {
    const defaults: Record<string, Record<string, string | number | boolean>> = {
      trigger: { triggerType: "manual" },
      ai: { model: "auto" },
      condition: { field: "", operator: ">=", threshold: 70 },
      action: { channel: "" },
    };
    return {
      id: `n${Date.now()}`,
      type: "fp",
      position,
      data: {
        nodeType: def.type,
        nodeKey: def.key,
        label: def.label,
        category: def.category,
        config: defaults[def.type] ?? {},
        iconEl: (CAT_ICON[def.category] ?? ZapIcon) as React.ElementType,
      },
    } as any;
  };

  const addNode = (def: NodeDef) => {
    const pos = rf.screenToFlowPosition({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 60 });
    const id = `n${Date.now()}`;
    setNodes((nds) => [...nds, { ...buildNode(def, pos), id }]);
    setSelectedId(id);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/flowpilot-node");
    const def = type ? nodeDefMap.get(type) : undefined;
    if (!def) return;
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY - 60 });
    setNodes((nds) => [...nds, buildNode(def, position)]);
  };

  const saveGraph = async (alsoRun = false) => {
    if (!id) return;
    setBusy(true);
    try {
      const serializedNodes = nodes.map((n) => {
        const d = D1(n.data);
        return {
          id: n.id,
          type: d.nodeType,
          key: d.nodeKey ?? d.nodeType,
          label: d.label,
          position: n.position,
          enabled: d.enabled !== false,
          config: d.config ?? {},
        };
      });
      const serializedEdges: WorkflowEdge[] = edges.map((e) => ({
        id: e.id, source: e.source, target: e.target,
        ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
        ...(e.label ? { label: String(e.label) } : {}),
      }));
      const payload = { name: name || "Untitled workflow", description: desc, nodes: serializedNodes, edges: serializedEdges };
      try {
        await api(`/api/workflows/${id}`, { method: "PUT", body: payload });
      } catch {
        await api("/api/workflows", { method: "POST", body: payload });
      }
      toast.success(alsoRun ? "Saved. Running…" : "Workflow saved");
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["workflow", id] });
      if (alsoRun) {
        try {
          const run = await api<{ status: string; steps: { label: string; status: string; message: string }[] }>(
            `/api/workflows/${id}/run`, { method: "POST", body: {} },
          );
          setRunResult(run);
          setRunModal(true);
          qc.invalidateQueries({ queryKey: ["executions"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Run failed");
        }
      }
    } catch {
      toast.error("Could not save workflow");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    if (!workflow) return;
    const next = workflow.status === "active" ? "paused" : "active";
    await api(`/api/workflows/${id}/status`, {
      method: "PATCH",
      body: { status: next },
    });
    qc.invalidateQueries({ queryKey: ["workflow", id] });
    toast.success(next === "active" ? "Workflow enabled" : "Workflow paused");
  };

  const groups = useMemo(() => {
    const map = new Map<string, NodeDef[]>();
    (nodeDefs ?? []).forEach((d) => map.set(d.category, [...(map.get(d.category) ?? []), d]));
    return Array.from(map.entries());
  }, [nodeDefs]);

  if (isMobile)
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center rounded-2xl border border-line bg-surface px-8 text-center">
        <Workflow className="mb-4 size-10 text-ink-faint" />
        <h2 className="font-display text-lg font-semibold text-ink">Builder needs a wider screen</h2>
        <p className="mt-2 max-w-sm text-sm text-ink-dim">Open this workflow on a laptop or desktop to edit it visually.</p>
        <Button variant="ghost" className="mt-6" onClick={() => nav("/workflows")}>
          <ArrowLeft className="size-4" /> Back to workflows
        </Button>
      </div>
    );
  if (isLoading)
    return <div className="flex h-[70vh] items-center justify-center text-sm text-ink-faint">Loading builder…</div>;

  return (
    <div className="-mx-4 flex h-[calc(100vh-110px)] flex-col lg:-mx-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => nav("/workflows")} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink">
            <ArrowLeft className="size-[18px]" />
          </button>
          <div className="min-w-0">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-56 rounded-lg bg-transparent font-display text-sm font-semibold text-ink outline-none focus:bg-surface-soft focus:px-2" />
            <div className="flex items-center gap-2 text-[11px] text-ink-faint">
              <Badge status={workflow?.status ?? "disabled"} />
              <span>{nodes.length} nodes · {edges.length} connections</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Toggle checked={workflow?.status === "active"} onChange={toggleStatus} />
          <Button size="sm" variant="soft" onClick={() => setPanel(panel === "history" ? "inspector" : "history")}>
            {panel === "history" ? <Settings2 className="size-3.5" /> : <Clock className="size-3.5" />}
            {panel === "history" ? "Inspector" : "History"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => saveGraph(false)}>
            {busy ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
          </Button>
          <Button size="sm" disabled={busy} onClick={() => saveGraph(true)}>
            <Play className="size-3.5" /> Test run
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-line bg-surface p-3">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter nodes…"
              className="input-base !py-1.5 pl-8 text-xs" />
          </div>
          {groups.map(([cat, defs]) => {
            const CatIcon = CAT_ICON[cat] ?? ZapIcon;
            const list = defs.filter((d) => d.label.toLowerCase().includes(filter.toLowerCase()));
            if (!list.length) return null;
            return (
              <div key={cat} className="mb-4">
                <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                  <CatIcon className="size-3" /> {cat}
                </p>
                <div className="space-y-1">
                  {list.map((d) => {
                    const color = nodeColor(d.type);
                    return (
                      <button key={d.type} draggable
                        onDragStart={(e) => e.dataTransfer.setData("application/flowpilot-node", d.type)}
                        onClick={() => addNode(d)} title={d.description}
                        className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface-soft px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary-faint">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}1a`, color }}>
                          <CatIcon className="size-3" />
                        </span>
                        <span className="truncate text-xs font-medium text-ink-dim">{d.label}</span>
                        <Plus className="ml-auto size-3.5 shrink-0 text-ink-faint" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="px-1 pb-2 text-[10px] leading-relaxed text-ink-faint">Tip: drag nodes onto the canvas, or click to add.</p>
        </aside>

        <div className="relative flex-1 bg-surface-soft dark:bg-[#101826]" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)} nodeTypes={nodeTypes}
            fitView minZoom={0.25} maxZoom={1.8}
          >
            <Background color="rgb(var(--c-border))" gap={22} variant={undefined} />
            <Controls position="bottom-right" />
            <MiniMap position="bottom-left" pannable zoomable
              nodeColor={(n) => nodeColor((n.data as { nodeType?: string })?.nodeType ?? "action")}
              maskColor="rgb(var(--c-border) / 0.55)"
              style={{ background: "rgb(var(--c-surface))", border: "1px solid rgb(var(--c-border))" }} />
          </ReactFlow>
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] text-ink-faint shadow-card">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-success" />
              {workflow?.status === "active" ? "Live" : workflow?.status === "paused" ? "Paused" : "Draft"}
            </span>
          </div>
        </div>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-line bg-surface">
          {panel === "inspector" && !selected && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <PanelRight className="mb-3 size-8 text-ink-faint" />
              <p className="text-sm font-semibold text-ink">Inspector</p>
              <p className="mt-1 text-xs text-ink-faint">Select a node to edit its settings.</p>
            </div>
          )}

          {panel === "inspector" && selected && selDef && sdata && (
            <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${nodeColor(sdata.nodeType)}1c`, color: nodeColor(sdata.nodeType) }}>
                        {(() => { const SelIcon = (sdata.iconEl ?? ZapIcon) as React.ElementType; return <SelIcon className="size-4" />; })()}
                      </span>
                  <div>
                    <input
                      value={sdata.label}
                      onChange={(e) => setNodes((nds) => nds.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, label: e.target.value } } : n)))}
                      className="w-40 bg-transparent text-sm font-semibold text-ink outline-none focus:bg-surface-soft focus:px-1"
                    />
                    <p className="text-[11px] text-ink-faint">{selDef.category}</p>
                  </div>
                </div>
                <button onClick={() => setNodes((nds) => nds.filter((n) => n.id !== selected.id))}
                  className="rounded-lg p-1.5 text-ink-faint hover:bg-danger/15 hover:text-danger" title="Delete node">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button onClick={duplicateSelected}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-soft px-2 py-1.5 text-[11px] font-medium text-ink-dim transition-colors hover:border-primary/40 hover:text-ink" title="Duplicate node">
                  <Copy className="size-3.5" /> Duplicate
                </button>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-soft px-2.5 py-1.5">
                  <span className="text-[11px] font-medium text-ink-dim">Active</span>
                  <Toggle checked={sdata.enabled !== false}
                    onChange={(v) => setNodes((nds) => nds.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, enabled: v } } : n)))} />
                </div>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-ink-faint">{selDef.description}</p>
              <div className="space-y-4">
                {(selDef.configFields ?? []).map((f) => {
                  const raw = (sdata.config ?? {})[f.key];
                  const value: string | number | boolean =
                    raw === undefined
                      ? ((f.defaultValue as string | number | boolean | undefined) ?? "")
                      : (raw as string | number | boolean);
                  if (f.type === "boolean")
                    return (
                      <div key={f.key} className="flex items-center justify-between">
                        <label className="text-xs font-medium text-ink-dim">{f.label}</label>
                        <Toggle checked={Boolean(value)} onChange={(v) => updateNodeConfig(f.key, v)} />
                      </div>
                    );
                  if (f.type === "select" || (f.options && f.options.length))
                    return (
                      <Select key={f.key} label={f.label} value={String(value ?? "")} onChange={(e) => updateNodeConfig(f.key, e.target.value)}>
                        <option value="">— select —</option>
                        {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                    );
                  if (f.type === "number")
                    return (
                      <div key={f.key}>
                        <label className="label">{f.label}</label>
                        <input type="number" className="input-base" value={Number(value) || 0}
                          onChange={(e) => updateNodeConfig(f.key, Number(e.target.value))} />
                      </div>
                    );
                  const isLong = f.key.includes("prompt") || f.key.includes("instruction") || f.type === "textarea" || f.type === "json";
                  const isPassword = f.type === "password";
                  return (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      {isLong ? (
                        <Textarea className="min-h-24 font-mono text-xs" value={String(value ?? "")} onChange={(e) => updateNodeConfig(f.key, e.target.value)} placeholder={f.placeholder} />
                      ) : (
                        <Input type={isPassword ? "password" : "text"} value={String(value ?? "")} onChange={(e) => updateNodeConfig(f.key, e.target.value)} placeholder={f.placeholder} />
                      )}
                      {f.help && <p className="mt-1 text-[11px] text-ink-faint">{f.help}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {panel === "history" && (
            <div className="p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock className="size-4 text-primary-soft" /> Run history
              </p>
              {wfExecutions.length === 0 ? (
                <p className="py-8 text-center text-xs text-ink-faint">No runs yet. Hit “Test run” to execute this workflow.</p>
              ) : (
                <div className="space-y-2">
                  {wfExecutions.slice(0, 15).map((ex) => (
                    <button key={ex._id} onClick={() => nav(`/executions/${ex._id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-soft px-3 py-2.5 transition-colors hover:border-primary/30">
                      <div className="flex items-center gap-2.5">
                        <span className="size-1.5 rounded-full" style={{ background: statusColor(ex.status) }} />
                        <div className="text-left">
                          <p className="text-xs font-medium text-ink">{ex.status}</p>
                          <p className="text-[10px] text-ink-faint">{timeAgo(ex.startedAt)} · {(ex.durationMs / 1000).toFixed(2)}s</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-ink-faint">{ex.steps?.length ?? 0} steps</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      <Modal open={runModal} onClose={() => setRunModal(false)} title="Test run complete">
        {runResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-soft px-4 py-3">
              <span className="text-sm font-semibold text-ink">Status</span>
              <Badge status={runResult.status} />
            </div>
            {runResult.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${statusColor(s.status)}1a`, color: statusColor(s.status) }}>
                  {s.status === "success" ? <Check className="size-3" /> : s.status === "failed" ? <X className="size-3" /> : <RefreshCw className="size-3" />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">{s.label}</p>
                  <p className="text-[11px] text-ink-faint">{s.message}</p>
                </div>
              </div>
            ))}
            <Button className="w-full" onClick={() => setRunModal(false)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}