import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleX,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";
import useAuth from "@/store/auth";
import AuthShell from "@/components/AuthShell";
import { Alert, Button, Input } from "@/components/ui";

const formStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const field: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const demo = params.get("demo") === "1";

  useEffect(() => {
    if (!demo) return;
    const em = "sarmad@flowpilot.app";
    const pw = "Demo1234!";
    let stage = 0;
    let i = 0;
    const t = setInterval(() => {
      if (stage === 0) {
        setEmail(em.slice(0, ++i));
        if (i >= em.length) {
          stage = 1;
          i = 0;
        }
      } else {
        setPassword(pw.slice(0, ++i));
        if (i >= pw.length) clearInterval(t);
      }
    }, 45);
    return () => clearInterval(t);
  }, [demo]);

  const doLogin = async (em: string, pw: string) => {
    setError("");
    setStatus("loading");
    try {
      await login(em, pw);
      setStatus("success");
      setTimeout(() => nav("/dashboard"), 700);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const em = demo ? "sarmad@flowpilot.app" : email.trim();
    const pw = demo ? "Demo1234!" : password;
    if (!em) return setError("Enter your work email.");
    if (!emailValid(em)) return setError("Enter a valid email address.");
    if (!pw) return setError("Enter your password.");
    void doLogin(em, pw);
  };

  const toggleShow = () => setShow((s) => !s);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to run your automations."
      footer={
        <>
          New to FlowPilot?{" "}
          <Link to="/register" className="font-semibold text-primary-soft hover:underline">
            Create an account
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
              <ShieldCheck className="pointer-events-none absolute top-[38px] left-3 size-4 text-ink-faint" />
              <Input
                label="Password"
                type={show ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => setCaps(e.getModifierState("CapsLock"))}
                autoComplete="current-password"
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={toggleShow}
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
              {caps && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 overflow-hidden text-xs font-medium text-warn"
                >
                  Caps Lock is on
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={field} className="flex items-center justify-between text-xs">
            <Link
              to="/forgot-password"
              className="text-ink-faint transition-colors hover:text-primary-soft"
            >
              Forgot password?
            </Link>
          </motion.div>

          <motion.div variants={field}>
            <Button type="submit" loading={status === "loading"} className="w-full">
              {status === "success" ? (
                <>
                  <Check className="size-4 text-success" /> Signed in — redirecting…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div variants={field}>
            <button
              type="button"
              disabled={status !== "idle"}
              onClick={() => {
                const em = "sarmad@flowpilot.app";
                const pw = "Demo1234!";
                setEmail(em);
                setPassword(pw);
                setTimeout(() => void doLogin(em, pw), 350);
              }}
              className="btn btn-md w-full border-primary/30 text-primary-soft hover:bg-primary/10 disabled:opacity-60"
            >
              {status === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              Explore the interactive demo
            </button>
          </motion.div>
        </motion.div>
      </form>
    </AuthShell>
  );
}