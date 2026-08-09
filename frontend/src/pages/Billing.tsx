import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Check, Zap, Users, Gauge, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import useAuth from "@/store/auth";

interface Plan {
  id: string;
  name: string;
  price: number;
  executionsPerMonth: number;
  workflows: number | string;
  aiEnabled: boolean;
  teamSize: number | string;
  highlights: string[];
}

interface CurrentBilling {
  plan: string;
  usageThisMonth: number;
  executionLimit: number;
  workflowsLimit: number | string;
  aiEnabled: boolean;
  teamSize: number | string;
  periodStart: string;
}

export default function Billing() {
  const qc = useQueryClient();
  const { org } = useAuth();
  const [target, setTarget] = useState<Plan | null>(null);

  const { data: plans } = useQuery<Plan[]>({ queryKey: ["billing-plans"], queryFn: () => api("/api/billing/plans") });
  const { data: current, refetch } = useQuery<CurrentBilling>({ queryKey: ["billing-current"], queryFn: () => api("/api/billing/current") });

  const checkout = useMutation({
    mutationFn: (plan: string) => api<{ plan: string; mock?: boolean; message?: string }>("/api/billing/checkout", { method: "POST", body: { plan } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["billing-current"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["org"] });
      setTarget(null);
      refetch();
      toast.success(r.message ?? `Switched to ${r.plan}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Checkout failed"),
  });

  const cancel = useMutation({
    mutationFn: () => api("/api/billing/cancel", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing-current"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      refetch();
      toast.success("Subscription canceled - you're on the Free plan");
    },
  });

  const plan = current?.plan ?? org?.plan ?? "free";
  const usagePct = current && current.executionLimit ? Math.min(100, Math.round((current.usageThisMonth / current.executionLimit) * 100)) : 0;

  const featureIcon = (f: string) => {
    if (f.toLowerCase().includes("ai")) return <Zap className="size-4 text-violeta" />;
    if (f.toLowerCase().includes("team") || f.toLowerCase().includes("unlimited")) return <Users className="size-4 text-accent" />;
    if (f.toLowerCase().includes("workflow") || f.toLowerCase().includes("execution")) return <Gauge className="size-4 text-primary-soft" />;
    return <Check className="size-4 text-success" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Plans and billing</h1>
        <p className="mt-1 text-sm text-ink-dim">Current plan: <span className="font-semibold capitalize text-primary-soft">{plan}</span></p>
      </div>

      {current && (
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs text-ink-faint">This month's usage</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                {current.usageThisMonth.toLocaleString()} <span className="text-sm font-normal text-ink-faint">/ {current.executionLimit.toLocaleString()} executions</span>
              </p>
            </div>
            <div className="w-full md:max-w-xs">
              <div className="mb-1 flex justify-between text-[11px] text-ink-faint"><span>{usagePct}% used</span><span>resets monthly</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-primary-soft transition-all" style={{ width: `${usagePct}%` }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {(plans ?? []).map((p) => {
          const isCurrent = p.id === plan;
          const isFree = p.id === "free";
          return (
            <Card key={p.id}
              className={cn("relative flex flex-col p-6", isCurrent ? "border-primary/60" : p.id === "pro" && "border-violeta/40")}>
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary-faint px-3 py-0.5 text-[10px] font-semibold text-primary-soft">
                  Current plan
                </span>
              )}
              <div className="flex items-center gap-2">
                {p.id === "business" ? <Crown className="size-5 text-warn" /> : p.id === "pro" ? <Zap className="size-5 text-violeta" /> : <Gauge className="size-5 text-ink-faint" />}
                <h3 className="font-display text-lg font-bold text-ink">{p.name}</h3>
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-ink">
                ${p.price}<span className="text-sm font-normal text-ink-faint">/mo</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-ink-dim">
                    {featureIcon(h)} {h}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="soft" disabled className="w-full">
                    <Check className="size-4" /> Active
                  </Button>
                ) : (
                  <Button className="w-full" variant={p.id === "pro" ? "primary" : "soft"} onClick={() => setTarget(p)}>
                    {isFree ? "Downgrade to Free" : `Switch to ${p.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {plan !== "free" && (
        <Card className="flex flex-col items-start justify-between gap-3 border-danger/30 p-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-ink">Cancel subscription</p>
            <p className="mt-0.5 text-xs text-ink-faint">Downgrades to the free plan immediately. Your workflows and data are kept.</p>
          </div>
          <Button variant="danger" onClick={() => { if (confirm("Cancel your subscription and downgrade to Free?")) cancel.mutate(); }} loading={cancel.isPending}>
            <X className="size-4" /> Cancel plan
          </Button>
        </Card>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)}
        title={target ? `Confirm switch to ${target.name}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button loading={checkout.isPending} onClick={() => target && checkout.mutate(target.id)}>
              {target?.price === 0 ? <><Check className="size-4" /> Switch to Free</> : <><Loader2 className="size-4" /> Checkout</>}
            </Button>
          </>
        }>
        {target && (
          <div className="space-y-4 text-sm text-ink-dim">
            <p><span className="font-semibold text-ink">{target.name}</span> plan - ${target.price}/mo.</p>
            <ul className="space-y-2">
              {target.highlights.map((h) => <li key={h} className="flex items-center gap-2"><Check className="size-4 text-success" /> {h}</li>)}
            </ul>
            <p className="rounded-xl bg-primary-faint/60 px-3 py-2 text-xs text-primary-soft">
              Mock checkout: billing runs in demo mode, so no payment is charged.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}