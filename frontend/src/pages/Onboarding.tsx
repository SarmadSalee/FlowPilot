import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target, Mail, LifeBuoy, Boxes, Sparkles, ArrowRight, ArrowLeft, Workflow,
  Play, RefreshCw, Check, Pencil, X, Bot, Cpu, GitBranch, Zap, Loader2,
  Hash, Table2, MessageCircle, ShoppingBag, CreditCard, Cloud,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button, ProgressBar } from "@/components/ui";
import { cn, nodeColor } from "@/lib/utils";
import type { Workflow as WorkflowWF } from "@/lib/types";
import { toast } from "sonner";

const GOALS = [
  { key: "sales", label: "Sales", icon: Target, desc: "Lead routing, follow-ups, scoring", color: "#6366F1" },
  { key: "marketing", label: "Marketing", icon: Mail, desc: "Campaigns, nurture, content", color: "#22D3EE" },
  { key: "support", label: "Support", icon: LifeBuoy, desc: "Triage, tickets, replies", color: "#FBBF24" },
  { key: "ops", label: "Operations", icon: Boxes, desc: "Docs, data, approvals", color: "#34D399" },
];

const TOOLS = [
  { key: "gmail", label: "Gmail", icon: Mail, color: "#EA4335" },
  { key: "slack", label: "Slack", icon: Hash, color: "#36C5F0" },
  { key: "hubspot", label: "HubSpot", icon: Zap, color: "#FF7A59" },
  { key: "salesforce", label: "Salesforce", icon: Cloud, color: "#00A1E0" },
  { key: "sheets", label: "Google Sheets", icon: Table2, color: "#34A853" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { key: "shopify", label: "Shopify", icon: ShoppingBag, color: "#95BF47" },
  { key: "stripe", label: "Stripe", icon: CreditCard, color: "#635BFF" },
];

const SUGGESTIONS: Record<string, string> = {
  sales: "Whenever I get a new lead, analyze it with AI, score it 1-100, add the qualified ones to my CRM, generate a personalized email and create a follow-up task.",
  marketing: "Every time someone downloads my ebook, add them to my newsletter list, send a welcome email and notify my team in Slack.",
  support: "When a support email arrives, classify its urgency with AI, escalate anything urgent to Slack and draft a helpful first reply.",
  ops: "Each Monday morning, pull last week's numbers from the sheet, summarize them with AI and post the digest to my workspace channel.",
};

const GENERATE_PLACEHOLDER = [
  "“Whenever a new lead fills the form, score it with AI and follow up in Slack”",
  "“Summarize incoming support emails and escalate urgent ones”",
  "“Send a monthly report to the team with AI insights”",
];

const STEPS = ["Goal", "Tools", "Describe", "AI Review"];

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("sales");
  const [tools, setTools] = useState<string[]>(["gmail", "slack", "hubspot"]);
  const [description, setDescription] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [generated, setGenerated] = useState<WorkflowWF | null>(null);
  const [nodePreview, setNodePreview] = useState(0);

  useEffect(() => {
    setDescription(SUGGESTIONS[goal]);
  }, [goal]);

  const nodeIcon = (t: string) =>
    t === "trigger" ? Play : t === "ai" ? Cpu : t === "condition" ? GitBranch : Zap;

  const toggleTool = (key: string) =>
    setTools((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const generate = async (reset = false) => {
    setGenLoading(true);
    setStep(3);
    try {
      const wf = await api<WorkflowWF>("/api/ai/generate-workflow", {
        body: { description, goal, tools },
      });
      setGenerated(wf);
      setStep(4);
    } catch {
      toast.error("Generation failed — please try again.");
      if (reset) setStep(2);
    } finally {
      setGenLoading(false);
    }
  };

  const approve = async () => {
    if (!generated) return;
    try {
      await api("/api/workflows", { method: "POST", body: { name: generated.name, description: generated.description, nodes: generated.nodes, edges: generated.edges } });
      toast.success("Workflow created!");
      nav("/workflows");
    } catch {
      toast.error("Could not save the workflow.");
    }
  };

  const regenerate = () => {
    setNodePreview(0);
    generate(true);
  };

  const activeIdx = Math.min(step, 3);

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-white">
              <Workflow className="size-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-ink">
              Flow<span className="text-gradient">Pilot</span>
            </span>
          </Link>
          <span className="chip">Setup · {STEPS[activeIdx]}</span>
        </div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="mb-3 flex justify-between">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "text-xs font-semibold",
                  i === activeIdx ? "text-primary-soft" : i < activeIdx ? "text-success" : "text-ink-faint",
                )}
              >
                {i < activeIdx ? "✓ " : ""}
                {i + 1}. {s}
              </span>
            ))}
          </div>
          <ProgressBar value={Math.min(100, ((activeIdx + 1) / STEPS.length) * 100)} />
        </div>

        {/* Step 0: Goal */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="font-display text-2xl font-bold text-ink">What should we focus on?</h1>
            <p className="mt-2 text-sm text-ink-dim">Pick the area you want to automate first — you can always add more.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {GOALS.map((g) => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.key}
                    onClick={() => setGoal(g.key)}
                    className={cn(
                      "flex items-start gap-4 rounded-2xl border p-5 text-left transition-all",
                      goal === g.key ? "border-primary/60 bg-primary-faint" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}1a`, color: g.color }}>
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block font-display text-sm font-semibold text-ink">{g.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-faint">{g.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(1)} className="w-full sm:w-auto">
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Tools */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="font-display text-2xl font-bold text-ink">Which tools do you use?</h1>
            <p className="mt-2 text-sm text-ink-dim">Select the apps FlowPilot should connect to. You can change this later.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                const active = tools.includes(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleTool(t.key)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all",
                      active ? "border-primary/60 bg-primary-faint" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${t.color}1a`, color: t.color }}>
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs font-semibold text-ink">{t.label}</span>
                    <span className={cn("flex size-4 items-center justify-center rounded-full border transition-colors", active ? "border-primary bg-primary text-white" : "border-line-strong bg-surface-soft text-transparent")}>
                      <Check className="size-2.5" />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={() => setStep(2)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Describe */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="font-display text-2xl font-bold text-ink">Describe the workflow</h1>
            <p className="mt-2 text-sm text-ink-dim">Tell FlowPilot what you want in plain English — no coding needed.</p>
            <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
              <label className="label">What should happen, and when?</label>
              <textarea
                className="input-base min-h-36 resize-y !bg-base leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={GENERATE_PLACEHOLDER[0]}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {GENERATE_PLACEHOLDER.slice(1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setDescription(p.replace(/["“”]/g, ""))}
                    className="chip max-w-full truncate text-left hover:border-primary/40 hover:text-ink"
                    title={p}
                  >
                    {p.replace(/["“”]/g, "")}
                  </button>
                ))}
              </div>
              {tools.length > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
                  <Bot className="size-3.5 text-primary-soft" /> Using your connected tools:
                  {tools.map((k) => TOOLS.find((t) => t.key === k)?.label).filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={() => generate()} loading={genLoading}>
                <Sparkles className="size-4" /> Generate workflow
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generating */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute -inset-3 animate-pulse rounded-full bg-primary/20 blur-xl" />
                <Loader2 className="relative size-10 animate-spin text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-ink">FlowPilot is designing your workflow…</h2>
              <p className="mt-2 max-w-sm text-sm text-ink-dim">
                Mapping triggers, AI steps, conditions and actions from your description.
              </p>
              <div className="mt-6 flex items-center gap-3 font-mono text-xs text-success">
                <Cpu className="size-4 animate-pulse-dot" /> building node graph…
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: AI Review */}
        {step === 4 && generated && (
          <motion.div key="s4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="chip mb-3 border-primary/40 bg-primary-faint text-primary-soft">
                    <Sparkles className="size-3" /> AI generated
                  </span>
                  <h1 className="font-display text-xl font-bold text-ink">{generated.name}</h1>
                  <p className="mt-1 text-sm text-ink-dim">{generated.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface p-6">
              <div className="flex min-w-max items-center gap-2">
                {generated.nodes.map((n, i) => {
                  const Icon = nodeIcon(n.type);
                  const color = nodeColor(n.type);
                  return (
                    <React.Fragment key={n.id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        onMouseEnter={() => setNodePreview(i)}
                        className={cn(
                          "flex min-w-32 flex-col items-center gap-2 rounded-xl border px-4 py-3",
                          nodePreview === i ? "border-primary/60 bg-surface" : "border-line bg-surface-soft",
                        )}
                        style={{ borderColor: nodePreview === i ? color : undefined }}
                      >
                        <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${color}1a`, color }}>
                          <Icon className="size-4" />
                        </span>
                        <span className="text-center text-xs font-semibold text-ink">{n.label}</span>
                      </motion.div>
                      {i < generated.nodes.length - 1 && (
                        <div className="flex flex-col items-center gap-1 px-1">
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                            <span className="h-1 w-14 rounded bg-line" />
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-ink-faint">
                            {i === 0 ? "trigger" : i === 1 ? "ai" : "step"}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs text-ink-faint">Nodes</p>
                <p className="mt-1 font-display text-lg font-bold text-ink">{generated.nodes.length}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs text-ink-faint">Connections</p>
                <p className="mt-1 font-display text-lg font-bold text-ink">{generated.edges.length}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs text-ink-faint">AI steps</p>
                <p className="mt-1 font-display text-lg font-bold text-ink">
                  {generated.nodes.filter((n) => n.type === "ai").length}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={regenerate}>
                <RefreshCw className="size-4" /> Regenerate
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)}>
                <Pencil className="size-4" /> Edit description
              </Button>
              <Button variant="ghost" onClick={() => nav("/workflows")}>
                <X className="size-4" /> Cancel
              </Button>
              <Button onClick={approve}>
                <Check className="size-4" /> Approve & save
              </Button>
              <Button
                variant="soft"
                onClick={() => nav("/workflows")}
              >
                <Workflow className="size-4" /> Open builder
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}