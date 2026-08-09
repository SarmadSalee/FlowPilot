import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Check, Mail, MessageSquare, FileSpreadsheet, Database, Cloud, CreditCard, CalendarClock, Unplug, Plug, Blocks } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, Input, Modal } from "@/components/ui";
import type { Integration } from "@/lib/types";

const iconFor = (icon?: string) => {
  switch (icon) {
    case "mail":
      return Mail;
    case "slack":
      return MessageSquare;
    case "sheet":
      return FileSpreadsheet;
    case "hubspot":
      return Database;
    case "cloud":
      return Cloud;
    case "credit-card":
      return CreditCard;
    case "calendar":
      return CalendarClock;
    default:
      return Blocks;
  }
};

const colorFor = (key: string) => {
  const map: Record<string, string> = {
    gmail: "#EA4335",
    slack: "#4A154B",
    google_sheets: "#34A853",
    hubspot: "#FF7A59",
    salesforce: "#00A1E0",
    stripe: "#635BFF",
    calendly: "#006BFF",
    zapier: "#FF4F00",
    notion: "#191919",
    airtable: "#FCB400",
    trello: "#0079BF",
    asana: "#F06A6A",
    shopify: "#95BF47",
    intercom: "#1F8DED",
    webhook: "#6366F1",
  };
  return map[key] ?? "#6366F1";
};

const catColor: Record<string, string> = {
  Communication: "#22D3EE",
  Productivity: "#34D399",
  CRM: "#FBBF24",
  Payments: "#F472B6",
  Scheduling: "#8B5CF6",
  Automations: "#FB923C",
  Data: "#60A5FA",
};

export default function Integrations() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Integration | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});

  const { data: catalog, isLoading } = useQuery<Integration[]>({
    queryKey: ["integrations"],
    queryFn: () => api("/api/integrations"),
  });

  const connect = useMutation({
    mutationFn: ({ key, credentials }: { key: string; credentials?: Record<string, string> }) =>
      api(`/api/integrations/${key}/connect`, { method: "POST", body: { credentials: credentials ?? {} } }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setTarget(null);
      setCreds({});
      toast.success(`${v.key} connected`);
    },
    onError: () => toast.error("Connection failed"),
  });

  const disconnect = useMutation({
    mutationFn: (key: string) => api(`/api/integrations/${key}/disconnect`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration disconnected");
    },
    onError: () => toast.error("Could not disconnect"),
  });

  const list = (catalog ?? []).filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const connectedCount = (catalog ?? []).filter((i) => i.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Integrations</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {connectedCount} connected - {catalog?.length ?? 0} available. Connect your stack.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search integrations..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface-soft" />)
          : list.map((integ) => {
              const Icon = iconFor(integ.icon);
              const c = colorFor(integ.key);
              const disabled = connect.isPending && connect.variables?.key === integ.key;
              return (
                <Card key={integ.key} className="flex flex-col p-5">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl" style={{ background: `${c}18`, color: c }}>
                      <Icon className="size-5" />
                    </span>
                    <div className="flex items-center gap-2">
                      {integ.connected && (
                        <span className="chip !py-0.5 text-[10px] text-success border-success/30 bg-success/10">
                          <Check className="size-3" /> Connected
                        </span>
                      )}
                      <span className="chip !py-0.5 text-[10px]" style={{ color: catColor[integ.category] ?? "#94A3B8" }}>
                        {integ.category}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-ink">{integ.name}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-dim">{integ.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip !py-0.5 text-[10px]">{integ.isMock ? "Mock mode" : "Live"}</span>
                    {(integ.configSchema ?? []).map((f) => (
                      <span key={f.key} className="chip !py-0.5 text-[10px]">{f.label}{f.required ? " *" : ""}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    {integ.connected ? (
                      <Button size="sm" variant="ghost" loading={disconnect.isPending && disconnect.variables === integ.key}
                        onClick={() => { if (confirm(`Disconnect ${integ.name}?`)) disconnect.mutate(integ.key); }}>
                        <Unplug className="size-3.5" /> Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" loading={disabled} onClick={() => { setTarget(integ); setCreds({}); }}>
                        <Plug className="size-3.5" /> Connect
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
      </div>

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Connect ${target?.name ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button loading={connect.isPending} disabled={!target}
              onClick={() => target && connect.mutate({ key: target.key, credentials: creds })}>
              <Check className="size-4" /> Connect
            </Button>
          </>
        }>
        <div className="space-y-4">
          <p className="text-xs text-ink-dim">
            {target?.description} {target?.isMock ? "Mock mode simulates the provider locally, so no real account is needed." : ""}
          </p>
          {(target?.configSchema ?? []).length === 0 && <p className="text-xs text-ink-faint">No credentials required - connects instantly.</p>}
          {(target?.configSchema ?? []).map((f) => (
            <Input key={f.key} label={f.label}
              type={f.type === "password" ? "password" : "text"}
              placeholder={f.key}
              value={creds[f.key] ?? ""}
              onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
              required={f.required} />
          ))}
        </div>
      </Modal>
    </div>
  );
}