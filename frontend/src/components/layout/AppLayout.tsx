import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Workflow,
  Bot,
  Plug,
  PlaySquare,
  BarChart3,
  LayoutTemplate,
  Users,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  ChevronsUpDown,
  Menu,
  Zap,
  Loader2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "@/store/auth";
import { api } from "@/lib/api";
import { Avatar, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Workflow as WorkflowType } from "@/lib/types";

const NAV = [
  {
    section: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Build",
    items: [
      { to: "/workflows", label: "Workflows", icon: Workflow },
      { to: "/ai/create", label: "AI Creator", icon: Sparkles },
    ],
  },
  {
    section: "Intelligence",
    items: [{ to: "/agents", label: "Agents", icon: Bot }],
  },
  {
    section: "Connect",
    items: [{ to: "/integrations", label: "Integrations", icon: Plug }],
  },
  {
    section: "Monitor",
    items: [
      { to: "/executions", label: "Executions", icon: PlaySquare },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    section: "Build faster",
    items: [{ to: "/templates", label: "Templates", icon: LayoutTemplate }],
  },
  {
    section: "Workspace",
    items: [
      { to: "/team", label: "Team", icon: Users },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/billing", label: "Plans & Billing", icon: CreditCard },
    ],
  },
];

function Brand() {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-2.5 px-1">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Workflow className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-bold tracking-tight text-ink">
          Flow<span className="text-primary-soft">Pilot</span>
        </p>
      </div>
    </NavLink>
  );
}

function CreditsPill() {
  const stats = useQuery({
    queryKey: ["credits"],
    queryFn: () => api<{ remaining: number; used: number; planLimit: number }>("/api/dashboard/credits"),
  });
  const remaining = stats.data?.remaining ?? 0;
  const limit = stats.data?.planLimit ?? 0;
  const pct = limit ? Math.min(100, Math.round((remaining / limit) * 100)) : 100;
  return (
    <NavLink
      to="/billing"
      title="AI credits"
      className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs transition-colors hover:border-primary/40"
    >
      <span className="flex size-6 items-center justify-center rounded-md bg-infobg text-primary">
        <Zap className="size-3.5" />
      </span>
      <div className="w-20">
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-ink-faint">
          <span>Credits</span>
          <span className="font-mono text-ink-dim">{remaining.toLocaleString()}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-soft">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, org, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();

  const credits = useQuery({
    queryKey: ["credits"],
    queryFn: () => api<{ remaining: number; used: number; planLimit: number }>("/api/dashboard/credits"),
  });

  const runDemo = async () => {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      const wfs = await api<WorkflowType[]>("/api/workflows");
      const demo = wfs.find((w) => w.name.toLowerCase().includes("qualification"));
      if (!demo) {
        toast.error("Demo workflow not found");
        nav("/workflows");
        return;
      }
      const run = await api<{ executionId: string }>(`/api/workflows/${demo._id}/run`, {
        method: "POST",
        body: {},
      });
      qc.invalidateQueries({ queryKey: ["executions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Demo workflow running — follow it live");
      nav(`/executions/${run.executionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo run failed");
    } finally {
      setDemoBusy(false);
    }
  };

  const sidebar = useMemo(
    () => (
      <aside className="flex h-full w-60 flex-col border-r border-line bg-surface">
        <div className="px-4 pt-5 pb-4">
          <Brand />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.section} className="mb-5">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-primary-faint text-primary-soft"
                            : "text-ink-dim hover:bg-surface-soft hover:text-ink",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={cn("size-4", isActive && "text-primary")} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <CreditsPill />
          <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar name={user?.name ?? "U"} avatarColor={user?.avatarColor} avatar={user?.avatar} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-[11px] text-ink-faint">{org?.name}</p>
            </div>
            <button
              onClick={async () => {
                await logout();
                nav("/");
              }}
              title="Sign out"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    ),
    [user, org, logout, nav],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-60">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-ink-dim hover:bg-surface-soft lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <Breadcrumb path={loc.pathname} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {org && (
              <button
                onClick={() => toast.info("Switching orgs is available on Enterprise")}
                className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:border-primary/40 sm:flex"
              >
                <span className="size-1.5 rounded-full bg-success" />
                {org.name}
                <ChevronsUpDown className="size-3.5 text-ink-faint" />
              </button>
            )}
            <CreditsPill />
            <button
              className="btn btn-primary btn-sm hidden md:inline-flex"
              onClick={runDemo}
              disabled={demoBusy}
            >
              {demoBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              {demoBusy ? "Running…" : "Run Demo"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Breadcrumb({ path }: { path: string }) {
  const segments = path.split("/").filter(Boolean);
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    workflows: "Workflows",
    "ai/create": "AI Creator",
    agents: "Agents",
    integrations: "Integrations",
    executions: "Executions",
    analytics: "Analytics",
    templates: "Templates",
    team: "Team",
    settings: "Settings",
    billing: "Plans & Billing",
    onboarding: "Onboarding",
  };
  return (
    <div className="flex items-center gap-2 text-sm">
      {segments.map((seg, i) => {
        const label =
          map[segments.slice(0, i + 1).join("/")] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
        const last = i === segments.length - 1;
        return (
          <React.Fragment key={seg + i}>
            {i > 0 && <span className="text-ink-faint">/</span>}
            <span className={last ? "font-semibold text-ink" : "text-ink-faint"}>{label}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}