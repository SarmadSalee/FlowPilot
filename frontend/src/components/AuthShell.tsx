import React from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { Workflow, ShieldCheck, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ui";

const brandList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const brandItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function AuthShell({
  title,
  subtitle,
  icon,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>
      {/* Brand side */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-line bg-surface-soft p-10 lg:flex">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
              <Workflow className="size-[18px]" />
            </div>
            <span className="font-display text-lg font-bold text-ink">
              Flow<span className="text-primary-soft">Pilot</span>
            </span>
          </Link>
        </motion.div>

        <motion.div variants={brandList} initial="hidden" animate="show">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink">
            Build, run and grow with
            <br />
            <span className="text-primary-soft">intelligent automations.</span>
          </h1>
          <ul className="mt-8 space-y-4">
            {[
              ["Describe, and AI builds it", "Turn a sentence into a complete workflow."],
              ["Agents that act", "Score, draft, route and follow up — automatically."],
              ["Runs itself, tracks itself", "Step-level visibility on every execution."],
            ].map(([t, d]) => (
              <motion.li key={t as string} variants={brandItem} className="flex gap-3">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-successbg">
                  <Check className="size-3 text-success" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t}</p>
                  <p className="text-xs text-ink-faint">{d}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-2 text-xs text-ink-faint"
        >
          <ShieldCheck className="size-3.5 text-success" /> SOC 2 ready · Privacy-first · No credit card required
        </motion.div>
      </div>

      {/* Form side */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 lg:hidden"
          >
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
                <Workflow className="size-4" />
              </div>
              <span className="font-display text-lg font-bold text-ink">
                Flow<span className="text-primary-soft">Pilot</span>
              </span>
            </Link>
          </motion.div>
          <motion.div variants={brandList} initial="hidden" animate="show">
            {icon && (
              <motion.div variants={brandItem} className="mb-4">
                {icon}
              </motion.div>
            )}
            <motion.h2 variants={brandItem} className="font-display text-2xl font-bold text-ink">
              {title}
            </motion.h2>
            <motion.p variants={brandItem} className="mt-1.5 text-sm text-ink-dim">
              {subtitle}
            </motion.p>
            <motion.div variants={brandItem} className="mt-8">
              {children}
            </motion.div>
            <motion.div variants={brandItem} className="mt-8 text-center text-sm text-ink-faint">
              {footer}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}