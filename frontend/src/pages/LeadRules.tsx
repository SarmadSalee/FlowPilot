import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Target, Trash2, Bot, BadgeCheck, Scale, Hash, CircleDot,
  Zap, Mail, Send, Flag, Pencil, Ban, Link2, ListOrdered, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Badge, Button, Card, CardHeader, EmptyState, Input, Modal, PageLoader, Tag, Textarea, Toggle,
} from "@/components/ui";
import { cn, eventTypeLabel, qualificationLabel, intentLabel } from "@/lib/utils";
import type { ICPProfile, RuleAction, ScoringRule } from "@/lib/types";

function actionLabel(a: RuleAction): string {
  switch (a.type) {
    case "increase": return `Increase score by ${a.value ?? 0}`;
    case "decrease": return `Decrease score by ${a.value ?? 0}`;
    case "set": return `Set score to ${a.value ?? 0}`;
    case "set_intent": return `Set intent to ${intentLabel(String(a.value ?? "high"))}`;
    case "set_qualification": return `Set qualification to ${qualificationLabel(String(a.value ?? "qualified"))}`;
    case "set_stage": return `Set buying stage to ${String(a.value ?? "")}`;
    case "notify": return `Notify ${String(a.target ?? "team")}`;
    case "add_tag": return `Add tag "${String(a.value ?? "")}"`;
    case "remove_tag": return `Remove tag "${String(a.value ?? "")}"`;
    case "trigger_workflow": return `Trigger workflow "${String(a.value ?? "")}"`;
    case "stop": return "Stop processing";
    case "unsubscribe": return "Unsubscribe lead";
    default: return a.type;
  }
}

function RuleIcon({ type }: { type: string }) {
  const cls = "size-4";
  switch (type) {
    case "increase": return <Zap className={cls} />;
    case "decrease": return <Zap className={cls} />;
    case "set": return <Scale className={cls} />;
    case "set_intent": return <Target className={cls} />;
    case "set_qualification": return <BadgeCheck className={cls} />;
    case "set_stage": return <ListOrdered className={cls} />;
    case "notify": return <Send className={cls} />;
    case "add_tag": return <Hash className={cls} />;
    case "remove_tag": return <Ban className={cls} />;
    case "trigger_workflow": return <Link2 className={cls} />;
    case "stop": return <CircleDot className={cls} />;
    case "unsubscribe": return <UserCheck className={cls} />;
    default: return <Flag className={cls} />;
  }
}

const TRIGGER_LABEL: Record<string, string> = {
  lead_created: "Lead created",
  lead_event: "Lead event",
  score_threshold: "Score threshold",
  ai_analysis: "AI analysis",
};

function ruleTrigger(rule: ScoringRule) {
  return rule.trigger === "lead_event" && rule.eventType ? `${TRIGGER_LABEL[rule.trigger]} · ${eventTypeLabel(rule.eventType)}` : TRIGGER_LABEL[rule.trigger] ?? rule.trigger;
}

function RuleCard({ rule }: { rule: ScoringRule }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const toggle = async (v: boolean) => {
    setBusy(true);
    try {
      await api(`/api/leads/rules/${rule._id}`, { method: "PUT", body: { enabled: v } });
      qc.invalidateQueries({ queryKey: ["lead-rules"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/leads/rules/${rule._id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["lead-rules"] });
      toast.success("Rule deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", rule.enabled ? "bg-primary-faint text-primary" : "bg-surface-soft text-ink-faint")}>
            <RuleIcon type={rule.action.type} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-sm font-semibold text-ink">{rule.name}</p>
              {rule.source === "ai" && <span className="flex items-center gap-1 rounded bg-aibg px-1.5 py-px text-[9px] font-bold text-violeta"><Sparkles className="size-2.5" /> AI</span>}
              <Badge status={rule.enabled ? "success" : "draft"}>{rule.enabled ? "Active" : "Paused"}</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-faint">{rule.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Toggle checked={rule.enabled} onChange={toggle} disabled={busy} />
          <button onClick={remove} disabled={busy} title="Delete rule"
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        <Tag><Flag className="size-3" /> {ruleTrigger(rule)}</Tag>
        <Tag><Scale className="size-3" /> {actionLabel(rule.action)}</Tag>
        <Tag>Priority {rule.priority}</Tag>
        {rule.conditions.length > 0 && <Tag>{rule.conditions.length} condition{rule.conditions.length > 1 ? "s" : ""}</Tag>}
      </div>
      {rule.conditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rule.conditions.map((c, i) => (
            <span key={i} className="rounded-md bg-surface-soft px-2 py-1 font-mono text-[10px] text-ink-dim">
              {c.field} {c.operator} {String(c.value ?? "")}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function RuleBuilder() {
  const qc = useQueryClient();
  const [description, setDescription] = useState("");
  const [compiled, setCompiled] = useState<ScoringRule | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);

  const compile = async () => {
    if (description.trim().length < 5) return toast.error("Describe the rule in plain English");
    setCompiling(true);
    try {
      const res = await api<ScoringRule>("/api/leads/rules/compile", { body: { description } });
      setCompiled(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Compile failed");
    } finally {
      setCompiling(false);
    }
  };

  const save = async () => {
    if (!compiled) return;
    setSaving(true);
    try {
      await api("/api/leads/rules", { body: compiled });
      qc.invalidateQueries({ queryKey: ["lead-rules"] });
      toast.success("Rule created");
      setDescription("");
      setCompiled(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Build a rule in plain English" subtitle="FlowPilot converts natural language into a scoring rule"
        action={<span className="flex items-center gap-1.5 text-[11px] text-violeta"><Bot className="size-3.5" /> AI compiler</span>} />
      <div className="space-y-3 p-5">
        <Textarea rows={3} placeholder='Try: "When a lead replies to an email and asks about pricing, increase their score by 25 and notify the sales team."'
          value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end">
          <Button variant="soft" loading={compiling} icon={<Sparkles className="size-4" />} onClick={compile}>
            {compiled ? "Re-compile" : "Generate rule"}
          </Button>
        </div>
        {compiled && (
          <div className="rounded-xl border border-primary/30 bg-primary-faint/40 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <BadgeCheck className="size-4 text-primary" /> {compiled.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <Tag><Flag className="size-3" /> {ruleTrigger(compiled)}</Tag>
              <Tag><Scale className="size-3" /> {actionLabel(compiled.action)}</Tag>
              {compiled.conditions.length > 0 && (
                <Tag>{compiled.conditions.map((c) => `${c.field} ${c.operator} ${String(c.value ?? "")}`).join(", ")}</Tag>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" loading={saving} onClick={save}>Save rule</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function IcpCard({ profile }: { profile?: ICPProfile | null }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const start = () => {
    setForm({
      name: profile?.name ?? "Default ICP",
      industries: (profile?.industries ?? []).join(", "),
      companySizeMin: profile?.companySizeMin,
      companySizeMax: profile?.companySizeMax,
      locations: (profile?.locations ?? []).join(", "),
      jobTitles: (profile?.jobTitles ?? []).join(", "),
      minRevenue: profile?.minRevenue,
      keywords: (profile?.keywords ?? []).join(", "),
      enabled: profile?.enabled ?? true,
    });
    setOpen(true);
  };

  const toList = (v: unknown) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    setBusy(true);
    try {
      await api("/api/leads/icp", {
        method: "PUT",
        body: {
          name: String(form.name ?? "Default ICP"),
          industries: toList(form.industries),
          companySizeMin: form.companySizeMin ? Number(form.companySizeMin) : undefined,
          companySizeMax: form.companySizeMax ? Number(form.companySizeMax) : undefined,
          locations: toList(form.locations),
          jobTitles: toList(form.jobTitles),
          minRevenue: form.minRevenue ? Number(form.minRevenue) : undefined,
          keywords: toList(form.keywords),
          enabled: Boolean(form.enabled),
        },
      });
      qc.invalidateQueries({ queryKey: ["lead-icp"] });
      qc.invalidateQueries({ queryKey: ["lead-analytics"] });
      setOpen(false);
      toast.success("ICP profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const chips = [
    { label: "Industries", values: profile?.industries ?? [] },
    { label: "Locations", values: profile?.locations ?? [] },
    { label: "Job titles", values: profile?.jobTitles ?? [] },
    { label: "Keywords", values: profile?.keywords ?? [] },
  ];

  return (
    <Card>
      <CardHeader title="Ideal customer profile" subtitle="Drives the ICP match score for every lead"
        action={
          <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={start}>Edit</Button>
        } />
      <div className="p-5 pt-2">
        {profile?.enabled ? (
          <div className="space-y-3">
            {chips.map((c) => (
              <div key={c.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{c.label}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {c.values.length ? c.values.map((v) => <Tag key={v}>{v}</Tag>) : <span className="text-xs text-ink-faint">—</span>}
                </div>
              </div>
            ))}
            {(profile.companySizeMin != null || profile.companySizeMax != null || profile.minRevenue != null) && (
              <div className="flex flex-wrap gap-1.5">
                {profile.companySizeMin != null && <Tag>{profile.companySizeMin}+ employees</Tag>}
                {profile.companySizeMax != null && <Tag>&lt; {profile.companySizeMax} employees</Tag>}
                {profile.minRevenue != null && <Tag>${profile.minRevenue.toLocaleString()}+ revenue</Tag>}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink-faint">No ICP profile yet. Define one so FlowPilot can score fit automatically.</p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit ICP profile" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={save}>Save profile</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Profile name" value={String(form.name ?? "")} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-medium text-ink-dim">
                <Toggle checked={Boolean(form.enabled)} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} /> ICP matching enabled
              </label>
            </div>
          </div>
          <Input label="Industries (comma separated)" value={String(form.industries ?? "")} onChange={(e) => setForm((f) => ({ ...f, industries: e.target.value }))} placeholder="SaaS, Healthcare, Fintech" />
          <Input label="Locations (comma separated)" value={String(form.locations ?? "")} onChange={(e) => setForm((f) => ({ ...f, locations: e.target.value }))} placeholder="US, UK, UAE" />
          <Input label="Job titles (comma separated)" value={String(form.jobTitles ?? "")} onChange={(e) => setForm((f) => ({ ...f, jobTitles: e.target.value }))} placeholder="CEO, Founder, Head of Sales" />
          <Input label="Keywords (comma separated)" value={String(form.keywords ?? "")} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="automation, ai, growth" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Min employees" type="number" value={form.companySizeMin != null ? String(form.companySizeMin) : ""} onChange={(e) => setForm((f) => ({ ...f, companySizeMin: e.target.value }))} />
            <Input label="Max employees" type="number" value={form.companySizeMax != null ? String(form.companySizeMax) : ""} onChange={(e) => setForm((f) => ({ ...f, companySizeMax: e.target.value }))} />
            <Input label="Min revenue ($)" type="number" value={form.minRevenue != null ? String(form.minRevenue) : ""} onChange={(e) => setForm((f) => ({ ...f, minRevenue: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default function LeadRules() {
  const rulesQ = useQuery<ScoringRule[]>({
    queryKey: ["lead-rules"],
    queryFn: () => api("/api/leads/rules"),
  });
  const icpQ = useQuery<ICPProfile | null>({
    queryKey: ["lead-icp"],
    queryFn: () => api("/api/leads/icp"),
  });

  const enabled = useMemo(() => (rulesQ.data ?? []).filter((r) => r.enabled).length, [rulesQ.data]);

  if (rulesQ.isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Scoring rules</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {enabled} active rule{enabled === 1 ? "" : "s"} · automatically adjust lead scores as leads engage.
          </p>
        </div>
        <Button variant="ghost" icon={<Mail className="size-4" />} onClick={() => toast.info("Rules apply live to every inbound lead")}>
          How it works
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RuleBuilder />
        <IcpCard profile={icpQ.data ?? null} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Existing rules</h2>
        {(rulesQ.data?.length ?? 0) === 0 ? (
          <EmptyState icon={Target} title="No scoring rules yet"
            message="Use the AI builder above or create rules manually to control how leads are scored." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rulesQ.data?.map((r) => <RuleCard key={r._id} rule={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}