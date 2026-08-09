import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, Info } from "lucide-react";
import { api } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Input } from "@/components/ui";

interface ForgotResponse {
  resetToken: string;
  resetLink: string;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<ForgotResponse>("/api/auth/forgot-password", { body: { email } });
      setResetLink(res.resetLink ?? "");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to reset your password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary-soft hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
            <MailCheck className="size-7 text-success" />
          </div>
          <h3 className="font-display text-base font-semibold text-ink">Check your inbox</h3>
          <p className="mt-2 text-sm text-ink-dim">
            If an account exists for <span className="font-semibold text-ink">{email}</span>, a reset
            link is on its way.
          </p>
          {resetLink && (
            <div className="mt-4 rounded-xl border border-accent/25 bg-accent/10 p-4 text-left">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Info className="size-3.5" /> Demo mode: no email server configured
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">
                Use this temporary link to complete the reset:
              </p>
              <a
                href={resetLink}
                className="mt-2 block truncate rounded-lg border border-line bg-surface-soft px-3 py-2 font-mono text-[11px] text-ink transition-colors hover:border-primary/40"
              >
                {resetLink}
              </a>
            </div>
          )}
          <Link to="/login" className="btn btn-ghost btn-md mt-6 w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert kind="danger" title={error} />}
          <Input
            label="Work email"
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}