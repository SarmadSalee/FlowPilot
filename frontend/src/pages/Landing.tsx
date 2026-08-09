import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Workflow, Sparkles, Bot, Plug, ArrowRight, Check, BarChart3, PlaySquare, Gauge,
  Cpu, GitBranch, LayoutTemplate, Bell, Zap, Star, Mail, Send, Megaphone,
  Lock, ShieldCheck, Eye, KeyRound, Languages, Hash, Table2, MessageCircle,
  CreditCard, Cloud, Webhook, ChevronDown, Hourglass, TrendingUp, Activity, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6", className)}>{children}</div>;
}

function RevealTitle({
  eyebrow, title, sub, align = "center",
}: { eyebrow?: string; title: React.ReactNode; sub?: string; align?: "center" | "left" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease }}
      className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      {eyebrow && (
        <span className="chip mb-4 border-primary/40 bg-primary-faint text-primary-soft">{eyebrow}</span>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-[38px] md:leading-[1.15]">
        {title}
      </h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-ink-dim">{sub}</p>}
    </motion.div>
  );
}

/* ---------------- Navbar ---------------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled ? "border-b border-line bg-surface/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-white">
            <Workflow className="size-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Flow<span className="text-gradient">Pilot</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-dim lg:flex">
          {[
            ["Features", "#features"],
            ["How it works", "#how"],
            ["Templates", "#templates"],
            ["Pricing", "#pricing"],
            ["Security", "#security"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-ink">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="hidden text-sm font-semibold text-ink-dim transition-colors hover:text-ink sm:block">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary btn-md">
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Animated Hero Flow Canvas ---------------- */
function HeroFlow() {
  const steps = [
    {
      id: "lead",
      title: "Lead Captured",
      subtitle: "Inbound Webhook",
      badge: "TRIGGER",
      status: "Received",
      icon: Mail,
      color: "#22D3EE",
      lightColor: "rgba(34, 211, 238, 0.15)",
      borderColor: "rgba(34, 211, 238, 0.5)",
      payload: { source: "Website Form", email: "sarah@acme.io", company: "Acme Corp" },
    },
    {
      id: "ai_score",
      title: "AI Score 85/100",
      subtitle: "High Buying Intent",
      badge: "AI AGENT",
      status: "Scored in 0.2s",
      icon: Cpu,
      color: "#A855F7",
      lightColor: "rgba(168, 85, 247, 0.15)",
      borderColor: "rgba(168, 85, 247, 0.5)",
      payload: { score: 85, fit: "Enterprise", budget: "$50k-$100k", urgency: "High" },
    },
    {
      id: "condition",
      title: "Score ≥ 70?",
      subtitle: "Routing Logic",
      badge: "CONDITION",
      status: "TRUE ✓",
      icon: GitBranch,
      color: "#F59E0B",
      lightColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "rgba(245, 158, 11, 0.5)",
      payload: { condition: "score >= 70", evaluated: true, decision: "VIP Fast Track" },
    },
    {
      id: "crm",
      title: "Create CRM Record",
      subtitle: "HubSpot / Salesforce",
      badge: "INTEGRATION",
      status: "Contact Created",
      icon: Plug,
      color: "#6366F1",
      lightColor: "rgba(99, 102, 241, 0.15)",
      borderColor: "rgba(99, 102, 241, 0.5)",
      payload: { crm: "HubSpot", id: "hs_9981", status: "Contact Synced & Tagged" },
    },
    {
      id: "email",
      title: "Send Follow-up Email",
      subtitle: "Personalized Pitch",
      badge: "AUTOMATION",
      status: "Sent (0.4s)",
      icon: Send,
      color: "#10B981",
      lightColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "rgba(16, 185, 129, 0.5)",
      payload: { template: "VIP_Onboarding", sentTo: "sarah@acme.io", openTracking: true },
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % steps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPaused, steps.length]);

  const activeStep = steps[activeIdx];

  return (
    <div className="relative mt-12 w-full max-w-5xl mx-auto">
      {/* Outer Studio Container */}
      <div className="relative rounded-2xl border border-white/10 bg-[#090D16] shadow-2xl overflow-hidden backdrop-blur-xl group">
        {/* Studio Window Title Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-slate-500 pl-2 border-l border-white/10">
              lead-qualification-v2.flow
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>LIVE AUTOMATION</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
              <span>Latency: 142ms</span>
            </div>
          </div>
        </div>

        {/* Studio Canvas Area */}
        <div className="relative p-6 sm:p-8 md:p-10 min-h-[380px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
          {/* Subtle Grid Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-violeta/5 pointer-events-none" />

          {/* Desktop Canvas Layout (Grid + Connecting SVG Lines) */}
          <div className="relative z-10 hidden md:block">
            {/* SVG Connecting Bezier Lines */}
            <svg className="absolute inset-0 size-full pointer-events-none" style={{ minHeight: "260px" }}>
              <defs>
                <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* Step 1 -> Step 2 */}
              <path
                d="M 230 65 L 305 65"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <path
                d="M 230 65 L 305 65"
                stroke="#22D3EE"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className={activeIdx >= 1 ? "animate-flow opacity-100" : "opacity-0"}
              />

              {/* Step 2 -> Step 3 */}
              <path
                d="M 535 65 L 610 65"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <path
                d="M 535 65 L 610 65"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className={activeIdx >= 2 ? "animate-flow opacity-100" : "opacity-0"}
              />

              {/* Step 3 (Condition) -> Step 4 (CRM Record) curved flow line */}
              <path
                d="M 725 110 C 725 175, 480 175, 305 175"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 6"
              />
              <path
                d="M 725 110 C 725 175, 480 175, 305 175"
                stroke="#F59E0B"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 6"
                className={activeIdx >= 3 ? "animate-flow opacity-100" : "opacity-0"}
              />

              {/* Step 4 -> Step 5 */}
              <path
                d="M 535 175 L 610 175"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <path
                d="M 535 175 L 610 175"
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className={activeIdx >= 4 ? "animate-flow opacity-100" : "opacity-0"}
              />
            </svg>

            {/* Desktop Node Cards Grid Layout */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              {steps.slice(0, 3).map((step, i) => {
                const Icon = step.icon;
                const isActive = activeIdx === i;
                return (
                  <motion.div
                    key={step.id}
                    onClick={() => { setActiveIdx(i); setIsPaused(true); }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={cn(
                      "relative cursor-pointer rounded-xl border p-4 transition-all duration-300 backdrop-blur-md",
                      isActive
                        ? "bg-white/[0.08] shadow-[0_0_30px_rgba(99,102,241,0.2)] border-transparent"
                        : "bg-white/[0.04] border-white/10 hover:border-white/10 hover:bg-white/[0.07]"
                    )}
                    style={{
                      borderColor: isActive ? step.borderColor : undefined,
                      boxShadow: isActive ? `0 0 25px ${step.lightColor}` : undefined,
                    }}
                  >
                    {/* Node Header Pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{ background: step.lightColor, color: step.color }}
                      >
                        {step.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{step.status}</span>
                    </div>

                    {/* Main Node Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10"
                        style={{ background: step.lightColor, color: step.color }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-white">{step.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{step.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Row 2 Action Branch Nodes */}
            <div className="grid grid-cols-3 gap-8 pl-36">
              {steps.slice(3, 5).map((step, idx) => {
                const i = idx + 3;
                const Icon = step.icon;
                const isActive = activeIdx === i;
                return (
                  <motion.div
                    key={step.id}
                    onClick={() => { setActiveIdx(i); setIsPaused(true); }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={cn(
                      "relative cursor-pointer rounded-xl border p-4 transition-all duration-300 backdrop-blur-md",
                      isActive
                        ? "bg-white/[0.08] shadow-[0_0_30px_rgba(99,102,241,0.2)] border-transparent"
                        : "bg-white/[0.04] border-white/10 hover:border-white/10 hover:bg-white/[0.07]"
                    )}
                    style={{
                      borderColor: isActive ? step.borderColor : undefined,
                      boxShadow: isActive ? `0 0 25px ${step.lightColor}` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{ background: step.lightColor, color: step.color }}
                      >
                        {step.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{step.status}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10"
                        style={{ background: step.lightColor, color: step.color }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-white">{step.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{step.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile Responsive Layout (Vertical Pipeline) */}
          <div className="block md:hidden space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeIdx === i;
              return (
                <div
                  key={step.id}
                  onClick={() => { setActiveIdx(i); setIsPaused(true); }}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer",
                    isActive ? "bg-white/[0.08] border-primary" : "bg-white/[0.04] border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg"
                      style={{ background: step.lightColor, color: step.color }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{step.title}</h4>
                      <p className="text-[11px] text-slate-500">{step.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{ background: step.lightColor, color: step.color }}
                  >
                    {step.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Step Inspector / JSON Log Drawer */}
        <div className="border-t border-white/10 bg-[#05080F] px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">ACTIVE PAYLOAD:</span>
            <span className="text-indigo-300 font-semibold">{activeStep.title}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-[11px] text-slate-400 bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-emerald-400">✓ 200 OK</span>
            <span className="text-slate-500">|</span>
            <span className="truncate max-w-[280px] sm:max-w-md">{JSON.stringify(activeStep.payload)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hero Prompt Generator Demo ---------------- */
function HeroPromptDemo() {
  const [prompt, setPrompt] = useState("Score inbound leads, update HubSpot CRM, and send a personalized email");
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = [
    "Score inbound leads & update HubSpot CRM",
    "Summarize Zoom recording & send Slack recap",
    "Alert ops team if Stripe payment fails",
  ];

  const handleSelectPrompt = (p: string) => {
    setIsTyping(true);
    setPrompt("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < p.length) {
        setPrompt(p.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);
  };

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-emerald-500/20 bg-surface/90 p-2 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex flex-1 items-center w-full">
          <Sparkles className="absolute left-3.5 size-4 text-emerald-600 animate-pulse" />
          <input
            type="text"
            readOnly
            value={prompt}
            className="w-full rounded-xl bg-surface border border-line pl-10 pr-4 py-3 text-xs sm:text-sm text-ink placeholder:text-ink-faint focus:outline-none font-mono"
          />
        </div>
        <Link
          to="/ai/create"
          className="btn btn-md w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0"
        >
          <span>Generate Flow</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 px-2 pb-1">
        <span className="text-[11px] font-mono text-ink-faint mr-1">Try example:</span>
        {samplePrompts.map((sp) => (
          <button
            key={sp}
            disabled={isTyping}
            onClick={() => handleSelectPrompt(sp)}
            className="rounded-lg border border-line bg-surface-soft px-2.5 py-1 text-[11px] font-medium text-ink-dim hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
          >
            {sp}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-base">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-32 lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 py-1.5 pl-1.5 pr-4 text-xs font-medium text-emerald-600 shadow-inner">
            <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">New</span>
            FlowPilot 2.0 — Autonomous Business Engine
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[64px]">
            Transform repetitive work into
            <br />
            <span className="text-gradient">autonomous AI workflows</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
            FlowPilot connects your apps and AI models into self-running automations. Describe what you want in plain English, and agents execute end to end.
          </p>

          <HeroPromptDemo />

          <p className="mt-5 text-xs text-ink-faint flex items-center justify-center gap-4">
            <span>✓ Free forever tier</span>
            <span>·</span>
            <span>✓ Setup in 2 minutes</span>
            <span>·</span>
            <span>✓ No credit card required</span>
          </p>
        </motion.div>

        <HeroFlow />
      </div>
    </section>
  );
}

/* ---------------- Logo bar ---------------- */
function LogoBar() {
  return (
    <section className="border-y border-line bg-surface-30 py-10 overflow-hidden">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
        Trusted by forward-thinking automation teams worldwide
      </p>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-14 gap-y-4">
        {["Acme Corp", "CloudCo", "Nexus AI", "Quantica Labs", "Brightline", "Apex Ops"].map((l) => (
          <span key={l} className="font-display text-lg font-bold text-ink-faint/60 hover:text-ink-dim transition-colors cursor-default">
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Features Bento Grid ---------------- */
const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Prompt-to-Workflow",
    desc: "Type what you want done in plain English. FlowPilot automatically wires up triggers, AI steps, logic branches, and tool actions.",
    tag: "Instant Generation",
    span: "col-span-1 md:col-span-2",
  },
  {
    icon: Bot,
    title: "Autonomous Agents",
    desc: "AI agents evaluate lead score, draft context-aware emails, and clean CRM records without human intervention.",
    tag: "GPT-4o & Claude 3.5",
    span: "col-span-1",
  },
  {
    icon: Plug,
    title: "50+ Native Connectors",
    desc: "Connect Gmail, Slack, HubSpot, Salesforce, Stripe, and Webhooks with 1-click authentication.",
    tag: "Zero Code",
    span: "col-span-1",
  },
  {
    icon: GitBranch,
    title: "Smart Conditional Logic",
    desc: "Branch workflows dynamically based on AI evaluation results, deal size thresholds, or customer tier.",
    tag: "Multi-branch",
    span: "col-span-1 md:col-span-2",
  },
];

function Features() {
  return (
    <section id="features" className="bg-base py-24">
      <Container>
        <RevealTitle
          eyebrow="Capabilities"
          title={<>Everything you need for <span className="text-gradient">hands-free operation</span></>}
          sub="FlowPilot combines state-of-the-art LLMs, multi-branch logic, and your everyday software stack."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-line bg-surface/80 p-7 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                  f.span
                )}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Icon className="size-5" />
                  </div>
                  <span className="rounded-full border border-line bg-surface-soft px-3 py-1 text-[10px] font-mono font-semibold text-emerald-600">
                    {f.tag}
                  </span>
                </div>

                <h3 className="mb-2 font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink-dim">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- How it works ---------------- */
const STEPS = [
  { n: "01", title: "Prompt your workflow", desc: "Type what you want — like “when a lead fills the form, score it with AI and follow up”." },
  { n: "02", title: "AI designs the structure", desc: "FlowPilot maps triggers, AI qualification steps, logic paths, and app connectors in seconds." },
  { n: "03", title: "Connect your apps", desc: "Link Gmail, Slack, HubSpot, and Stripe with 1-click OAuth authentication." },
  { n: "04", title: "Deploy & Autopilot", desc: "FlowPilot executes automatically on every trigger with step-level visibility into every run." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden border-y border-line bg-surface-30 py-24">
      <Container>
        <RevealTitle
          eyebrow="How it works"
          title={<>From plain English prompt to <span className="text-gradient">live workflow in 10s</span></>}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="rounded-2xl border border-line bg-surface p-6 relative group hover:border-emerald-500/30 transition-colors"
            >
              <span className="font-display text-[40px] font-bold leading-none text-gradient opacity-80">{s.n}</span>
              <h3 className="mt-3 font-display text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Integrations Section with Filter Tabs ---------------- */
const ALL_INTEGRATIONS = [
  { name: "Gmail", cat: "comms", icon: Mail, color: "#EA4335" },
  { name: "Slack", cat: "comms", icon: Hash, color: "#36C5F0" },
  { name: "Google Sheets", cat: "tools", icon: Table2, color: "#34A853" },
  { name: "HubSpot", cat: "crm", icon: Plug, color: "#FF7A59" },
  { name: "Salesforce", cat: "crm", icon: Cloud, color: "#00A1E0" },
  { name: "Stripe", cat: "finance", icon: CreditCard, color: "#635BFF" },
  { name: "WhatsApp", cat: "comms", icon: MessageCircle, color: "#25D366" },
  { name: "Webhooks", cat: "tools", icon: Webhook, color: "#F59E0B" },
  { name: "OpenAI GPT-4o", cat: "ai", icon: Sparkles, color: "#10A37F" },
  { name: "Anthropic Claude 3.5", cat: "ai", icon: Cpu, color: "#D97706" },
  { name: "DeepSeek V3", cat: "ai", icon: Bot, color: "#3B82F6" },
];

function IntegrationsSection() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? ALL_INTEGRATIONS : ALL_INTEGRATIONS.filter((i) => i.cat === filter);

  return (
    <section id="integrations" className="border-b border-line bg-base py-24">
      <Container>
        <RevealTitle
          eyebrow="Ecosystem"
          title={<>Connect the stack <span className="text-gradient">your team lives in</span></>}
          sub="Native integrations for AI models, CRMs, communication tools, and databases."
        />

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Connectors" },
            { id: "ai", label: "AI Models" },
            { id: "crm", label: "CRMs & Sales" },
            { id: "comms", label: "Communication" },
            { id: "finance", label: "Finance & Ops" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                filter === tab.id
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-surface border border-line text-ink-dim hover:text-ink hover:border-line-strong"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Integration Grid */}
        <div className="flex flex-wrap justify-center gap-3">
          {filtered.map((it) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface/80 px-4 py-3.5 transition-all hover:border-emerald-500/40 hover:bg-surface"
              >
                <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${it.color}1a`, color: it.color }}>
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-ink">{it.name}</span>
                <span className="size-1.5 rounded-full bg-emerald-400" />
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Templates Section ---------------- */
const PREVIEW_TEMPLATES = [
  { name: "Lead Qualification & Enrichment", icon: Cpu, color: "#10B981", popular: true },
  { name: "Meeting Notes & Task Dispatcher", icon: Send, color: "#3B82F6" },
  { name: "Support Ticket AI Triaging", icon: Bell, color: "#F59E0B" },
  { name: "Automated Invoice Reminders", icon: Plug, color: "#8B5CF6" },
];

function TemplatesSection() {
  return (
    <section id="templates" className="bg-base py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <RevealTitle
              align="left"
              eyebrow="Pre-built Templates"
              title={<>Start from a proven <span className="text-gradient">blueprint</span> or customize</>}
              sub="Browse 50+ battle-tested workflows for sales, ops, marketing, and support."
            />
            <Link to="/register" className="btn btn-soft btn-md border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20">
              Browse all templates <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PREVIEW_TEMPLATES.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease }}
                  className={cn(
                    "rounded-2xl border p-5 transition-all hover:border-emerald-500/40",
                    t.popular ? "border-emerald-500/40 bg-surface shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "border-line bg-surface/60",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg" style={{ background: `${t.color}1a`, color: t.color }}>
                      <Icon className="size-[18px]" />
                    </div>
                    {t.popular && <span className="chip text-[10px] text-emerald-600 border-emerald-500/30">Popular</span>}
                  </div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">1-click install</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Problem Section ---------------- */
const PROBLEMS = [
  { icon: Hourglass, title: "Hours lost to copy-pasting", desc: "Leads, tickets, and spreadsheets shuffle manually across 10 tabs every single day." },
  { icon: Plug, title: "Disconnected software stack", desc: "Your CRM, email, and databases operate in isolation with zero automatic sync." },
  { icon: Bot, title: "Unused AI capability", desc: "LLMs are available, but integrating them into real workflows requires weeks of custom backend code." },
  { icon: MousePointerClick, title: "Zero run-level visibility", desc: "You have no real-time audit log of what ran, why a lead failed, or how much AI tokens cost." },
];

function Problem() {
  return (
    <section className="border-b border-line bg-surface-30 py-24">
      <Container>
        <RevealTitle
          eyebrow="The Friction"
          title="Why modern teams still waste 40+ hours a month"
          sub="Repetitive manual tasks slow down growth while AI models sit idle because wiring them up is too complex."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.06, duration: 0.4, ease }}
                className="rounded-2xl border border-line bg-surface p-6 hover:border-amber-500/30 transition-colors"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
                  <Icon className="size-5 text-amber-400" />
                </div>
                <h3 className="font-display text-base font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Pricing Section with Billing Toggle ---------------- */
function Pricing() {
  const [annual, setAnnual] = useState(true);

  const PLANS = [
    {
      name: "Starter",
      price: "$0",
      period: "forever free",
      desc: "For individual builders and first automations.",
      features: ["Up to 3 active workflows", "1 AI Agent", "1,000 AI credits / mo", "Email & webhook triggers", "Community support"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: annual ? "$16" : "$20",
      period: "per workspace / mo",
      desc: "For growing teams automating core workflows.",
      features: ["Unlimited workflows", "5 AI agents", "50,000 AI credits / mo", "All triggers & connectors", "Webhooks + API access", "Priority support"],
      cta: "Start 14-day free trial",
      highlight: true,
    },
    {
      name: "Business",
      price: annual ? "$48" : "$60",
      period: "per workspace / mo",
      desc: "For enterprise automation at scale.",
      features: ["Everything in Pro", "Unlimited agents & custom LLMs", "SAML SSO + audit logs", "Custom SLA & account manager", "Dedicated IP & VPC"],
      cta: "Contact sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-base py-24">
      <Container>
        <RevealTitle eyebrow="Pricing" title="Simple transparent pricing that scales with you" />

        {/* Monthly vs Annual Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={cn("text-xs font-semibold", !annual ? "text-ink" : "text-ink-faint")}>Monthly Billed</span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative h-7 w-13 rounded-full bg-surface border border-line p-1 transition-colors"
          >
            <div className={cn("size-5 rounded-full bg-emerald-400 transition-transform", annual ? "translate-x-6" : "translate-x-0")} />
          </button>
          <span className={cn("text-xs font-semibold flex items-center gap-1.5", annual ? "text-ink" : "text-ink-faint")}>
            <span>Annual Billed</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/30">
              SAVE 20%
            </span>
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7 transition-all duration-300",
                p.highlight
                  ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 via-surface to-base shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                  : "border-line bg-surface",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-md">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-ink">{p.name}</h3>
              <p className="mt-1 text-xs text-ink-dim">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-extrabold text-ink">{p.price}</span>
                <span className="text-xs text-ink-faint">{p.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-ink-dim">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={cn(
                  "btn btn-md mt-8 w-full font-bold",
                  p.highlight ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "btn-ghost"
                )}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Security ---------------- */
function Security() {
  const items = [
    { icon: Lock, t: "SOC 2 Type II ready", d: "Hardened control sets for storage and transit." },
    { icon: ShieldCheck, t: "Role-based access", d: "Granular roles across every team and tool." },
    { icon: Eye, t: "Full audit logs", d: "Every run, decision and change is recorded." },
    { icon: KeyRound, t: "Bring your own keys", d: "Use your OpenAI, Anthropic or DeepSeek keys." },
  ];
  return (
    <section id="security" className="border-y border-line bg-surface-30 py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <RevealTitle
              align="left"
              eyebrow="Security & privacy"
              title="Your data stays yours"
              sub="Enterprise-grade security throughout — from storage to inference."
            />
            <div className="grid gap-6 sm:grid-cols-2">
              {items.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.t} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/50">
                      <Icon className="size-4 text-primary-soft" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{s.t}</p>
                      <p className="text-xs leading-relaxed text-ink-faint">{s.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl border border-line bg-surface/70 p-6"
          >
            <div className="font-mono text-xs leading-6 text-ink-dim">
              <p><span className="text-accent">$</span> flowpilot run sales-lead-flow</p>
              <p><span className="text-success">✓</span> trigger: new lead · 1.2s</p>
              <p><span className="text-success">✓</span> ai: score-lead · 87/100 high intent</p>
              <p><span className="text-success">✓</span> branch: score ≥ 70 → accepted</p>
              <p><span className="text-success">✓</span> action: create-crm-record · ok</p>
              <p><span className="text-success">✓</span> action: send-followup · delivered</p>
              <p className="text-ink-faint">— 0 errors · run complete —</p>
              <p><span className="text-warn">∑</span> 4.2s · 5/5 steps · <span className="text-success">tokens ~1,120</span></p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Analytics ---------------- */
const METRICS = [
  { icon: Activity, label: "Executions", value: "12,482" },
  { icon: TrendingUp, label: "Success rate", value: "98.7%" },
  { icon: Hourglass, label: "Time saved", value: "824 hrs" },
  { icon: Bot, label: "AI tasks", value: "3,912" },
];

function AnalyticsSection() {
  const points = [22, 30, 26, 42, 38, 56, 48, 66, 60, 78, 72, 88];
  const max = 100;
  const coords = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");
  return (
    <section id="analytics" className="border-b border-line bg-base py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <RevealTitle
              align="left"
              eyebrow="Analytics"
              title={<>See exactly what your automations <span className="text-gradient">are doing</span></>}
              sub="Every run is recorded — successful, failed or waiting — with costs, durations and AI usage you can actually trust."
            />
            <ul className="space-y-2.5">
              {[
                "Live execution tracking for every workflow",
                "Step-level success and failure timelines",
                "AI token usage and cost estimates",
                "Time-saved math your CFO will actually like",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink-dim">
                  <Check className="size-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="rounded-xl border border-line bg-surface-soft p-4">
                    <Icon className="size-4 text-primary-soft" />
                    <p className="mt-2 font-display text-2xl font-bold text-ink">{m.value}</p>
                    <p className="text-xs text-ink-faint">{m.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl border border-line bg-surface-soft p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">Executions · last 30 days</p>
                <span className="chip text-[10px] text-success border-success/30">+12.4%</span>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-28 w-full">
                <defs>
                  <linearGradient id="landingArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`0,100 ${coords} 100,100`} fill="url(#landingArea)" />
                <polyline points={coords} fill="none" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((v, i) => (
                  <circle key={i} cx={(i / (points.length - 1)) * 100} cy={100 - (v / max) * 100} r="1.6" fill="#818CF8" />
                ))}
              </svg>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
const FAQS = [
  { q: "Do I need to write any code?", a: "No. Describe what you want in plain English — or drag nodes onto a canvas — and FlowPilot builds a ready-to-run workflow. You can tune every step visually before going live." },
  { q: "Which AI providers does FlowPilot support?", a: "OpenAI, Anthropic and DeepSeek out of the box. Bring your own API keys, or use the built-in simulated provider that powers the full product with zero setup." },
  { q: "Can FlowPilot work with my existing tools?", a: "Yes. Gmail, Slack, HubSpot, Salesforce, Google Sheets, Stripe, WhatsApp and webhooks are supported, with more connectors shipping regularly." },
  { q: "What happens when a step fails?", a: "Every execution is logged step-by-step. Failures are surfaced in the execution timeline so you can see exactly where things broke — and fix or disable that step in seconds." },
  { q: "Is there a free plan?", a: "Yes. The Starter plan is free forever and covers up to 5 active workflows with 100 executions a month — plenty for your first automations." },
  { q: "Can I try everything without connecting my accounts?", a: "Absolutely. Demo mode simulates every integration and AI call, so you can explore the entire product — no API keys, no third-party accounts, no billing." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-line bg-surface-30 py-24">
      <Container className="max-w-3xl">
        <RevealTitle eyebrow="FAQ" title="Questions, answered" />
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={cn(
                  "rounded-2xl border bg-surface transition-colors",
                  isOpen ? "border-primary/40" : "border-line",
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display text-sm font-semibold text-ink">{f.q}</span>
                  <ChevronDown className={cn("size-4 shrink-0 text-ink-faint transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-sm leading-relaxed text-ink-dim">{f.a}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
const TESTIMONIALS = [
  { name: "Maya Chen", role: "Head of Ops, Brightline", score: 5, text: "We replaced six tools and ~40 hours of manual work a month with FlowPilot. The AI builder genuinely feels like magic." },
  { name: "Daniel Osei", role: "Founder, CloudCo", score: 5, text: "Our lead scoring flow qualifies more leads in a day than we used to manage in a week of spreadsheets." },
  { name: "Sofia Mendez", role: "Revenue Ops, Quantica", score: 5, text: "The agent drafts emails, updates CRM and follows up — I literally just approve. It's paid for itself already." },
];

function Testimonials() {
  return (
    <section className="bg-base py-24">
      <Container>
        <RevealTitle eyebrow="Loved by teams" title="Don't take our word for it" />
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.4, ease }}
              className="flex flex-col rounded-2xl border border-line bg-surface p-6"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={cn("size-4", s < t.score ? "fill-warn text-warn" : "text-ink-faint/40")} />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-ink-dim">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-white">
                  {t.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-faint">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-base py-28">
      {/* Background Animated Glow Elements */}
      <div className="absolute inset-0 bg-hero-glow opacity-80 pointer-events-none" />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-gradient-to-tr from-primary/15 via-violeta/10 to-accent/10 blur-[120px] pointer-events-none"
      />

      <Container>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-surface via-surface-soft to-base p-8 sm:p-14 md:p-20 shadow-[0_0_80px_rgba(99,102,241,0.2)] backdrop-blur-2xl text-center">
          {/* Subtle Ambient Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-faint px-4 py-1.5 text-xs font-semibold text-primary-soft shadow-inner mb-6"
          >
            <Sparkles className="size-3.5 text-accent animate-pulse" />
            <span>START IN UNDER 2 MINUTES • NO CREDIT CARD</span>
          </motion.div>

          {/* Headline with Clean Typography & Dynamic Gradient */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl leading-[1.15]"
          >
            Ready to put your workflows
            <br />
            <span className="text-gradient">on autopilot with FlowPilot?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg"
          >
            Join thousands of forward-thinking teams using AI agents to automate tasks, connect apps, and save hundreds of hours every month.
          </motion.p>

          {/* CTA Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-soft via-primary to-violeta px-8 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <span>Start automating free</span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="btn btn-ghost btn-lg w-full sm:w-auto border-line hover:border-line-strong hover:bg-surface-soft"
            >
              Explore live demo
            </Link>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-ink-faint"
          >
            <span className="flex items-center gap-1.5">
              <Check className="size-4 text-emerald-600" /> Free forever tier
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-4 text-emerald-600" /> 1,000 free AI credits
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-4 text-emerald-600" /> SOC-2 ready security
            </span>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Footer ---------------- */
const FOOTER_COLS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "#features" },
      { label: "How it works", to: "#how" },
      { label: "Integrations", to: "#integrations" },
      { label: "Pricing", to: "#pricing" },
      { label: "Security", to: "#security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "#how" },
      { label: "Blog", to: "#features" },
      { label: "Use cases", to: "#analytics" },
      { label: "Contact", to: "mailto:hello@flowpilot.app" },
      { label: "Get started", to: "/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", to: "/legal/privacy" },
      { label: "Terms of service", to: "/legal/terms" },
      { label: "Security", to: "/legal/security" },
      { label: "GDPR", to: "/legal/gdpr" },
      { label: "FAQ", to: "#faq" },
    ],
  },
];

function Footer() {
  return (
    <footer className="bg-soft py-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary-soft">
                <Workflow className="size-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-ink">Flow<span className="text-gradient">Pilot</span></span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-faint">
              The AI-powered automation platform for modern teams. Build, run and improve workflows with agents.
            </p>
            <Link to="/register" className="btn btn-soft btn-sm mt-5">
              Start automating free <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-semibold text-ink">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to.startsWith("http") || l.to.startsWith("mailto:") ? (
                      <a href={l.to} className="text-sm text-ink-faint transition-colors hover:text-ink">{l.label}</a>
                    ) : l.to.startsWith("#") ? (
                      <a href={l.to} className="text-sm text-ink-faint transition-colors hover:text-ink">{l.label}</a>
                    ) : (
                      <Link to={l.to} className="text-sm text-ink-faint transition-colors hover:text-ink">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row">
          <p>© 2026 FlowPilot. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Languages className="size-3.5" /> English · <span className="cursor-pointer hover:text-ink">Deutsch</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

/* ---------------- Page ---------------- */
export default function Landing() {
  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <Hero />
      <LogoBar />
      <Problem />
      <Features />
      <HowItWorks />
      <IntegrationsSection />
      <TemplatesSection />
      <AnalyticsSection />
      <Pricing />
      <Security />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
