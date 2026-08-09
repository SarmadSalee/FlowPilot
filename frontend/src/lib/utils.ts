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