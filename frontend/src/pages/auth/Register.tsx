import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight, Check, CircleX, Eye, EyeOff, Mail, ShieldCheck, SquarePen, User } from "lucide-react";
import useAuth from "@/store/auth";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Input } from "@/components/ui";

const formStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const field: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = ["#64748B", "#F87171", "#FBBF24", "#34D399", "#34D399"];

function passwordScore(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return s;
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const score = passwordScore(password);
  const requirements = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "A number", ok: /\d/.test(password) },
    { label: "A letter", ok: /[A-Za-z]/.test(password) },
  ];
  const minsMet = requirements.every((r) => r.ok);
  const mismatch = confirm.length > 0 && confirm !== password;
  const matches = confirm.length > 0 && confirm === password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter your full name.");
    if (!emailValid(email)) return setError("Enter a valid work email.");
    if (!minsMet) return setError("Password needs 8+ characters with a letter and a number.");
    if (confirm !== password) return setError("Passwords don't match.");
    setStatus("loading");
    try {
      await register({ name: name.trim(), email: email.trim(), password, orgName: orgName.trim() || `${name.trim()}'s Workspace` });
      setStatus("success");
      setTimeout(() => nav("/onboarding"), 700);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start automating free — no credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary-soft hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, x: [0, -7, 7, -4, 4, 0] }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              <Alert kind="danger" title={error} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={formStagger} initial="hidden" animate="show">
          <motion.div variants={field}>
            <div className="relative">
              <User className="pointer-events-none absolute top-[38px] left-3 size-4 text-ink-faint" />
              <Input
                label="Full name"
                required
                placeholder="Sarmad Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="pl-9"
              />
            </div>
          </motion.div>

          <motion.div variants={field}>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-[38px] left-3 size-4 text-ink-faint" />
              <Input
                label="Work email"
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="pl-9 pr-9"
              />
              <AnimatePresence>
                {email.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="absolute right-3 top-[38px]"
                  >
                    {emailValid(email) ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <CircleX className="size-4 text-danger" />
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={field}>
            <div className="relative">
              <SquarePen className="pointer-events-none absolute top-[38px] left-3 size-4 text-ink-faint" />
              <Input
                label="Workspace name"
                required
                placeholder="Acme Inc"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="pl-9"
              />
            </div>
          </motion.div>

          <motion.div variants={field}>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute top-[38px] left-3 size-4 text-ink-faint" />
              <Input
                label="Password"
                type={show ? "text" : "password"}
                required
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-[38px] text-ink-faint hover:text-ink"
              >
                <motion.span
                  key={show ? "on" : "off"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </motion.span>
              </button>
            </div>

            <AnimatePresence>
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleX: 0 }}
                          animate={{
                            scaleX: i < score ? 1 : 0,
                            backgroundColor: i < score ? STRENGTH_COLORS[score] : undefined,
                          }}
                          transition={{ duration: 0.35, delay: i * 0.05 }}
                          className="h-1 flex-1 origin-left rounded-full bg-surface-soft"
                        />
                      ))}
                    </div>
                    <motion.span
                      key={score}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[11px] font-semibold whitespace-nowrap"
                      style={{ color: STRENGTH_COLORS[score] }}
                    >
                      {STRENGTH_LABELS[score]}
                    </motion.span>
                  </div>
                  <ul className="mt-2.5 grid grid-cols-3 gap-2">
                    {requirements.map((r) => (
                      <li
                        key={r.label}
                        className="flex items-center gap-1.5 text-[11px] font-medium"
                        style={{ color: r.ok ? "#34D399" : "#64748B" }}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.35, 1] }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center"
                        >
                          {r.ok ? (
                            <Check className="size-3" />
                          ) : (
                            <CircleX className="size-3" />
                          )}
                        </motion.span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={field}>
            <div className="relative">
              <Input
                label="Confirm password"
                type={show ? "text" : "password"}
                required
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={mismatch ? "pr-9 border-danger/60" : "pr-9"}
              />
              <AnimatePresence>
                {(matches || mismatch) && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="absolute right-3 top-[38px]"
                  >
                    {matches ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <CircleX className="size-4 text-danger" />
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {mismatch && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 overflow-hidden text-xs text-danger"
                >
                  Passwords don't match.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={field}>
            <Button type="submit" loading={status === "loading"} className="w-full">
              {status === "success" ? (
                <>
                  <Check className="size-4 text-success" /> Workspace created — setting up…
                </>
              ) : (
                <>
                  Create workspace <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div variants={field}>
            <p className="text-center text-xs text-ink-faint">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      </form>
    </AuthShell>
  );
}