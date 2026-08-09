import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, Clock, BrainCircuit, ChevronRight, Boxes } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui";
import { fmtNum } from "@/lib/utils";
import type { DashboardSummary, DaySeries, WorkflowUsage } from "@/lib/types";

const toolTip = {
  background: "rgb(var(--c-surface))",
  border: "1px solid rgb(var(--c-border))",
  borderRadius: 12,
  fontSize: 12,
  color: "rgb(var(--c-text))",
};

export default function Analytics() {
  const summary = useQuery<DashboardSummary>({
    queryKey: ["analytics-summary"],
    queryFn: () => api("/api/analytics/summary"),
  });
  const series = useQuery<DaySeries[]>({
    queryKey: ["analytics-series"],
    queryFn: () => api("/api/analytics/time-series?days=14"),
  });
  const used = useQuery<WorkflowUsage[]>({
    queryKey: ["analytics-used"],
    queryFn: () => api("/api/analytics/used-workflows"),
  });

  const s = summary.data;

  const cards = [
    { icon: Activity, label: "Total runs", value: fmtNum(s?.totalExecutions ?? 0), color: "#6366F1" },
    { icon: Gauge, label: "Success rate", value: s ? `${s.successRate}%` : "-", color: "#34D399" },
    { icon: Clock, label: "Avg runtime", value: s ? `${(s.avgDurationMs / 1000).toFixed(2)}s` : "-", color: "#22D3EE" },
    { icon: BrainCircuit, label: "AI tasks", value: fmtNum(s?.aiTasks ?? 0), color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-dim">How your automations are performing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg" style={{ background: `${c.color}16`, color: c.color }}>
                  <Icon className="size-4" />
                </span>
                <p className="text-xs text-ink-faint">{c.label}</p>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink">Runs per day (14d)</h3>
          <div className="h-64">
            {series.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(series.data ?? []).map((x) => ({ ...x, date: x.date.slice(5) }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={toolTip} />
                  <Area type="monotone" dataKey="executions" name="Runs" stroke="#8B5CF6" strokeWidth={2} fill="url(#anG)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink">Runs by workflow</h3>
          <div className="h-64">
            {used.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (used.data ?? []).length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-faint">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(used.data ?? []).map((w) => ({ name: w.name.slice(0, 18), runs: w.total }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={toolTip} cursor={{ fill: "rgba(148,163,184,0.05)" }} />
                  <Bar dataKey="runs" radius={[6, 6, 0, 0]} fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink">Success rate by workflow</h3>
          <div className="space-y-4">
            {used.isLoading ? (
              <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : (used.data ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-faint">No data yet</p>
            ) : (
              (used.data ?? []).slice(0, 6).map((w) => {
                const rate = w.total ? Math.round((w.successful / w.total) * 100) : 0;
                return (
                  <div key={w.workflowId}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate text-ink-dim">{w.name}</span>
                      <span className="font-mono text-ink-faint">{rate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-soft">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Link to="/executions" className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary-soft hover:underline">
            View all executions <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink">Overview</h3>
          <div className="space-y-3">
            {summary.isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
              : [
                  { label: "Successful runs", value: s?.successful ?? 0 },
                  { label: "Failed runs", value: s?.failed ?? 0 },
                  { label: "Steps processed", value: fmtNum(s?.stepsProcessed ?? 0) },
                  { label: "Tasks created", value: fmtNum(s?.tasksCompleted ?? 0) },
                  { label: "Time saved", value: s ? `${s.timeSavedHours}h` : "-" },
                  { label: "Total workflows", value: s?.totalWorkflows ?? 0 },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                    <span className="text-xs text-ink-dim">{r.label}</span>
                    <span className="font-display text-sm font-bold text-ink">{r.value}</span>
                  </div>
                ))}
          </div>
          <Link to="/workflows" className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary-soft hover:underline">
            <Boxes className="size-3.5" /> Manage workflows
          </Link>
        </div>
      </div>
    </div>
  );
}