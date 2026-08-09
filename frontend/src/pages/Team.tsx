import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Mail, Crown, UserMinus, ShieldCheck, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import useAuth from "@/store/auth";
import { Avatar, Button, Card, Input, Modal, Select } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

interface Member {
  userId: string;
  name: string;
  email: string;
  avatarColor: string;
  avatar?: string;
  role: string;
  invitedAt?: string;
  joinedAt?: string;
  lastLoginAt?: string;
}

interface Invite {
  email: string;
  role: string;
  status: string;
  expiresAt?: string;
  token: string;
}

interface TeamData {
  members: Member[];
  invites: Invite[];
}

const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" };
const ROLE_COLOR: Record<string, string> = { owner: "text-violeta", admin: "text-primary-soft", member: "text-accent", viewer: "text-warn" };
const ROLE_OPTIONS = ["admin", "member", "viewer"];

export default function Team() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const { data, isLoading } = useQuery<TeamData>({ queryKey: ["team"], queryFn: () => api("/api/team") });
  const members = data?.members ?? [];
  const invites = data?.invites ?? [];

  const invite = useMutation({
    mutationFn: () => api("/api/team/invite", { method: "POST", body: { email, role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      setOpen(false);
      setEmail("");
      toast.success("Invitation sent");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not invite"),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api(`/api/team/members/${userId}/role`, { method: "PATCH", body: { role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change role"),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => api(`/api/team/members/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Member removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove member"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Team</h1>
          <p className="mt-1 text-sm text-ink-dim">Manage who has access to your workspace.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Invite member</Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-soft" />)}</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="mb-4 size-8 text-ink-faint" />
            <p className="text-sm font-semibold text-ink">No members yet</p>
            <p className="mt-1 text-xs text-ink-faint">Invite teammates to collaborate on workflows.</p>
            <Button className="mt-5" onClick={() => setOpen(true)}><Plus className="size-4" /> Invite member</Button>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {members.map((m) => {
              const isSelf = m.userId === user?._id;
              return (
                <div key={m.userId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name ?? "?"} avatarColor={m.avatarColor} avatar={m.avatar} />
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {m.name}
                        {isSelf && <span className="chip !py-0 !text-[10px]">you</span>}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                        <Mail className="size-3" /> {m.email}
                        {m.lastLoginAt ? <span className="ml-1 text-[10px]">last seen {timeAgo(m.lastLoginAt)}</span> : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${ROLE_COLOR[m.role] ?? "text-ink-dim"}`}>
                      {m.role === "owner" ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />} {ROLE_LABEL[m.role] ?? m.role}
                    </span>
                    {m.role === "owner" ? (
                      <span className="text-[11px] text-ink-faint">workspace owner</span>
                    ) : (
                      <>
                        <Select value={m.role} onChange={(e) => updateRole.mutate({ userId: m.userId, role: e.target.value })}
                          className="w-28 !py-1.5 text-xs" disabled={updateRole.isPending}>
                          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </Select>
                        <button onClick={() => { if (confirm(`Remove ${m.name}?`)) remove.mutate(m.userId); }}
                          className="rounded-lg p-1.5 text-ink-faint hover:bg-danger/15 hover:text-danger">
                          <UserMinus className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {invites.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Clock3 className="size-4 text-ink-faint" /> Pending invites ({invites.length})</h2>
          <Card className="overflow-hidden">
            <div className="divide-y divide-line">
              {invites.map((inv) => (
                <div key={inv.token} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-ink-faint" />
                    <div>
                      <p className="text-sm font-medium text-ink">{inv.email}</p>
                      <p className="text-[11px] text-ink-faint">{ROLE_LABEL[inv.role] ?? inv.role} role{inv.expiresAt ? ` - expires ${timeAgo(inv.expiresAt)}` : ""}</p>
                    </div>
                  </div>
                  <span className="chip !py-0.5 text-[10px] text-warn">{inv.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Invite a teammate"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => invite.mutate()} disabled={!email.includes("@")} loading={invite.isPending}>
              Send invite
            </Button>
          </>
        }>
        <div className="space-y-4">
          <Input label="Email address" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin - full control</option>
            <option value="member">Member - build and edit</option>
            <option value="viewer">Viewer - read only</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}