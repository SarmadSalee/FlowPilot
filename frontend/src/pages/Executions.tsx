import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, PlaySquare, RefreshCw, FlaskConical } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, Card, EmptyState, Input, Select } from "@/components/ui";
import { cn, fmtDateTime, statusColor, timeAgo } from "@/lib/utils";
import type { Execution } from "@/lib/types";

interface ExecutionRow {
  _id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  durationMs: number;
  isTestRun?: boolean;
  trigger?: string;
  stepCount: number;
  createdAt: string;
  error?: string;
}

interface ListResponse {
  executions: ExecutionRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = ["all", "success", "failed", "running", "waiting"];

export default function Executions() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [workflow, setWorkflow] = useState("all");

  const { data, isLoading, refetch, isFetching } = useQuery<ListResponse>({
    queryKey: ["executions"],
    queryFn: () => api("/api/executions?limit=100"),
  });
  const executions = data?.executions ?? [];

  const workflows = useMemo(() => {
    const names = new Map<string, string>();
    executions.forEach((e) => e.workflowId && !names.has(e.workflowId) && names.set(e.workflowId, e.workflowName ?? "Workflow"));
    return Array.from(names.entries());
  }, [executions]);

  const filtered = useMemo(() => {
    let list = executions;
    if (status !== "all") list = list.filter((e) => e.status === status);
    if (workflow !== "all") list = list.filter((e) => e.workflowId === workflow);
    if (q.trim())
      list = list.filter((e) =>
        (e.workflowName ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (e.trigger ?? "").toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [executions, q, status, workflow]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Executions</h1>
          <p className="mt-1 text-sm text-ink-dim">Every run of your automations, with full step detail.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-faint">{data?.total ?? 0} total runs</span>
          <button onClick={() => refetch()} className="btn btn-ghost btn-md">
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search runs..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={workflow} onChange={(e) => setWorkflow(e.target.value)} className="w-48">
          <option value="all">All workflows</option>
          {workflows.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-soft" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={PlaySquare} title="No executions found"
            message="Run a workflow to see its executions here."
            action={<button onClick={() => nav("/workflows")} className="btn btn-soft btn-md">Browse workflows</button>} />
        ) : (
          <div className="divide-y divide-line">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-line bg-surface-soft/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <span>Workflow</span><span>Trigger</span><span>Started</span><span>Duration</span><span className="text-right">Status</span>
            </div>
            {filtered.map((e) => (
              <button key={e._id} onClick={() => nav(`/executions/${e._id}`)}
                className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-surface-soft">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusColor(e.status) }} />
                  <span className="truncate text-sm font-medium text-ink">{e.workflowName ?? "Workflow"}</span>
                  {e.isTestRun && (
                    <span className="chip !py-0 !text-[9px] text-violeta"><FlaskConical className="size-2.5" /> test</span>
                  )}
                </div>
                <span className="truncate text-xs text-ink-dim">{e.trigger ?? "manual"}</span>
                <span className="text-xs text-ink-dim" title={fmtDateTime(e.startedAt ?? e.createdAt)}>{timeAgo(e.startedAt ?? e.createdAt)}</span>
                <span className="font-mono text-xs text-ink-faint">{e.durationMs ? `${(e.durationMs / 1000).toFixed(2)}s` : "-"}</span>
                <span className="flex items-center justify-end gap-2">
                  <span className="hidden text-[10px] text-ink-faint lg:inline">{e.stepCount} steps</span>
                  <Badge status={e.status} />
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}