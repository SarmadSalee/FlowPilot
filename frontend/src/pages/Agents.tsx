import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Play, Trash2, Cpu, Wrench, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Textarea, Toggle } from "@/components/ui";
import { fmtNum, timeAgo } from "@/lib/utils";
import type { Agent } from "@/lib/types";

const MODELS = ["auto", "gpt-4o", "gpt-4o-mini", "claude-sonnet-4", "claude-haiku-3.5", "deepseek-chat", "deepseek-reasoner"];
const TOOL_OPTIONS = ["web_search", "read_docs", "email", "crm", "calendar", "code"];

export default function Agents() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    model: "auto",
    instructions: "You are a helpful, precise AI agent that works inside business automations.",
    tools: ["web_search"] as string[],
    temperature: 0.4,
  });

  const { data: agents, isLoading } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api("/api/agents") });
  const list = (agents ?? []).filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));

  const saveMut = useMutation({
    mutationFn: () =>
      api<Agent>("/api/agents", {
        method: "POST",
        body: {
          name: form.name,
          description: form.description,
          model: form.model,
          instructions: form.instructions,
          temperature: form.temperature,
          tools: form.tools.map((t) => ({ name: t, enabled: true })),
          status: "active",
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      setOpen(false);
      setForm({ ...form, name: "", description: "" });
      toast.success("Agent created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create agent"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api(`/api/agents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted");
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api(`/api/agents/${id}`, { method: "PUT", body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update agent"),
  });

  const runMut = useMutation({
    mutationFn: (id: string) => api<{ text?: string }>(`/api/agents/${id}/run`, { method: "POST", body: { message: "Say hello" } }),
    onSuccess: (r) => toast.success(r?.text ? `Reply: ${r.text.slice(0, 80)}` : "Agent ran"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const toggleTool = (t: string) =>
    setForm((f) => ({ ...f, tools: f.tools.includes(t) ? f.tools.filter((x) => x !== t) : [...f.tools, t] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">AI Agents</h1>
          <p className="mt-1 text-sm text-ink-dim">Reusable AI workers you can drop into any workflow.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search agents..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-48" />
          <Button onClick={() => setOpen(true)}><Plus className="size-4" /> New agent</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface-soft" />)}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={Bot} title="No agents yet"
            message="Create an agent to get AI help inside your workflows."
            action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Create agent</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <Card key={a._id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-white">
                    <Bot className="size-5 text-white" />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">{a.name}</h3>
                    <p className="text-[11px] text-ink-faint">{a.model ?? "auto"}</p>
                  </div>
                </div>
                <Badge status={a.status} className="!text-[10px]">{a.status}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-dim">{a.description || "No description."}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(a.tools ?? []).filter((t) => t.enabled).slice(0, 4).map((t) => (
                  <span key={t.name} className="chip !py-0.5 text-[10px]">{t.name.replace(/_/g, " ")}</span>
                ))}
                {!((a.tools ?? []).some((t) => t.enabled)) && <span className="chip !py-0.5 text-[10px] text-ink-faint">no tools</span>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <div className="flex items-center gap-3 text-[11px] text-ink-faint">
                  <span className="flex items-center gap-1"><Play className="size-3" /> {fmtNum(a.executions ?? 0)} runs</span>
                  <span className="flex items-center gap-1"><Cpu className="size-3" /> {fmtNum(a.tokenUsage ?? 0)} tokens</span>
                </div>
                <div className="flex items-center gap-1">
                  <Toggle checked={a.status === "active"}
                    onChange={(v) => toggleMut.mutate({ id: a._id, status: v ? "active" : "inactive" })} />
                  <button onClick={() => { if (confirm(`Delete agent "${a.name}"?`)) delMut.mutate(a._id); }}
                    className="rounded-lg p-1.5 text-ink-faint hover:bg-danger/15 hover:text-danger">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-ink-faint">{a.avgResponseMs != null ? `${a.avgResponseMs}ms avg` : ""}</span>
                <Button size="sm" variant="ghost" loading={runMut.isPending && runMut.variables === a._id}
                  onClick={() => runMut.mutate(a._id)}>
                  <Play className="size-3.5 text-accent" /> Test
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create an agent" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} loading={saveMut.isPending} disabled={!form.name.trim() || !form.instructions.trim()}>
              <Sparkles className="size-4" /> Create agent
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" placeholder="e.g. Sales Assistant" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <Input label="Description" placeholder="What does this agent do?" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea label="Instructions" value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="min-h-28" />
          <div>
            <label className="label flex items-center gap-1.5"><Wrench className="size-3" /> Tools</label>
            <div className="flex flex-wrap gap-1.5">
              {TOOL_OPTIONS.map((t) => (
                <button key={t} onClick={() => toggleTool(t)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${form.tools.includes(t) ? "border-primary/50 bg-primary-faint text-primary-soft" : "border-line text-ink-faint hover:text-ink"}`}>
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><SlidersHorizontal className="size-3" /> Temperature: {form.temperature.toFixed(1)}</label>
            <input type="range" min={0} max={1} step={0.1} value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
              className="w-full accent-[#6366F1]" />
          </div>
        </div>
      </Modal>
    </div>
  );
}