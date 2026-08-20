import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Users, Gauge, Flame, Target, Activity, Building2, Mail, Radio, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, Input, Modal,
  Select, Skeleton,
} from "@/components/ui";
import {
  cn, timeAgo, scoreColor, qualificationLabel, intentLabel,
  intentColor, statusLabel, eventTypeLabel,
} from "@/lib/utils";
import { useLeadStream } from "@/hooks/useLeadStream";
import type { Lead, LeadAnalytics, LeadListResult, LeadOutcome } from "@/lib/types";

function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-line-strong" stroke="currentColor" opacity={0.25} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          stroke={scoreColor(score)}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: scoreColor(score) }}>
        {score}
      </span>
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-soft">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      <span className="font-mono text-[11px] text-ink-dim">{value}</span>
    </div>
  );
}

function LiveFeed() {
  const { events, connected } = useLeadStream();
  const nav = useNavigate();

  const items = events.slice(0, 14);
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Live lead feed"
        subtitle="Realtime scoring activity"
        action={
          <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", connected ? "text-success" : "text-ink-faint")}>
            <span className={cn("size-1.5 rounded-full", connected ? "bg-success animate-pulse-dot" : "bg-line-strong")} />
            {connected ? "live" : "connecting"}
          </span>
        }
      />
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" style={{ maxHeight: 560 }}>
        {items.length === 0 && (
          <div className="px-3 py-10 text-center">
            <Radio className="mx-auto size-5 text-ink-faint" />
            <p className="mt-2 text-xs text-ink-faint">No live activity yet. Add an event or create a lead to see it appear here instantly.</p>
          </div>
        )}
        {items.map((e, i) => {
          const Icon = e.type === "lead_created" ? Users : e.type === "score_changed" ? Gauge : Activity;
          const tone = e.delta != null && e.delta > 0 ? "text-success" : e.delta != null && e.delta < 0 ? "text-danger" : "text-accent";
          return (
            <button
              key={`${e.at}-${i}`}
              onClick={() => e.leadId && nav(`/leads/${e.leadId}`)}
              className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-soft"
            >
              <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-soft", tone)}>
                <Icon className="size-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink">
                  {e.leadName ?? (e.type === "lead_created" ? "New lead" : eventTypeLabel(e.eventType ?? e.type))}
                </p>
                <p className="truncate text-[11px] text-ink-faint">{e.reason ?? (e.type === "score_changed" ? "Score updated" : "Event processed")}</p>
              </div>
              {e.score != null && (
                <span className={cn("font-mono text-[11px] font-semibold", tone)}>
                  {e.delta != null && e.delta > 0 && "+"}{e.delta ?? ""} {e.score != null ? `→${e.score}` : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AddLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", jobTitle: "", source: "Website form" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      const res = await api<{ leadId: string; outcome: LeadOutcome }>("/api/leads", { body: form });
      toast.success(`Lead scored ${res.outcome.score} — ${res.outcome.qualification ?? "scored"}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-analytics"] });
      onClose();
      setForm({ name: "", email: "", company: "", jobTitle: "", source: "Website form" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a lead" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={submit}>Create & score</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-faint">FlowPilot will run AI lead qualification immediately and push the result to the live feed.</p>
        <Input label="Full name" value={form.name} onChange={set("name")} placeholder="Sarah Khan" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="sarah@acme.com" />
          <Input label="Company" value={form.company} onChange={set("company")} placeholder="Acme Corp" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Job title" value={form.jobTitle} onChange={set("jobTitle")} placeholder="VP Operations" />
          <Select label="Source" value={form.source} onChange={set("source")}>
            {["Website form", "LinkedIn", "WhatsApp", "Referral", "Webinar", "Instagram", "Manual"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
}

const STATUSES = ["all", "new", "contacted", "qualified", "unqualified", "converted", "lost", "spam"];
const QUALIFICATIONS = ["all", "hot", "warm", "qualified", "cold", "unqualified"];
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "score_desc", label: "Highest score" },
  { value: "score_asc", label: "Lowest score" },
  { value: "icp_desc", label: "Best ICP match" },
  { value: "updated", label: "Recently active" },
];

export default function Leads() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [qualification, setQualification] = useState("all");
  const [sort, setSort] = useState("newest");
  const [addOpen, setAddOpen] = useState(false);
  const [debounced, setDebounced] = useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (debounced) p.set("search", debounced);
    if (status !== "all") p.set("status", status);
    if (qualification !== "all") p.set("qualification", qualification);
    p.set("sort", sort);
    p.set("limit", "100");
    return p.toString();
  }, [debounced, status, qualification, sort]);

  const listQ = useQuery<LeadListResult>({
    queryKey: ["leads", params],
    queryFn: () => api(`/api/leads?${params}`),
  });
  const anQ = useQuery<LeadAnalytics>({
    queryKey: ["lead-analytics"],
    queryFn: () => api("/api/leads/analytics"),
  });

  const s = anQ.data?.summary;
  const cards = [
    { label: "Total leads", value: s?.totalLeads ?? 0, icon: Users, tint: "bg-infobg text-primary", sub: `${s?.newLeads7d ?? 0} new in 7d` },
    { label: "Avg score", value: s?.avgScore ?? "—", icon: Gauge, tint: "bg-surface-soft text-primary", sub: `avg ICP ${s?.avgIcpScore ?? "—"}` },
    { label: "Hot / warm", value: `${s?.hot ?? 0} / ${s?.warm ?? 0}`, icon: Flame, tint: "bg-dangerbg text-danger", sub: `${s?.qualified ?? 0} qualified` },
    { label: "High intent", value: s?.highIntent ?? 0, icon: Target, tint: "bg-warnbg text-warn", sub: `${s?.scoreChanges24h ?? 0} changes in 24h` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink-dim">Real-time AI scoring, ICP fit and qualification for every lead.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/leads/rules" className="btn btn-ghost btn-md">
            <Target className="size-4 text-primary" /> Scoring rules
          </Link>
          <Button icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>Add lead</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className={cn("flex size-9 items-center justify-center rounded-lg", c.tint)}><Icon className="size-4" /></span>
              </div>
              <p className="mt-4 font-display text-[26px] font-bold leading-none text-ink">{c.value}</p>
              <p className="mt-2 text-xs font-medium text-ink-dim">{c.label}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">{c.sub}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <Input className="pl-9" placeholder="Search name, email, company…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
                {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "Status" : statusLabel(s)}</option>)}
              </Select>
              <Select value={qualification} onChange={(e) => setQualification(e.target.value)} className="w-36">
                {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q === "all" ? "Qualification" : qualificationLabel(q)}</option>)}
              </Select>
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-40">
                {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>

          {listQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (listQ.data?.leads.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title="No leads yet"
              message="Add your first lead and FlowPilot will score and qualify it with AI instantly."
              action={<Button icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>Add lead</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[820px] grid-cols-[2fr_1fr_90px_1fr_1fr_1fr_120px] items-center gap-3 border-b border-line bg-surface-soft/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <span>Lead</span>
                <span>Company</span>
                <span className="text-center">Score</span>
                <span>ICP fit</span>
                <span>Intent</span>
                <span>Status</span>
                <span className="text-right">Last active</span>
              </div>
              {listQ.data?.leads.map((l) => (
                <button
                  key={l._id}
                  onClick={() => nav(`/leads/${l._id}`)}
                  className="grid w-full min-w-[820px] grid-cols-[2fr_1fr_90px_1fr_1fr_1fr_120px] items-center gap-3 border-b border-line px-5 py-3 text-left transition-colors last:border-0 hover:bg-surface-soft/60"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={l.name} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-ink">{l.name}</span>
                        {l.intent === "high" && <span className="rounded bg-dangerbg px-1 py-px text-[9px] font-bold text-danger">INTENT</span>}
                      </span>
                      <span className="flex items-center gap-1 truncate text-[11px] text-ink-faint">
                        <Mail className="size-3" /> {l.email ?? "no email"} · {l.location ?? "—"}
                      </span>
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 truncate text-xs font-medium text-ink-dim">
                      <Building2 className="size-3.5 shrink-0 text-ink-faint" />
                      <span className="truncate">{l.company ?? "—"}</span>
                    </span>
                    <span className="truncate text-[11px] text-ink-faint">{l.jobTitle ?? "—"}</span>
                  </span>
                  <span className="flex items-center justify-center gap-2">
                    <ScoreRing score={l.score} />
                  </span>
                  <span><MiniBar value={l.icpScore ?? 0} color={scoreColor(l.score)} /></span>
                  <span>
                    <span className="text-xs font-semibold" style={{ color: intentColor(l.intent) }}>{intentLabel(l.intent)}</span>
                  </span>
                  <span><Badge status={l.status}>{statusLabel(l.status)}</Badge></span>
                  <span className="text-right text-[11px] text-ink-faint">{timeAgo(l.lastActivityAt ?? l.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}

          {listQ.data && listQ.data.total > 0 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-ink-faint">
              <span>Showing {listQ.data.leads.length} of {listQ.data.total} leads</span>
              <span className="flex items-center gap-1 text-success"><TrendingUp className="size-3.5" /> scored automatically</span>
            </div>
          )}
        </Card>

        <LiveFeed />
      </div>

      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}