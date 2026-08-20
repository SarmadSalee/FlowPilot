import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, RefreshCw, Plus, Mail, Building2, Briefcase, MapPin, Globe, Database, Tags as TagsIcon,
  Sparkles, Target, CheckCircle2, ChevronUp, ChevronDown, Activity as ActivityIcon, Bot, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, Input, Modal, PageLoader, Select, Tag,
} from "@/components/ui";
import {
  cn, timeAgo, fmtDateTime, scoreColor, qualificationLabel, intentLabel, intentColor,
  statusLabel, stageLabel, eventTypeLabel, scoreFactorKindColor,
} from "@/lib/utils";
import type { Lead, LeadDetail, LeadOutcome, LeadTimelineItem } from "@/lib/types";

const EVENT_TYPES = [
  "email_opened", "email_replied", "link_clicked", "website_visited",
  "demo_requested", "meeting_booked", "form_submitted", "whatsapp_message",
  "instagram_clicked", "no_engagement", "unsubscribed",
];

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} stroke="currentColor" className="text-line-strong" opacity={0.3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          stroke={scoreColor(score)}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none" style={{ color: scoreColor(score) }}>{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint">/ 100</span>
      </span>
    </div>
  );
}

function AddEventModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("email_opened");
  const [note, setNote] = useState("");

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api<LeadOutcome>(`/api/leads/${lead._id}/events`, {
        body: { type, payload: note ? { text: note } : {} },
      });
      toast.success(`Score ${res.delta > 0 ? "+" : ""}${res.delta} → ${res.score}`);
      qc.invalidateQueries({ queryKey: ["lead-detail", lead._id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      onClose();
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add activity event"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={submit}>Process event</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-faint">The event is persisted, scored in real time, and broadcast to your live feed.</p>
        <Select label="Event type" value={type} onChange={(e) => setType(e.target.value)}>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{eventTypeLabel(t)}</option>)}
        </Select>
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Asked about the Business plan pricing" />
      </div>
    </Modal>
  );
}

function TimelineItem({ row }: { row: LeadTimelineItem }) {
  if (row.kind === "score") {
    const up = (row.delta ?? 0) > 0;
    return (
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", up ? "bg-successbg text-success" : row.delta === 0 ? "bg-surface-soft text-ink-faint" : "bg-dangerbg text-danger")}>
          {up ? <ChevronUp className="size-4" /> : row.delta === 0 ? <ActivityIcon className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="text-xs font-semibold text-ink">Score changed</p>
            <span className="font-mono text-[11px]" style={{ color: up ? "#16A34A" : "#DC2626" }}>
              {row.previousScore} → {row.score} ({up ? "+" : ""}{row.delta})
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-dim">{row.reason}</p>
          {row.eventType && <Tag className="mt-1">{eventTypeLabel(row.eventType)}</Tag>}
        </div>
        <span className="shrink-0 text-[11px] text-ink-faint">{fmtDateTime(row.at)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-infobg text-primary">
        <ActivityIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">{eventTypeLabel(row.type ?? "activity")}</p>
        <p className="mt-0.5 text-[11px] text-ink-dim">{row.reason}</p>
        {row.channel && <Tag className="mt-1">{row.channel}</Tag>}
      </div>
      <span className="shrink-0 text-[11px] text-ink-faint">{fmtDateTime(row.at)}</span>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [eventOpen, setEventOpen] = useState(false);
  const [rescoreBusy, setRescoreBusy] = useState(false);
  const [tab, setTab] = useState<"activity" | "analyses">("activity");

  const q = useQuery<LeadDetail>({
    queryKey: ["lead-detail", id],
    queryFn: () => api(`/api/leads/${id}`),
    enabled: !!id,
  });

  const rescore = async () => {
    setRescoreBusy(true);
    try {
      const res = await api<LeadOutcome>(`/api/leads/${id}/rescore`, { body: { reason: "Manual rescore" } });
      toast.success(`Rescored → ${res.score} (${res.qualification ?? "updated"})`);
      qc.invalidateQueries({ queryKey: ["lead-detail", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-analytics"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rescore failed");
    } finally {
      setRescoreBusy(false);
    }
  };

  if (q.isLoading || !q.data) return <PageLoader />;
  const { lead, score, analyses, history, events } = q.data;

  const timeline: LeadTimelineItem[] = useMemo(() => {
    const rows: LeadTimelineItem[] = [
      ...history.map((h) => ({
        kind: "score" as const, id: h._id, at: h.createdAt, score: h.score, previousScore: h.previousScore,
        delta: h.delta, reason: h.reason ?? "Score updated", source: h.source, eventType: h.eventType,
      })),
      ...events.map((e) => ({
        kind: "event" as const, id: e._id, at: e.createdAt, type: e.type, channel: e.channel,
        scoreDelta: e.scoreDelta, detectedIntent: e.detectedIntent,
        reason: typeof e.payload?.text === "string" ? (e.payload.text as string).slice(0, 160) : eventTypeLabel(e.type),
      })),
    ];
    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return rows;
  }, [history, events]);

  const profileRows = [
    { icon: Mail, label: "Email", value: lead.email },
    { icon: Building2, label: "Company", value: lead.company },
    { icon: Briefcase, label: "Job title", value: lead.jobTitle },
    { icon: MapPin, label: "Location", value: lead.location },
    { icon: Globe, label: "Website", value: lead.website },
    { icon: Database, label: "Revenue", value: lead.revenue != null ? `$${lead.revenue.toLocaleString()}` : undefined },
    { icon: Target, label: "Source", value: lead.source },
  ].filter((r) => r.value);

  const metBars = [
    { label: "ICP fit", value: lead.icpScore ?? 0, color: scoreColor(lead.score) },
    { label: "Engagement", value: lead.engagementScore ?? 0, color: "#2563EB" },
    { label: "Buying intent", value: lead.intentScore ?? 0, color: intentColor(lead.intent) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/leads" className="mt-1 flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-dim transition-colors hover:border-primary/40 hover:text-ink">
            <ArrowLeft className="size-4" />
          </Link>
          <Avatar name={lead.name} className="size-12 text-sm" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{lead.name}</h1>
              {lead.intent === "high" && <span className="rounded bg-dangerbg px-1.5 py-0.5 text-[10px] font-bold text-danger">HIGH INTENT</span>}
            </div>
            <p className="mt-1 text-sm text-ink-dim">
              {[lead.jobTitle, lead.company, lead.location].filter(Boolean).join(" · ") || "No profile info"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" icon={<Plus className="size-4" />} onClick={() => setEventOpen(true)}>Add event</Button>
          <Button variant="soft" loading={rescoreBusy} icon={<RefreshCw className="size-4" />} onClick={rescore}>Rescore</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Intelligence panel */}
        <Card className="lg:col-span-2">
          <CardHeader title="AI intelligence" subtitle="How FlowPilot scored this lead"
            action={<Tag>{score?.provider ?? "builtin"} · {score?.model ?? "builtin"}</Tag>} />
          <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={lead.score} />
              <span className="text-xs font-semibold" style={{ color: scoreColor(lead.score) }}>{qualificationLabel(lead.qualification)}</span>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge status={lead.qualification}>{qualificationLabel(lead.qualification)}</Badge>
                <Badge status={lead.status}>{statusLabel(lead.status)}</Badge>
                <Badge status={lead.intent}>{intentLabel(lead.intent)} intent</Badge>
                <Badge status="running">Grade {lead.grade}</Badge>
                <Tag>{stageLabel(lead.buyingStage)}</Tag>
                {lead.confidence > 0 && <Tag>AI confidence {(lead.confidence * 100).toFixed(0)}%</Tag>}
              </div>
              {score?.summary && <p className="text-sm leading-relaxed text-ink-dim">{score.summary}</p>}
              {score?.explanation && <p className="text-xs leading-relaxed text-ink-faint">{score.explanation}</p>}
              <div className="space-y-2 pt-1">
                {metBars.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-ink-dim">{b.label}</span>
                      <span className="font-mono text-ink-faint">{b.value}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, b.value)}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
              {lead.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <TagsIcon className="size-3.5 text-ink-faint" />
                  {lead.tags.map((t) => <Tag key={t}>#{t}</Tag>)}
                </div>
              )}
            </div>
          </div>

          {score && score.factors.length > 0 && (
            <div className="border-t border-line px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Score factors</p>
              <div className="space-y-1.5">
                {score.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft/60 px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-ink-dim">
                      <Sparkles className={cn("size-3.5", f.kind === "positive" ? "text-success" : f.kind === "negative" ? "text-danger" : "text-ink-faint")} />
                      {f.label}
                    </span>
                    <span className="font-mono text-xs font-semibold" style={{ color: scoreFactorKindColor(f.kind) }}>
                      {f.delta > 0 ? "+" : ""}{f.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {score?.recommendedAction?.title && (
            <div className="border-t border-line px-5 py-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <Target className="size-3.5" /> Recommended next step
              </p>
              <p className="text-sm font-semibold text-ink">{score.recommendedAction.title}</p>
              {score.recommendedAction.steps.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {score.recommendedAction.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-dim">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader title="Lead profile" subtitle={`Seen ${timeAgo(lead.firstSeenAt ?? lead.createdAt)}`} />
          <div className="space-y-3 px-5 pb-5 pt-3">
            {profileRows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{r.label}</p>
                    <p className="break-words text-xs font-medium text-ink">{r.value}</p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 size-4 shrink-0 text-ink-faint" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Last activity</p>
                <p className="break-words text-xs font-medium text-ink">{timeAgo(lead.lastActivityAt ?? lead.updatedAt)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity + analyses */}
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex gap-1 rounded-lg bg-surface-soft p-1">
            {(["activity", "analyses"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  tab === t ? "bg-surface text-ink shadow-card" : "text-ink-faint hover:text-ink")}>
                {t}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-ink-faint">{timeline.length} events</span>
        </div>

        {tab === "activity" ? (
          timeline.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity yet"
              message="Add an event to start scoring this lead's engagement." />
          ) : (
            <div className="space-y-4 p-5">
              {timeline.map((row) => <TimelineItem key={`${row.kind}-${row.id}`} row={row} />)}
            </div>
          )
        ) : analyses.length === 0 ? (
          <EmptyState icon={Bot} title="No AI analyses yet" message="AI analyses appear here each time the lead is scored." />
        ) : (
          <div className="space-y-3 p-5">
            {analyses.map((a) => (
              <div key={a._id} className="rounded-xl border border-line bg-surface-soft/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <Bot className="size-4 text-violeta" /> {a.provider} · {a.model}
                  </span>
                  <span className="text-[11px] text-ink-faint">{fmtDateTime(a.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{a.summary || "No summary."}</p>
                {a.reasons.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {a.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-ink-faint">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" /> {r}
                      </li>
                    ))}
                  </ul>
                )}
                {a.recommendedAction && (
                  <p className="mt-3 rounded-lg bg-primary-faint/60 px-3 py-2 text-xs font-medium text-primary-soft">
                    Next: {a.recommendedAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddEventModal lead={lead} open={eventOpen} onClose={() => setEventOpen(false)} />
    </div>
  );
}