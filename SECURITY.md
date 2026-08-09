# Security Policy

We take the security of FlowPilot seriously. Although this is a demonstration /
portfolio project, we treat vulnerabilities with the same care as a production
system.

## Supported versions

| Version | Supported          |
|---------|--------------------|
| latest  | :white_check_mark: |

Only the current `main` branch and the latest release are supported. Older
versions do not receive security patches.

## Reporting a vulnerability

**Do not open a public issue for security problems.** Please report privately:

- Open a **private security advisory** on the GitHub repository
  (Security → "Report a vulnerability").
- If you cannot use advisories, reach out to the repository maintainers
  privately.

Please include:

1. The affected endpoint, component, or file.
2. Steps to reproduce (or a proof of concept).
3. Impact and, if known, a suggested fix.
4. Your contact info, if you'd like attribution.

You can expect an acknowledgement within **5 business days** and a plan for
fixing and disclosing the issue shortly after.

## What we care about

- **Auth & session handling** — JWT, password hashing, session invalidation.
- **Data isolation** — every query must be scoped to the caller's organization.
- **Input validation** — all public inputs are validated with Zod; never trust
  the client.
- **Secrets** — `.env` files, API keys, tokens, and user data must never be
  committed or exposed.
- **Supply chain** — dependencies are kept patched; review new dependencies for
  provenance and maintenance.

## Demo-mode note

With `DEMO_MODE=true` (default), AI, integrations, and billing are **simulated**
— no real external credentials or payments are involved, and the in-memory demo
database holds only fictional seed data. Still, code quality and safety
standards apply to everything.

## Responsible disclosure

We ask that you allow us a reasonable window (e.g. **90 days**) before publicly
disclosing a vulnerability so a fix can be prepared. We're happy to credit
researchers who report responsibly.