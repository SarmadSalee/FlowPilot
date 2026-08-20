import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function nodeColor(type: string): string {
  switch (type) {
    case "trigger":
      return "#2563EB"; // blue
    case "ai":
      return "#7C3AED"; // purple
    case "condition":
      return "#D97706"; // amber
    case "error":
      return "#DC2626"; // red
    default:
      return "#16A34A"; // green (action/utility)
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "success":
    case "active":
    case "connected":
    case "enabled":
    case "sent":
      return "#16A34A";
    case "failed":
    case "error":
      return "#DC2626";
    case "running":
    case "queued":
    case "waiting":
      return "#2563EB";
    case "pending":
    case "draft":
    case "paused":
    case "archived":
    case "warning":
      return "#D97706";
    case "disabled":
    case "inactive":
      return "#98A2B3";
    default:
      return "#98A2B3";
  }
}

/* ---------- Lead scoring helpers ---------- */

export function qualificationFor(score: number): "hot" | "warm" | "cold" | "qualified" | "unqualified" {
  if (score >= 90) return "hot";
  if (score >= 70) return "warm";
  if (score >= 40) return "qualified";
  if (score >= 20) return "cold";
  return "unqualified";
}

export function gradeFor(score: number): "A" | "B" | "C" | "D" {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

const SCORE_COLOR: Record<string, { fg: string; bg: string; hex: string }> = {
  hot: { fg: "#B91C1C", bg: "#FEF2F2", hex: "#DC2626" },
  warm: { fg: "#B45309", bg: "#FFFBEB", hex: "#D97706" },
  qualified: { fg: "#1D4ED8", bg: "#EFF6FF", hex: "#2563EB" },
  cold: { fg: "#0369A1", bg: "#F0F9FF", hex: "#0284C7" },
  unqualified: { fg: "#475467", bg: "#F2F4F7", hex: "#98A2B3" },
};

export function scoreTone(score: number) {
  return SCORE_COLOR[qualificationFor(score)] ?? SCORE_COLOR.unqualified;
}

export function scoreColor(score: number): string {
  return scoreTone(score).hex;
}

export function intentLabel(intent: string): string {
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export function intentColor(intent: string): string {
  switch (intent) {
    case "high":
      return "#DC2626";
    case "medium":
      return "#D97706";
    default:
      return "#98A2B3";
  }
}

export function qualificationLabel(q: string): string {
  return q.charAt(0).toUpperCase() + q.slice(1);
}

export function stageLabel(s: string): string {
  const map: Record<string, string> = {
    awareness: "Awareness",
    interest: "Interest",
    consideration: "Consideration",
    evaluation: "Evaluation",
    decision: "Decision",
    customer: "Customer",
  };
  return map[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    unqualified: "Unqualified",
    converted: "Converted",
    lost: "Lost",
    spam: "Spam",
  };
  return map[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

export function eventTypeLabel(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreFactorKindColor(kind: string): string {
  switch (kind) {
    case "positive":
      return "#16A34A";
    case "negative":
      return "#DC2626";
    default:
      return "#98A2B3";
  }
}