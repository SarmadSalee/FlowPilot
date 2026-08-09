import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Workflow as WorkflowIcon, Play, Copy, Trash2, MoreVertical, Sparkles, Boxes, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Input, Modal, Skeleton, Toggle } from "@/components/ui";
import { cn, nodeColor, timeAgo } from "@/lib/utils";
import type { Workflow } from "@/lib/types";

export default function Workflows() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["workflows"],
    queryFn: () => api("/api/workflows"),
  });

  const createMut = useMutation({
    mutationFn: () =>
      api<Workflow>("/api/workflows", {
        method: "POST",
        body: {
          name: name || "Untitled workflow",
          description: desc,
          nodes: [
            { id: "n1", type: "trigger", key: "manual", label: "Manual Trigger", position: { x: 120, y: 200 }, config: {} },
          ],
          edges: [],
        },
      }),
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      setCreateOpen(false);
      setName("");
      setDesc("");
      nav(`/workflows/${wf._id}`);
    },
    onError: () => toast.error("Could not create workflow"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/api/workflows/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated");
    },
    onError: () => toast.error("Could not update workflow"),
  });

  const runMut = useMutation({
    mutationFn: (id: string) => api(`/api/workflows/${id}/run`, { method: "POST", body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Workflow execution started");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const duplicateMut = useMutation({
    mutationFn: (id: string) => {
      const wf = workflows?.find((w) => w._id === id);
      if (!wf) return Promise.reject();
      return api<Workflow>("/api/workflows", {
        method: "POST",
        body: { name: `${wf.name} (copy)`, description: wf.description, nodes: wf.nodes, edges: wf.edges },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Duplicated");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/workflows/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
  });

  const filtered = useMemo(() => {
    const list = workflows ?? [];
    if (!q.trim()) return list;
    return list.filter((w) => w.name.toLowerCase().includes(q.toLowerCase()));
  }, [workflows, q]);

  const nextStatus = (w: Workflow) => (w.status === "paused" || w.status === "draft" ? "active" : w.status === "active" ? "paused" : "draft");
  const statusVerb = (w: Workflow) => (w.status === "active" ? "Pause" : "Enable");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Workflows</h1>
          <p className="mt-1 text-sm text-ink-dim">Automations you've built with FlowPilot.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai/create" className="btn btn-soft btn-md">
            <Sparkles className="size-4" /> Generate with AI
          </Link>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New workflow
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <Input placeholder="Search workflows…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (filtered.length === 0 && !q) ? (
        <Card>
          <EmptyState
            icon={WorkflowIcon}
            title="No workflows yet"
            message="Create one from scratch, or let AI build it from a description."
            action={
              <div className="flex gap-2">
                <Button onClick={() => setCreateOpen(true)}><Boxes className="size-4" /> New workflow</Button>
                <Link to="/ai/create" className="btn btn-soft btn-md"><Sparkles className="size-4" /> Try AI creator</Link>
              </div>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={WorkflowIcon} title="No matches" message="Try a different search." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((wf) => {
            const cardNodes = (wf.nodes ?? []).slice(0, 4);
            const successPct = wf.runCount ? Math.round((wf.successCount / wf.runCount) * 100) : null;
            return (
              <Card key={wf._id} className="group relative flex flex-col p-5 transition-all duration-200 hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <Link to={`/workflows/${wf._id}`} className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-ink group-hover:text-primary-soft">{wf.name}</h3>
                    {wf.description && <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{wf.description}</p>}
                  </Link>
                  <div className="relative">
                    <button onClick={() => setMenuFor(menuFor === wf._id ? null : wf._id)}
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink">
                      <MoreVertical className="size-4" />
                    </button>
                    {menuFor === wf._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-card animate-fade-in">
                          <button onClick={() => { setMenuFor(null); runMut.mutate(wf._id); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-ink-dim hover:bg-surface-soft hover:text-ink">
                            <Play className="size-3.5" /> Run now
                          </button>
                          <button onClick={() => { setMenuFor(null); duplicateMut.mutate(wf._id); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-ink-dim hover:bg-surface-soft hover:text-ink">
                            <Copy className="size-3.5" /> Duplicate
                          </button>
                          <button onClick={() => { setMenuFor(null); nav(`/workflows/${wf._id}`); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-ink-dim hover:bg-surface-soft hover:text-ink">
                            <Boxes className="size-3.5" /> Open builder
                          </button>
                          <button onClick={() => { setMenuFor(null); if (confirm(`Delete "${wf.name}"?`)) deleteMut.mutate(wf._id); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10">
                            <Trash2 className="size-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-1 items-center gap-1.5 overflow-hidden rounded-xl border border-line bg-surface-soft px-3 py-3">
                  {cardNodes.length ? (
                    cardNodes.map((n, i) => (
                      <React.Fragment key={n.id}>
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${nodeColor(n.type)}1c`, color: nodeColor(n.type) }} title={n.label}>
                          {n.type === "condition" ? <GitBranchMini /> : <Play className="size-3.5" />}
                        </span>
                        {i < cardNodes.length - 1 && <span className="h-px flex-1 bg-line" />}
                      </React.Fragment>
                    ))
                  ) : (
                    <span className="text-xs text-ink-faint">Empty workflow</span>
                  )}
                  {cardNodes.length > 4 && <span className="ml-1 whitespace-nowrap text-[10px] text-ink-faint">+{cardNodes.length - 4}</span>}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge status={wf.status}>{wf.status}</Badge>
                    {successPct !== null && <span className="text-[11px] text-ink-faint">{successPct}% success</span>}
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                    <Clock className="size-3" /> {wf.runCount} runs{wf.lastRunAt ? ` · ${timeAgo(wf.lastRunAt)}` : ""}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                  <Toggle checked={wf.status === "active"}
                    onChange={(v) => toggleMut.mutate({ id: wf._id, status: v ? "active" : "paused" })} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => runMut.mutate(wf._id)}>
                      <Play className="size-3.5 text-success" /> Run
                    </Button>
                    <Link to={`/workflows/${wf._id}`} className="btn btn-soft btn-sm">Open</Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a workflow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} loading={createMut.isPending}>
              <Play className="size-4" /> Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" placeholder="e.g. Lead follow-up" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus />
          <Input label="Description (optional)" placeholder="What does this automate?" value={desc}
            onChange={(e) => setDesc(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

const GitBranchMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6"/><circle cx="18" cy="12" r="3"/><path d="M6 9a9 9 0 0 1 9 3"/>
  </svg>
);