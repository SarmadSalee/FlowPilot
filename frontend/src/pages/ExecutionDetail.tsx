import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Cpu, GitBranch, Zap as ZapIcon, Check, X, RefreshCw, Clock, Workflow, FlaskConical } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, Button, Card } from "@/components/ui";
import { cn, fmtTime, nodeColor, statusColor } from "@/lib/utils";
import type { Execution, ExecutionStep } from "@/lib/types";

const iconFor = (step: ExecutionStep) => {
  const k = step.nodeKey ?? "";
  if (k.startsWith("condition")) return GitBranch;
  if (k.startsWith("trigger")) return Play;
  if (k.startsWith("ai")) return Cpu;
  return ZapIcon;
};

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: ex, isLoading } = useQuery<Execution>({
    queryKey: ["execution", id],
    queryFn: () => api(`/api/executions/${id}`),
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      return st === "running" || st === "waiting" || st === "queued" ? 1500 : false;
    },
  });

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center text-sm text-ink-faint">Loading execution...</div>;
  if (!ex) return <div className="py-10 text-sm text-ink-faint">Execution not found.</div>;

  const steps = ex.steps ?? [];
  const ok = steps.filter((s) => s.status === "success").length;
  const fail = steps.filter((s) => s.status === "failed").length;
  const pending = steps.filter((s) => s.status === "running" || s.status === "waiting").length;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => nav("/executions")} className="mb-4 flex items-center gap-2 text-sm text-ink-faint hover:text-ink">
        <ArrowLeft className="size-4" /> Back to executions
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-2xl font-bold text-ink">
            <Workflow className="size-6 text-primary-soft" /> {ex.workflowName ?? "Workflow"}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Trigger: {ex.trigger ?? ex.triggerType ?? "manual"} · Started {ex.startedAt ? fmtTime(ex.startedAt) : "-"}
            {ex.completedAt ? ` · Done ${fmtTime(ex.completedAt)}` : ""}
            {ex.isTestRun && <span className="chip ml-2 !py-0 text-[10px] text-violeta"><FlaskConical className="size-2.5" /> test run</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge status={ex.status} className="!px-3 !py-1 !text-sm">{ex.status}</Badge>
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-ink">{ex.durationMs ? `${(ex.durationMs / 1000).toFixed(2)}s` : "..."}</p>
            <p className="text-[11px] text-ink-faint">total time</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-ink-faint">Steps</p><p className="mt-1 font-display text-xl font-bold text-ink">{steps.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-faint">Succeeded</p><p className="mt-1 font-display text-xl font-bold text-success">{ok}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-faint">Pending</p><p className="mt-1 font-display text-xl font-bold text-primary-soft">{pending}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-faint">Failed</p><p className="mt-1 font-display text-xl font-bold text-danger">{fail}</p></Card>
      </div>

      <div className="relative mt-8">
        <div className="absolute bottom-2 left-[19px] top-2 w-px bg-line-strong" />
        <div className="space-y-4">
          {steps.map((s, i) => {
            const color = statusColor(s.status);
            const Icon = iconFor(s);
            const note = s.status === "success" ? <Check className="size-4" /> : s.status === "failed" ? <X className="size-4" /> : <Clock className="size-4" />;
            return (
              <div key={s.nodeId ?? i} className="relative flex gap-4">
                <span className="z-10 mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface"
                  style={{ color: nodeColor(s.nodeId && s.nodeKey?.startsWith("condition") ? "condition" : s.nodeKey?.startsWith("ai") ? "ai" : s.nodeKey?.startsWith("trigger") ? "trigger" : "action"), boxShadow: `0 0 0 3px ${color}15` }}>
                  <Icon className="size-4" />
                </span>
                <Card className="flex-1 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex size-4 items-center justify-center rounded-full", s.status === "success" && "text-success", s.status === "failed" && "text-danger", (s.status === "running" || s.status === "waiting") && "animate-pulse text-primary-soft")}>
                        {note}
                      </span>
                      <p className="text-sm font-semibold text-ink">{s.label ?? `Step ${i + 1}`}</p>
                      {s.nodeKey && <span className="chip !py-0 text-[9px]">{s.nodeKey}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-faint">{s.durationMs ? `${(s.durationMs / 1000).toFixed(2)}s` : ""}</span>
                      <Badge status={s.status}>{s.status}</Badge>
                    </div>
                  </div>
                  {s.message && <p className="mt-2 text-xs leading-relaxed text-ink-dim">{s.message}</p>}
                  {s.error && <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{s.error}</p>}
                  {(s.input || s.output) && (
                    <details className="mt-3 rounded-xl border border-line bg-surface-soft px-3 py-2">
                      <summary className="cursor-pointer text-[11px] font-semibold text-primary-soft">View data</summary>
                      <pre className="mt-2 max-h-48 overflow-auto text-[10px] leading-relaxed text-ink-dim">
                        {JSON.stringify({ input: s.input ?? {}, output: s.output ?? {} }, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="ghost" onClick={() => nav(`/workflows/${ex.workflowId}`)}>
          <Workflow className="size-4" /> Open workflow
        </Button>
        <Button onClick={async () => {
          await api(`/api/workflows/${ex.workflowId}/run`, { method: "POST", body: {} });
          nav("/executions");
        }}>
          <RefreshCw className="size-4" /> Re-run workflow
        </Button>
      </div>
    </div>
  );
}