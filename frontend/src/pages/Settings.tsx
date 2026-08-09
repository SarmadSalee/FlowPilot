import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  User, Shield, Bell, KeyRound, Building2, Lock, Users, CreditCard, Copy, Check,
  Trash2, Plus, ArrowUpRight, Loader2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, Input, Tabs, Toggle, AvatarPreset, AVATAR_PRESETS } from "@/components/ui";
import CropAvatarModal from "@/components/CropAvatarModal";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import useAuth from "@/store/auth";

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  useCount?: number;
}

export default function Settings() {
  const { user, org, hydrate } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatarColor ?? "indigo");
  const [photo, setPhoto] = useState(user?.avatar ?? "");
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [companyName, setCompanyName] = useState(org?.name ?? "");
  const [companySite, setCompanySite] = useState("");
  const [industry, setIndustry] = useState("");

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    failures: true,
    digest: true,
    invites: true,
    product: false,
  });

  const { data: apiKeys } = useQuery<ApiKeyRecord[]>({
    queryKey: ["api-keys"],
    queryFn: () => api("/api/api-keys"),
    enabled: tab === "api",
  });

  const saveProfile = useMutation({
    mutationFn: () => api("/api/auth/me", { method: "PUT", body: { name } }),
    onSuccess: async () => {
      await hydrate();
      toast.success("Profile updated");
    },
  });

  const updateAvatar = useMutation({
    mutationFn: (avatarColor: string) => api("/api/auth/me", { method: "PUT", body: { avatarColor, avatar: "" } }),
    onSuccess: async () => {
      await hydrate();
      toast.success("Avatar updated");
    },
    onError: () => toast.error("Could not update avatar"),
  });

  const savePhoto = useMutation({
    mutationFn: (avatar: string) => api("/api/auth/me", { method: "PUT", body: { avatar } }),
    onSuccess: async () => {
      await hydrate();
      toast.success("Profile photo updated");
    },
    onError: () => toast.error("Could not upload photo"),
  });

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(String(reader.result));
      setCropOpen(true);
    };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  };

  const finishCrop = (dataUrl: string) => {
    setCropOpen(false);
    setPhoto(dataUrl);
    savePhoto.mutate(dataUrl);
  };

  const saveCompany = useMutation({
    mutationFn: () =>
      Promise.all([
        api("/api/auth/me", { method: "PUT", body: { name, company: companyName } }),
        api("/api/auth/organization", {
          method: "PUT",
          body: { name: companyName, website: companySite, industry },
        }),
      ]),
    onSuccess: async () => {
      await hydrate();
      qc.invalidateQueries({ queryKey: ["credits"] });
      toast.success("Workspace updated");
    },
  });

  const changePassword = useMutation({
    mutationFn: () => api("/api/auth/me/password", { method: "POST", body: { currentPassword: curPw, newPassword: newPw } }),
    onSuccess: () => {
      toast.success("Password changed");
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not change password");
    },
  });

  const createKey = useMutation({
    mutationFn: (keyName: string) => api<{ id: string; name: string; key: string }>("/api/api-keys", { method: "POST", body: { name: keyName } }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setJustCreated(created);
    },
  });

  const revokeKey = useMutation({
    mutationFn: (id: string) => api(`/api/api-keys/${id}/revoke`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
  });

  const [keyName, setKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<{ key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    if (!justCreated) return;
    try {
      await navigator.clipboard.writeText(justCreated.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const submitPassword = () => {
    if (newPw.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPw !== confirmPw) return toast.error("New passwords do not match");
    changePassword.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-dim">Manage your account, workspace and access keys.</p>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profile", label: "Profile", icon: User },
          { value: "company", label: "Company", icon: Building2 },
          { value: "security", label: "Security", icon: Lock },
          { value: "notifications", label: "Notifications", icon: Bell },
          { value: "api", label: "API keys", icon: KeyRound },
        ]}
      />

      {tab === "profile" && (
        <Card className="max-w-xl p-6">
          <p className="text-sm font-semibold text-ink">Profile</p>
          <p className="mt-0.5 text-xs text-ink-faint">This is how your name appears across FlowPilot.</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-4">
                {photo ? (
                  <img src={photo} alt="Profile" className="size-12 shrink-0 rounded-full object-cover ring-1 ring-line-strong" />
                ) : (
                  <AvatarPreset color={avatar} size="lg" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">Profile image</p>
                  <p className="mt-0.5 text-xs text-ink-faint">Upload a photo, or pick a preset look below.</p>
                </div>
                <div className="flex items-center gap-2">
                  {photo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savePhoto.isPending}
                      onClick={() => {
                        setPhoto("");
                        savePhoto.mutate("");
                      }}
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </Button>
                  )}
                  <Button size="sm" variant="soft" disabled={savePhoto.isPending} onClick={() => fileRef.current?.click()}>
                    {savePhoto.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    {savePhoto.isPending ? "Saving…" : "Upload photo"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-8">
                {AVATAR_PRESETS.map((p) => {
                  const selected = avatar === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      title={p.label}
                      disabled={updateAvatar.isPending}
                      onClick={() => {
                        setAvatar(p.key);
                        setPhoto("");
                        updateAvatar.mutate(p.key);
                      }}
                      className={cn(
                        "relative rounded-full p-0.5 transition-all",
                        selected && !photo ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "opacity-75 hover:opacity-100",
                      )}
                    >
                      <AvatarPreset color={p.key} size="lg" />
                      {selected && !photo && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-white ring-2 ring-surface">
                          <Check className="size-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Email</p>
                <p className="text-xs text-ink-faint">{user?.email}</p>
              </div>
              <Badge status="active">Verified</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Workspace</p>
                <p className="text-xs text-ink-faint">{org?.name} · {org?.plan}</p>
              </div>
              <Link to="/billing" className="btn btn-ghost btn-sm">Manage plan</Link>
            </div>
            <Button loading={saveProfile.isPending} disabled={!name.trim()} onClick={() => saveProfile.mutate()}>
              Save changes
            </Button>
          </div>
        </Card>
      )}

      {tab === "company" && (
        <Card className="max-w-xl p-6">
          <p className="text-sm font-semibold text-ink">Company</p>
          <p className="mt-0.5 text-xs text-ink-faint">Used on invoices, branding and team invitations.</p>
          <div className="mt-4 space-y-4">
            <Input label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Input label="Website" placeholder="https://acme.com" value={companySite} onChange={(e) => setCompanySite(e.target.value)} />
            <Input label="Industry" placeholder="e.g. SaaS, Agency, E-commerce" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            <Button loading={saveCompany.isPending} disabled={!companyName.trim()} onClick={() => saveCompany.mutate()}>
              Save workspace
            </Button>
          </div>
          <div className="mt-6 grid gap-2 border-t border-line pt-5">
            <Link to="/team" className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-primary/40">
              <span className="flex items-center gap-2"><Users className="size-4 text-ink-faint" /> Manage team & roles</span>
              <ArrowUpRight className="size-4 text-ink-faint" />
            </Link>
            <Link to="/integrations" className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-primary/40">
              <span className="flex items-center gap-2"><Shield className="size-4 text-ink-faint" /> Connected integrations</span>
              <ArrowUpRight className="size-4 text-ink-faint" />
            </Link>
            <Link to="/billing" className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-primary/40">
              <span className="flex items-center gap-2"><CreditCard className="size-4 text-ink-faint" /> Billing & subscription</span>
              <ArrowUpRight className="size-4 text-ink-faint" />
            </Link>
          </div>
        </Card>
      )}

      {tab === "security" && (
        <Card className="max-w-xl p-6">
          <p className="text-sm font-semibold text-ink">Security</p>
          <p className="mt-0.5 text-xs text-ink-faint">Change your password. Current password is required.</p>
          <div className="mt-4 space-y-4">
            <Input label="Current password" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" />
            <Input label="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" hint="At least 8 characters" />
            <Input label="Confirm new password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
            <Button loading={changePassword.isPending} disabled={!curPw || !newPw || !confirmPw} onClick={submitPassword}>
              Update password
            </Button>
          </div>
        </Card>
      )}

      {tab === "notifications" && (
        <Card className="max-w-xl p-6">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          <p className="mt-0.5 text-xs text-ink-faint">Choose what FlowPilot can send you.</p>
          <div className="mt-4 space-y-3">
            {[
              { key: "failures", title: "Workflow failures", desc: "Get alerted the moment an execution fails." },
              { key: "digest", title: "Weekly digest", desc: "A Monday summary of runs, AI usage and saved time." },
              { key: "invites", title: "New invites", desc: "When a teammate invites someone to join." },
              { key: "product", title: "Product updates", desc: "New features, integrations and templates." },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{n.title}</p>
                  <p className="text-xs text-ink-faint">{n.desc}</p>
                </div>
                <Toggle checked={prefs[n.key]} onChange={(v) => setPrefs((p) => ({ ...p, [n.key]: v }))} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-ink-faint">In-app notifications are shown in your account bell. Preferences are stored on this device.</p>
        </Card>
      )}

      {tab === "api" && (
        <div className="max-w-xl space-y-4">
          <Card className="p-6">
            <p className="text-sm font-semibold text-ink">Create an API key</p>
            <p className="mt-0.5 text-xs text-ink-faint">Use keys to trigger workflows and call the FlowPilot API programmatically.</p>
            <div className="mt-4 flex gap-2">
              <Input placeholder="e.g. Production, CI, staging" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
              <Button
                disabled={!keyName.trim() || createKey.isPending}
                onClick={() => createKey.mutate(keyName.trim())}
              >
                <Plus className="size-4" /> Create
              </Button>
            </div>
            {justCreated && (
              <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-4">
                <p className="text-xs font-semibold text-success">Key created — copy it now. It won't be shown again.</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-line bg-surface-soft px-3 py-2 font-mono text-xs text-ink">{justCreated.key}</code>
                  <Button size="sm" variant="soft" onClick={copyKey}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-ink">Your keys</p>
            <div className="mt-3 space-y-2">
              {apiKeys && apiKeys.length > 0 ? (
                apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{k.name}</p>
                      <p className="font-mono text-[11px] text-ink-faint">{k.prefix}… · created {new Date(k.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {k.lastUsedAt && <span className="hidden text-[11px] text-ink-faint sm:block">last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                      <button
                        onClick={() => revokeKey.mutate(k.id)}
                        title="Revoke key"
                        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger/15 hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-ink-faint">No API keys yet. Create one above.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      <CropAvatarModal
        open={cropOpen}
        src={cropSrc}
        onCancel={() => setCropOpen(false)}
        onSave={finishCrop}
      />
    </div>
  );
}