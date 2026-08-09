import { Link, useParams } from "react-router-dom";
import { Workflow, ShieldCheck, ArrowLeft, FileText, ScrollText, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS = [
  { slug: "privacy", label: "Privacy policy", icon: Globe },
  { slug: "terms", label: "Terms of service", icon: FileText },
  { slug: "security", label: "Security", icon: Lock },
  { slug: "gdpr", label: "GDPR", icon: ScrollText },
];

interface Section {
  heading: string;
  body: string[];
}

const CONTENT: Record<string, { title: string; updated: string; intro: string; sections: Section[] }> = {
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: January 2026",
    intro: "This policy explains what information FlowPilot collects, how it is used, and the choices you have. It applies to the FlowPilot application and its supporting services.",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "Account information: name, email address, company name and password (stored as an encrypted hash) when you register.",
          "Workspace data: workflows, executions, node configurations, analytics and activity logs that you create while using the product.",
          "Usage data: pages visited, features used, execution counts and performance metrics used to improve the product.",
          "API connections: if you connect third-party tools, we only access the scopes required to run your workflows.",
        ],
      },
      {
        heading: "How we use your information",
        body: [
          "To provide, operate and maintain FlowPilot, including executing your workflows and generating analytics.",
          "To communicate service updates, security notices and billing information.",
          "To train and improve our automation engine and AI-assisted features in aggregate, never using your data to train public models without consent.",
        ],
      },
      {
        heading: "AI and third-party providers",
        body: [
          "AI-powered steps are executed using providers you configure (OpenAI, Anthropic or DeepSeek) or a built-in simulated provider in demo mode.",
          "When you provide your own API keys, requests are sent directly to that provider and are subject to its privacy policy.",
          "Prompt content and execution data sent to providers is limited to what is required for a given step.",
        ],
      },
      {
        heading: "Data retention & deletion",
        body: [
          "We retain execution history as long as it is useful for your analytics and monitoring needs. You can delete workflows, executions and your account at any time.",
          "Deleting your account removes your personal information and workspace data, except where we are required to retain records for legal or billing purposes.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "Last updated: January 2026",
    intro: "These terms govern your use of FlowPilot. By creating an account, you agree to them. If you are using FlowPilot on behalf of an organization, you agree on its behalf.",
    sections: [
      {
        heading: "Your account",
        body: [
          "You are responsible for safeguarding your credentials and for activity that happens under your account.",
          "You must provide accurate registration information and keep it up to date.",
          "Accounts may be suspended if used in violation of these terms or applicable law.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "You may not use FlowPilot to build workflows that violate the law, infringe intellectual property, distribute malware, or send unsolicited bulk communications.",
          "You are responsible for the workflows you create, including their triggers, actions and any content they generate.",
        ],
      },
      {
        heading: "Billing & subscription",
        body: [
          "Plans are billed in advance on a monthly or annual basis. Usage limits are defined on the pricing page and in your plan.",
          "You may cancel at any time; access continues until the end of your current billing period.",
        ],
      },
      {
        heading: "Service level",
        body: [
          "We work to keep FlowPilot reliable and available, but the service is provided on an 'as is' basis and we do not guarantee uninterrupted availability.",
          "Demo mode is provided for evaluation purposes and may reset your seed data.",
        ],
      },
    ],
  },
  security: {
    title: "Security",
    updated: "Last updated: January 2026",
    intro: "FlowPilot is built with security as a baseline. This page summarizes the controls we apply to protect your data in transit and at rest.",
    sections: [
      {
        heading: "Encryption",
        body: [
          "All traffic is encrypted in transit using TLS 1.2 or later.",
          "Passwords and API keys are stored as strong hashes (bcrypt for passwords, SHA-256 for API key material) and are never stored in plain text.",
        ],
      },
      {
        heading: "Access control",
        body: [
          "Every organization is isolated by scope on the server; requests are authorized per organization through signed JWT sessions.",
          "Team roles (owner, admin, member, viewer) gate who can create, edit, run and delete workflows.",
        ],
      },
      {
        heading: "API keys",
        body: [
          "Programmatic access is authenticated with keys whose material is hashed before storage. Keys can be created and revoked from Settings at any time.",
          "Your AI provider keys are only ever used server-side and are never exposed to the browser.",
        ],
      },
      {
        heading: "Incidents",
        body: [
          "Security issues are treated as priority. If you find a vulnerability, contact security@flowpilot.app and we will respond promptly.",
        ],
      },
    ],
  },
  gdpr: {
    title: "GDPR",
    updated: "Last updated: January 2026",
    intro: "FlowPilot is committed to the principles of the EU General Data Protection Regulation. This page explains the rights available to you and how we support them.",
    sections: [
      {
        heading: "Your rights",
        body: [
          "Access: request a copy of the personal data we hold about you.",
          "Rectification: correct inaccurate or incomplete personal data.",
          "Erasure: request deletion of your personal data where applicable.",
          "Data portability: export your workflows and settings in a commonly used format.",
        ],
      },
      {
        heading: "Lawful basis",
        body: [
          "We process personal data to perform our contract with you (providing the service), to satisfy legal obligations, and on the basis of legitimate interests such as security and service improvement.",
        ],
      },
      {
        heading: "Sub-processors",
        body: [
          "We use reputable infrastructure and AI providers as sub-processors. When you supply third-party API keys, your data may be processed by the provider you selected under its own data-processing terms.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "For any privacy or GDPR request, contact hello@flowpilot.app. We respond to all legitimate requests within one month.",
        ],
      },
    ],
  },
};

export default function Legal() {
  const { slug = "privacy" } = useParams<{ slug: string }>();
  const doc = CONTENT[slug] ?? CONTENT.privacy;

  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary-soft">
              <Workflow className="size-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-ink">
              Flow<span className="text-gradient">Pilot</span>
            </span>
          </Link>
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft className="size-3.5" /> Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        <div className="mb-10 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-faint text-primary-soft">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-display text-base font-bold text-ink">FlowPilot Legal & Trust center</p>
            <p className="text-xs text-ink-faint">Documentation for how FlowPilot works and protects your data.</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {DOCS.map((d) => {
            const Icon = d.icon;
            const active = d.slug === slug;
            return (
              <Link
                key={d.slug}
                to={`/legal/${d.slug}`}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                  active ? "border-primary/40 bg-primary-faint text-primary-soft" : "border-line bg-surface text-ink-dim hover:border-line-strong hover:text-ink",
                )}
              >
                <Icon className="size-4" /> {d.label}
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 md:p-12">
          <h1 className="font-display text-3xl font-bold text-ink">{doc.title}</h1>
          <p className="mt-2 text-xs text-ink-faint">{doc.updated}</p>
          <p className="mt-6 text-[15px] leading-relaxed text-ink-dim">{doc.intro}</p>
          <div className="mt-10 space-y-8">
            {doc.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-display text-lg font-semibold text-ink">{s.heading}</h2>
                {s.body.map((b) => (
                  <p key={b.slice(0, 24)} className="mt-3 text-sm leading-relaxed text-ink-dim">{b}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}