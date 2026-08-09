import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles, Cpu, GitBranch, Zap as ZapIcon, Play, ArrowRight, RefreshCw, Check, Loader2, PenLine, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Select, Tag } from "@/components/ui";
import { cn, nodeColor } from "@/lib/utils";
import type { Workflow } from "@/lib/types";

const GOAL_OPTIONS = [
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "support", label: "Support" },
  { value: "ops", label: "Operations" },
  { value: "custom", label: "Custom" },
];

const SUGGEST = [
  "score and route inbound leads to the right rep",
  "summarize support tickets and escalate urgent ones to Slack",
  "generate a weekly report and post it to the team channel",
  "sync new orders into my CRM and send a confirmation email",
];

const TOOLS = ["Gmail", "Slack", "HubSpot", "Zapier", "Notion", "Stripe", "Twilio"];

export default function AICreator() {
  const nav = useNavigate();
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("sales");
  const [tools, setTools] = useState<string[]>(["Gmail", "Slack"]);
  const [result, setResult] = useState<Workflow | null>(null);
  const [view, setView] = useState<"build" | "review">("build");

  const gen = useMutation({
    mutationFn: () =>
      api<Workflow>("/api/ai/generate-workflow", {
        body: { description, goal, tools },
      }),
    onSuccess: (wf) => {
      setResult(wf);
      setView("review");
      toast.success("Workflow generated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const save = useMutation({
    mutationFn: () => api<Workflow>("/api/workflows", { method: "POST", body: result }),
    onSuccess: (wf) => {
      toast.success("Workflow saved!");
      nav(`/workflows/${wf._id}`);
    },
    onError: () => toast.error("Could not save workflow"),
  });

  const nodeIcon = (t: string) => (t === "trigger" ? Play : t === "ai" ? Cpu : t === "condition" ? GitBranch : ZapIcon);

  const toggleTool = (t: string) =>
    setTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  if (view === "review" && result) {
    return (
      <div className="mx-auto max-w-4xl">
        <button onClick={() => setView("build")} className="mb-4 flex items-center gap-2 text-sm text-ink-faint hover:text-ink">
          <PenLine className="size-4" /> Edit description
        </button>
        <div className="mb-6 flex items-center gap-3">
          <span className="chip border-primary/40 bg-primary-faint text-primary-soft"><Sparkles className="size-3" /> AI generated</span>
          <h1 className="font-display text-2xl font-bold text-ink">{result.name}</h1>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-6">
          <div className="flex min-w-max items-center gap-2">
            {result.nodes.map((n, i) => {
              const Icon = nodeIcon(n.type);
              const color = nodeColor(n.type);
              return (
                <React.Fragment key={n.id}>
                  <div className="flex min-w-32 flex-col items-center gap-2 rounded-xl border border-line bg-surface-soft px-4 py-3">
                    <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${color}1a`, color }}>
                      <Icon className="size-4" />
                    </span>
                    <span className="text-center text-xs font-semibold text-ink">{n.label}</span>
                  </div>
                  {i < result.nodes.length - 1 && (
                    <div className="flex items-center justify-center">
                      <ArrowRight className="size-4 text-ink-faint" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Nodes", result.nodes.length],
            ["Connections", result.edges.length],
            ["AI steps", result.nodes.filter((n) => n.type === "ai").length],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs text-ink-faint">{label}</p>
              <p className="mt-1 font-display text-lg font-bold text-ink">{val}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => { setResult(null); setView("build"); }}>
            <RefreshCw className="size-4" /> Start over
          </Button>
          <Button variant="ghost" onClick={() => gen.mutate()} disabled={gen.isPending}>
            <RefreshCw className="size-4" /> Regenerate
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending}>
            <Check className="size-4" /> Save workflow
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <span className="chip mb-4 border-primary/40 bg-primary-faint text-primary-soft">
        <Wand2 className="size-3" /> AI Workflow Creator
      </span>
      <h1 className="font-display text-3xl font-bold text-ink">
        Describe it. <span className="text-gradient">We'll build it.</span>
      </h1>
      <p className="mt-2 text-sm text-ink-dim">
        FlowPilot turns plain-English instructions into a ready-to-run workflow.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border border-line bg-surface p-6">
        <div>
          <label className="label">What should this workflow do?</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Whenever I get a new lead, analyze it with AI, score it 1-100, add qualified leads to my CRM, and send them a personalized email."
            className="input-base min-h-32 resize-y leading-relaxed"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGEST.map((s) => (
              <button key={s} onClick={() => setDescription(s)} className="chip hover:border-primary/40 hover:text-ink">
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Business goal" value={goal} onChange={(e) => setGoal(e.target.value)}>
            {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <div>
            <label className="label">Tools to use</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TOOLS.map((t) => (
                <button key={t} onClick={() => toggleTool(t)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    tools.includes(t) ? "border-primary/50 bg-primary-faint text-primary-soft" : "border-line text-ink-faint hover:text-ink",
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          loading={gen.isPending}
          disabled={!description.trim()}
          onClick={() => gen.mutate()}
        >
          {gen.isPending ? "Designing your workflow…" : (
            <><Sparkles className="size-4" /> Generate workflow</>
          )}
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-ink-faint">
        <Tag>100% editable</Tag>
        <Tag>1-click run</Tag>
        <Tag>Free to try</Tag>
      </div>
    </div>
  );
}