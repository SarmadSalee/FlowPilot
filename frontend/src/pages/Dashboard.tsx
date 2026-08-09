import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PlaySquare, Workflow, Bot, Activity, Zap, Sparkles, Play, ChevronRight, Gauge,
  TrendingUp, Clock, Target, FlaskConical,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { Badge, Card, CardHeader, PageLoader, Skeleton } from "@/components/ui";
import { cn, timeAgo, fmtNum } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

const toolTipStyle = {
  background: "rgb(var(--c-surface))",
  border: "1px solid rgb(var(--c-border))",
  borderRadius: 10,
  boxShadow: "0 4px 16px rgba(16, 24, 40, 0.08)",
  fontSize: 12,
  color: "rgb(var(--c-text))",
};

export default function Dashboard() {
  const nav = useNavigate();
  const stats = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api("/api/dashboard"),
  });

  if (stats.isLoading) return <PageLoader />;
  const d = stats.data;
  const s = d?.summary;

  const cards = [
    { label: "Total executions", value: (s?.totalExecutions ?? 0).toLocaleString(), icon: PlaySquare, tint: "bg-infobg text-primary", sub: `${d?.last24hExecutions ?? 0} in last 24h` },
    { label: "Active workflows", value: `${s?.activeWorkflows ?? 0}/${s?.totalWorkflows ?? 0}`, icon: Workflow, tint: "bg-aibg text-violeta", sub: "of total" },
    { label: "AI tasks run", value: fmtNum(s?.aiTasks ?? 0), icon: Bot, tint: "bg-successbg text-success", sub: `${fmtNum(s?.tasksCompleted ?? 0)} tasks completed` },
    { label: "Success rate", value: s ? `${s.successRate}%` : "—", icon: Gauge, tint: "bg-warnbg text-warn", sub: `${fmtNum(s?.stepsProcessed ?? 0)} steps processed` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Good to see you again</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {fmtNum(s?.totalExecutions ?? 0)} total runs · saved ~{fmtNum(s?.timeSavedHours ?? 0)} work-hours
            {s?.avgDurationMs ? ` · avg ${(s.avgDurationMs / 1000).toFixed(2)}s/run` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/ai/create" className="btn btn-ghost btn-md">
            <Sparkles className="size-4 text-violeta" /> Generate with AI
          </Link>
          <Link to="/workflows" className="btn btn-primary btn-md">
            <Play className="size-4" /> New workflow
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className={cn("flex size-9 items-center justify-center rounded-lg", c.tint)}>
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-4 font-display text-[26px] font-bold leading-none text-ink">{c.value}</p>
              <p className="mt-2 text-xs font-medium text-ink-dim">{c.label}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">{c.sub}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Execution activity"
            subtitle="Runs per day over the last two weeks"
            action={<span className="flex items-center gap-1.5 text-xs text-ink-faint"><TrendingUp className="size-3.5 text-success" /> live</span>}
          />
          <div className="h-64 px-3 py-4">
            {(d?.timeSeries ?? []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(d!.timeSeries ?? []).map((x) => ({ ...x, date: x.date.slice(5) }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#98A2B3" vertical={false} opacity={0.35} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={toolTipStyle} />
                  <Area type="monotone" dataKey="executions" name="Runs" stroke="#4F46E5" strokeWidth={2} fill="#4F46E5" fillOpacity={0.06} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-faint">No executions yet this week.</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="AI usage" subtitle="Credits consumed this period" />
          <div className="px-5 pb-5">
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-aibg text-violeta">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="font-display text-3xl font-bold leading-none text-ink">{fmtNum(d?.credits?.used ?? 0)}</p>
                <p className="mt-1 text-xs text-ink-faint">of {fmtNum(d?.credits?.planLimit ?? 1000)} credits</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-surface-soft">
              <div className="h-full rounded-full bg-violeta"
                style={{ width: `${Math.min(100, ((d?.credits?.used ?? 0) / Math.max(1, d?.credits?.planLimit ?? 1000)) * 100)}%` }} />
            </div>
            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between"><span className="text-ink-faint">Tokens used</span><span className="font-mono font-medium text-ink">{(d?.credits?.used ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">AI tasks</span><span className="font-medium text-ink">{fmtNum(s?.aiTasks ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Avg duration</span><span className="font-medium text-ink">{s?.avgDurationMs ? `${(s.avgDurationMs / 1000).toFixed(2)}s` : "—"}</span></div>
            </div>
            <Link to="/billing" className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary-soft hover:underline">
              View plan <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent executions"
            action={
              <Link to="/executions" className="flex items-center gap-1 text-xs font-semibold text-primary-soft hover:underline">
                View all <ChevronRight className="size-3.5" />
              </Link>
            }
          />
          <div className="divide-y divide-line px-2 pb-2">
            {stats.isLoading ? (
              <div className="space-y-3 p-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : (d?.recent ?? []).length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-ink-faint">No executions yet.</p>
            ) : (
              d!.recent.slice(0, 6).map((e) => (
                <button key={e._id} onClick={() => nav(`/executions/${e._id}`)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-soft rounded-lg">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg",
                      e.status === "success" ? "bg-successbg text-success" : e.status === "failed" ? "bg-dangerbg text-danger" : "bg-infobg text-primary")}>
                      <Activity className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{e.workflowName}</p>
                      <p className="text-[11px] text-ink-faint">{timeAgo(e.startedAt)} · {e.steps} steps{e.isTestRun ? " · test" : ""}</p>
                    </div>
                  </div>
                  <Badge status={e.status} />
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Quick actions" />
            <div className="grid grid-cols-2 gap-2 px-5 pb-5">
              {([
                ["AI Creator", Sparkles, "/ai/create", "text-violeta bg-aibg"],
                ["Templates", Target, "/templates", "text-primary bg-infobg"],
                ["Executions", Activity, "/executions", "text-success bg-successbg"],
                ["Analytics", Gauge, "/analytics", "text-warn bg-warnbg"],
              ] as const).map(([label, Icon, to, tint]) => (
                <Link key={label} to={to} className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-2 py-4 transition-colors hover:border-primary/40 hover:bg-surface-soft">
                  <span className={cn("flex size-8 items-center justify-center rounded-lg", tint.split(" ")[1])}>
                    <Icon className={cn("size-4", tint.split(" ")[0])} />
                  </span>
                  <span className="text-xs font-medium text-ink-dim">{label}</span>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-infobg text-primary">
                <FlaskConical className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">Run a demo workflow</h3>
                <p className="mt-0.5 text-xs text-ink-faint">See a full flow execute with AI end to end.</p>
              </div>
            </div>
            <Link to="/workflows" className="btn btn-soft btn-sm mt-4 w-full">
              <Play className="size-3.5" /> Run demo
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}