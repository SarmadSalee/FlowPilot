import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, Search, Sparkles, Play, Check, Star, Cpu, GitBranch, Zap as ZapIcon, TrendingUp, Calendar as CalIcon, ArrowUp, Clipboard, MessageSquare, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, EmptyState, Input, Modal } from "@/components/ui";
import { cn, nodeColor } from "@/lib/utils";
import type { Template } from "@/lib/types";

const CATS = ["All", "Sales", "Marketing", "Support", "Operations", "AI"];

const iconFor = (t?: string) => {
  switch (t) {
    case "TradeUp":
      return <TrendingUp className="size-5 text-primary-soft" />;
    case "Calendar":
      return <CalIcon className="size-5 text-accent" />;
    case "ArrowUp":
      return <ArrowUp className="size-5 text-success" />;
    case "Sparkle":
      return <Sparkles className="size-5 text-warn" />;
    case "Clipboard":
      return <Clipboard className="size-5 text-violeta" />;
    case "Message":
      return <MessageSquare className="size-5 text-primary-soft" />;
    case "Graduation":
      return <GraduationCap className="size-5 text-coral" />;
    default:
      return <LayoutTemplate className="size-5 text-ink-dim" />;
  }
};

const stepIcon = (type: string) => (type === "ai" ? Cpu : type === "condition" ? GitBranch : type === "trigger" ? Play : ZapIcon);

export default function Templates() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);
  const [open, setOpen] = useState(false);

  const { data: templates } = useQuery<Template[]>({ queryKey: ["templates"], queryFn: () => api("/api/templates") });

  const list = useMemo(() => {
    let l = templates ?? [];
    if (cat !== "All") l = l.filter((t) => t.category === cat);
    if (q.trim()) l = l.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [templates, cat, q]);

  const previewWF = useMutation({
    mutationFn: (slug: string) => api<Template>(`/api/templates/${slug}`),
    onSuccess: (data) => {
      setPreview(data);
      setOpen(true);
    },
  });

  const useTemplate = useMutation({
    mutationFn: (slug: string) => api<{ workflow: { _id: string } }>(`/api/templates/${slug}/use`, { method: "POST" }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Template added to your workflows");
      if (data.workflow?._id) nav(`/workflows/${data.workflow._id}`);
    },
    onError: () => toast.error("Could not install template"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Templates</h1>
        <p className="mt-1 text-sm text-ink-dim">Ready-to-run flows for every team. Preview, install, and tune as you like.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search templates..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                cat === c ? "bg-primary-faint text-primary-soft border border-primary/30" : "border border-line text-ink-faint hover:text-ink")}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Card><EmptyState icon={LayoutTemplate} title="No templates found" message="Try a different search or category." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <Card key={t._id} className="group flex flex-col p-5 transition-all hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-faint text-primary-soft">
                    {iconFor(t.icon)}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">{t.name}</h3>
                    <span className="text-[11px] text-ink-faint">{t.category}</span>
                  </div>
                </div>
                {t.featured && (
                  <span className="chip !py-0.5 !text-[10px] border-primary/40 bg-primary-faint text-primary-soft">
                    <Star className="size-3 fill-warn text-warn" /> Popular
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(t.tags?.length ? t.tags : t.steps ?? []).slice(0, 4).map((s) => (
                  <span key={s} className="chip !py-0.5 text-[10px]">{s}</span>
                ))}
              </div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-dim">{t.description}</p>
              <p className="mt-2 text-[11px] text-ink-faint">{t.nodes?.length ?? 0} nodes</p>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => previewWF.mutate(t.slug)}
                  loading={previewWF.isPending && previewWF.variables === t.slug}>
                  <Play className="size-3.5 text-accent" /> Preview
                </Button>
                <Button size="sm" onClick={() => useTemplate.mutate(t.slug)}
                  loading={useTemplate.isPending && useTemplate.variables === t.slug}>
                  <Sparkles className="size-3.5" /> Use template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Template preview - ${preview?.name ?? ""}`} size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            {preview && <Button onClick={() => { setOpen(false); useTemplate.mutate(preview.slug); }}>
              <Check className="size-4" /> Use this template
            </Button>}
          </>
        }>
        {preview ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-dim">{preview.description}</p>
            {preview.steps?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {preview.steps.map((s) => <span key={s} className="chip">Step: {s}</span>)}
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface-soft p-5">
              <div className="flex min-w-max items-center gap-2">
                {preview.nodes.map((n, i) => {
                  const Icon = stepIcon(n.type ?? "action");
                  const color = nodeColor(n.type ?? "action");
                  return (
                    <div key={n.id} className="flex min-w-28 flex-col items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3">
                      <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${color}1a`, color }}>
                        <Icon className="size-4" />
                      </span>
                      <span className="text-center text-[11px] font-semibold text-ink">{n.label}</span>
                      <span className="text-[9px] uppercase tracking-wider text-ink-faint">{n.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-sm text-ink-faint"><Sparkles className="mr-2 size-4 animate-pulse text-primary-soft" /> Loading preview...</div>
        )}
      </Modal>
    </div>
  );
}