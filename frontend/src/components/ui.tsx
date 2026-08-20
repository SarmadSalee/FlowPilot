import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, CheckCircle2, Info, Loader2, Sparkles, Rocket, Bot, Leaf, Flame, Star, Zap, Code, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/store/theme";

const BADGE_MAP: Record<string, { fg: string; bg: string }> = {
  success: { fg: "#15803D", bg: "#F0FDF4" },
  active: { fg: "#15803D", bg: "#F0FDF4" },
  enabled: { fg: "#15803D", bg: "#F0FDF4" },
  connected: { fg: "#15803D", bg: "#F0FDF4" },
  sent: { fg: "#15803D", bg: "#F0FDF4" },
  running: { fg: "#1D4ED8", bg: "#EFF6FF" },
  queued: { fg: "#1D4ED8", bg: "#EFF6FF" },
  waiting: { fg: "#1D4ED8", bg: "#EFF6FF" },
  pending: { fg: "#B45309", bg: "#FFFBEB" },
  warning: { fg: "#B45309", bg: "#FFFBEB" },
  failed: { fg: "#B91C1C", bg: "#FEF2F2" },
  error: { fg: "#B91C1C", bg: "#FEF2F2" },
  draft: { fg: "#475467", bg: "#F2F4F7" },
  paused: { fg: "#475467", bg: "#F2F4F7" },
  archived: { fg: "#475467", bg: "#F2F4F7" },
  disabled: { fg: "#475467", bg: "#F2F4F7" },
  inactive: { fg: "#475467", bg: "#F2F4F7" },
  new: { fg: "#1D4ED8", bg: "#EFF6FF" },
  contacted: { fg: "#1D4ED8", bg: "#EFF6FF" },
  unqualified: { fg: "#475467", bg: "#F2F4F7" },
  lost: { fg: "#475467", bg: "#F2F4F7" },
  spam: { fg: "#B91C1C", bg: "#FEF2F2" },
  converted: { fg: "#15803D", bg: "#F0FDF4" },
  hot: { fg: "#B91C1C", bg: "#FEF2F2" },
  warm: { fg: "#B45309", bg: "#FFFBEB" },
  cold: { fg: "#0369A1", bg: "#F0F9FF" },
  medium: { fg: "#B45309", bg: "#FFFBEB" },
};

export function Badge({
  status,
  children,
  className,
}: {
  status?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const key = (status ?? "default").toLowerCase();
  const c = BADGE_MAP[key] ?? { fg: "#475467", bg: "#F2F4F7" };
  const pulse = key === "running" || key === "queued" || key === "waiting" || key === "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        className,
      )}
      style={{ color: c.fg, background: c.bg }}
    >
      <span className={cn("size-1.5 rounded-full", pulse && "animate-pulse-dot")} style={{ background: c.fg }} />
      {children ?? key}
    </span>
  );
}

/* ---------- Button ---------- */
export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  icon,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "btn",
        size === "sm" && "btn-sm",
        size === "md" && "btn-md",
        size === "lg" && "btn-lg",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        variant === "soft" && "btn-soft",
        variant === "danger" && "btn-danger",
        variant === "outline" && "border border-line-strong bg-surface text-ink hover:bg-surface-soft",
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div>
        <h3 className="font-semibold text-sm text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Inputs ---------- */
export function Input({
  label,
  error,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input className={cn("input-base", error && "border-danger/60", className)} {...props} />
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        className={cn("input-base min-h-24 resize-y leading-relaxed", className)}
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        className={cn("input-base appearance-none bg-no-repeat pr-9", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 3 3 3-3'/></svg>\")",
          backgroundPosition: "right 0.75rem center",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

/* ---------- Tag ---------- */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-ink-dim",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-line-strong",
        disabled && "opacity-40",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 my-8 w-full rounded-2xl border border-line bg-surface shadow-card animate-fade-up",
          widths[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ink-faint transition-colors hover:bg-surface-soft hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Spinner / Skeleton / Empty ---------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-primary", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-ink-faint">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-soft", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ElementType;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-soft">
        <Icon className="size-6 text-ink-faint" />
      </div>
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-xs text-ink-faint">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Alert ---------- */
export function Alert({
  kind = "info",
  title,
  children,
}: {
  kind?: "info" | "success" | "warning" | "danger";
  title?: string;
  children?: React.ReactNode;
}) {
  const conf = {
    info: { Icon: Info, color: "text-accent", bg: "bg-accent/10 border-accent/25" },
    success: { Icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/25" },
    warning: {
      Icon: AlertTriangle,
      color: "text-warn",
      bg: "bg-warn/10 border-warn/25",
    },
    danger: { Icon: AlertTriangle, color: "text-danger", bg: "bg-danger/10 border-danger/25" },
  }[kind];
  const Icon = conf.Icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", conf.bg)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", conf.color)} />
      <div>
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className="text-ink-dim">{children}</div>}
      </div>
    </div>
  );
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-soft", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; icon?: React.ElementType }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface-soft p-1">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
              active
                ? "bg-primary/15 text-primary-soft"
                : "text-ink-faint hover:text-ink",
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Reveal on scroll ---------- */
export function useInView<T extends HTMLElement>(rootMargin = "0px 0px -60px 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          ob.disconnect();
        }
      },
      { rootMargin },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

/* ---------- Avatar ---------- */
const AVATAR_HEX = ["#4F46E5", "#2563EB", "#7C3AED", "#16A34A", "#D97706"];

export const AVATAR_PRESETS: {
  key: string;
  label: string;
  from: string;
  to: string;
  icon: React.ElementType;
}[] = [
  { key: "indigo", label: "Indigo", from: "#4F46E5", to: "#7C3AED", icon: Sparkles },
  { key: "violet", label: "Violet", from: "#7C3AED", to: "#C026D3", icon: Rocket },
  { key: "sky", label: "Sky", from: "#0EA5E9", to: "#6366F1", icon: Bot },
  { key: "emerald", label: "Emerald", from: "#10B981", to: "#0EA5E9", icon: Leaf },
  { key: "rose", label: "Rose", from: "#F43F5E", to: "#F59E0B", icon: Flame },
  { key: "amber", label: "Amber", from: "#F59E0B", to: "#EF4444", icon: Star },
  { key: "cyan", label: "Cyan", from: "#06B6D4", to: "#3B82F6", icon: Zap },
  { key: "graphite", label: "Graphite", from: "#334155", to: "#6366F1", icon: Code },
];

const avatarPresetByKey = Object.fromEntries(AVATAR_PRESETS.map((p) => [p.key, p]));

export function AvatarPreset({
  color,
  size = "md",
  className,
}: {
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const preset = color ? avatarPresetByKey[color] : undefined;
  const dims = size === "sm" ? "size-6" : size === "lg" ? "size-12" : "size-8";
  if (!preset) return null;
  const Icon = preset.icon;
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full text-white ring-1 ring-white/40", dims, className)}
      style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
    >
      <Icon className={size === "sm" ? "size-3" : size === "lg" ? "size-6" : "size-4"} strokeWidth={2} />
    </div>
  );
}

export function Avatar({ name, avatarColor, avatar, className }: { name: string; avatarColor?: string; avatar?: string; className?: string }) {
  const i = (name.charCodeAt(0) || 0) % AVATAR_HEX.length;
  const ini = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn("size-8 shrink-0 rounded-full object-cover ring-1 ring-line-strong", className)}
      />
    );
  }
  if (avatarColor && avatarPresetByKey[avatarColor]) {
    return <AvatarPreset color={avatarColor} className={className} />;
  }
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
        className,
      )}
      style={{ background: AVATAR_HEX[i] }}
    >
      {ini}
    </div>
  );
}

/* ---------- Theme toggle ---------- */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-dim transition-colors hover:border-primary/40 hover:text-ink",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}