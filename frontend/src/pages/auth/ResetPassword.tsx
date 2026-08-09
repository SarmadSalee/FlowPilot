import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Input } from "@/components/ui";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) return setError("This reset link is invalid or has expired. Request a new one.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await api("/api/auth/reset-password", { body: { token, password } });
      nav("/login", { state: { reset: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your FlowPilot account."
      icon={<span className="flex size-11 items-center justify-center rounded-xl bg-primary-faint text-primary-soft"><KeyRound className="size-5" /></span>}
      footer={
        <>
          Know your password?{" "}
          <Link to="/login" className="font-semibold text-primary-soft hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {!token && <Alert kind="danger" title="Missing reset token" />}
        {error && <Alert kind="danger" title={error} />}
        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}