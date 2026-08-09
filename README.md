<div align="center">

# FlowPilot

**AI-powered business automation that works for you.**

</div>

FlowPilot is a full-stack, production-ready SaaS application for building, running, monitoring and analyzing AI-automated workflows. It ships with a visual workflow builder, an AI workflow generator, AI agents, integrations, executions, analytics, templates, team management, and billing — all behind a coherent, token-based design system with light and dark themes.

> **Demo mode is on by default.** No API keys or external services needed — AI, integrations and billing are simulated so the entire product runs end to end offline.

---

## Screenshots

<div align="center">

<img src="assets/Screenshot%202026-08-10%20002211.png" alt="FlowPilot landing page" width="88%" />
<br />
<sub>Landing page</sub>

<br /><br />

<img src="assets/Screenshot%202026-08-10%20000445.png" alt="FlowPilot visual workflow builder" width="47%" />&nbsp;&nbsp;<img src="assets/Screenshot%202026-08-10%20002311.png" alt="FlowPilot AI Creator" width="47%" />
<br />
<sub>Visual workflow builder &nbsp;·&nbsp; AI Creator</sub>

</div>

---

## Features

### Build
- **Visual workflow builder** — drag-and-drop React Flow canvas with triggers, AI steps, conditions, actions and utilities; node inspector, duplicate, enable/disable, connect and run history.
- **AI Creator** — describe a workflow in plain English; FlowPilot generates a node graph you can approve, edit, regenerate or save.
- **Templates** — prebuilt workflows (lead qualification, email follow-up, support assistant, invoice processing, meeting summary) with preview and one-click install.

### Run & monitor
- **AI agents** — create specialized agents (sales, support, lead qualification…) with instructions, model, temperature, tools, memory and execution limits.
- **Executions** — per-step timelines with success / failed / running / waiting statuses, durations, and input/output payloads.
- **Dashboard** — stats, recent executions, performance charts, AI usage, credits and quick actions.
- **Analytics** — success rate, failed runs, AI tasks, API usage, time saved and cost estimates with charts.

### Connect & manage
- **Integrations marketplace** — Gmail, Slack, Google Sheets, HubSpot, Salesforce, Stripe, WhatsApp, Webhooks, OpenAI, Anthropic, DeepSeek.
- **Team management** — owner / admin / member / viewer roles, invites, role changes and an activity log.
- **Billing** — Free / Pro / Business plans with mock Stripe checkout.
- **Settings** — profile (name, email), profile photo upload with **crop** plus a gallery of preset avatars, company details, password change, notifications, and real API-key creation / revocation.
- **Onboarding** — goal → tools → natural-language description → AI-generated workflow review → save.

### Experience
- **Light & dark theme** — full design-system theming with a persisted toggle across the app and marketing site.
- Responsive: sidebar → mobile drawer, adaptive grids, responsive canvas.
- Cohesive token-based styling (colors, status tints, cards, buttons, forms).

---

## Tech stack

| Layer     | Tech                                                                 |
|-----------|----------------------------------------------------------------------|
| Frontend  | React 18 · TypeScript · Vite · Tailwind CSS · React Flow · TanStack Query · React Router · Zustand · Recharts · Framer Motion · Lucide · react-easy-crop · sonner |
| Backend   | Node.js · Express · TypeScript · Zod                                  |
| Database  | MongoDB · Mongoose (auto-fallback to in-memory Mongo in demo mode)    |
| Auth      | JWT · bcryptjs                                                        |
| AI        | Provider abstraction: OpenAI · Anthropic · DeepSeek · Mock            |

---

## Getting started

Requirements: **Node.js ≥ 20**, **npm ≥ 9**. MongoDB is optional in demo mode.

```bash
# 1. Install workspace dependencies
npm install

# 2. Configure environment
cp backend/.env.example backend/.env   # then edit if needed

# 3. Seed demo data (optional — the API also auto-seeds on first boot in demo mode)
npm run seed
```

### Run locally

```bash
npm run dev             # backend on :5000 + frontend on :5173
# individually:
npm run dev:backend     # tsx watch
npm run dev:frontend    # Vite dev server
```

Open http://localhost:5173 for the app and http://localhost:5000/api/health for the API.

### Demo credentials

| Field    | Value                   |
|----------|-------------------------|
| Email    | `sarmad@flowpilot.app`  |
| Password | `Demo1234!`             |

The seeded workspace (`FlowPilot Labs`, Pro plan) includes 5 workflows, ~1,180 executions across the last 30 days, 5 AI agents, 5 templates, connected integrations, notifications and activity logs — so the dashboard looks populated on first launch.

**Demo workflow** — *"AI Lead Qualification & Follow-up"*: hit **Run Demo** in the top bar (or "Test run" in the builder) and watch the execution flow through lead → AI analysis → score condition → CRM / email / task (or nurture). Every step is simulated with realistic status updates.

---

## Project structure

```
FlowPilot/
├── assets/                  # README screenshots
├── backend/                 # Express + TypeScript REST API
│   └── src/
│       ├── app.ts           # bootstrap (helmet, cors, rate limit, routes)
│       ├── server.ts        # entrypoint (connect db, auto-seed demo data)
│       ├── routes/          # REST route definitions
│       ├── controllers/     # request/response layer
│       ├── services/        # business logic layer
│       ├── models/          # Mongoose schemas
│       ├── automation/      # workflow engine + node definitions
│       ├── ai/              # provider abstraction (OpenAI, Anthropic, DeepSeek, Mock)
│       ├── middleware/      # auth, validation, errors, rate limiting
│       ├── config/          # env + db connection
│       ├── seed/            # realistic demo data
│       ├── validation/      # Zod schemas
│       └── utils/           # error helpers, JWT, HTTP responses
└── frontend/                # React + Vite + TS + Tailwind SPA
    └── src/
        ├── pages/           # route-level views (dashboard, builder, auth, …)
        ├── components/      # layout + shared UI primitives
        ├── lib/             # api client, types, utils
        ├── store/           # zustand auth + theme stores
        └── App.tsx          # routing
```

### How the engine works
`backend/src/automation/engine.ts` executes a workflow graph via BFS traversal:
- Trigger nodes seed execution; conditions branch on `TRUE` / `FALSE` handles.
- Node settings resolve `{{template}}` placeholders against the live execution context.
- AI nodes run through the provider abstraction; disabled nodes are skipped (pass-through).
- Every step is logged to an `Execution` document with status, duration, input/output and error.
- In demo mode all external calls are simulated.

### AI provider abstraction
`backend/src/ai/` resolves a provider by name — `openai`, `anthropic`, `deepseek` or `mock`. Providers are only called when the matching `*_API_KEY` exists; otherwise a simulated provider returns deterministic, structured results so the product runs fully offline.

---

## Environment variables

See [`.env.example`](.env.example) and `backend/.env.example`:

| Variable                | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `MONGODB_URI`           | MongoDB connection string                        |
| `JWT_SECRET`            | JWT signing secret                                |
| `OPENAI_API_KEY`        | OpenAI provider key (optional)                   |
| `ANTHROPIC_API_KEY`     | Anthropic provider key (optional)                |
| `DEEPSEEK_API_KEY`      | DeepSeek provider key (optional)                 |
| `STRIPE_SECRET_KEY`     | Stripe secret (optional; mock otherwise)         |
| `DEMO_MODE`             | `true` (default) → simulated AI, integrations, billing |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Seed demo-account credentials             |

> Never commit real secrets — `.env` files are git-ignored.

---

## API overview

All endpoints live under `/api` and return `{ success, data }` (or `{ success, error }`).

| Area        | Endpoints                                                                                     |
|-------------|-----------------------------------------------------------------------------------------------|
| Auth        | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `PUT /auth/me` · `POST /auth/me/password` · `POST /auth/forgot-password` · `POST /auth/reset-password` · `PUT /auth/organization` |
| Workflows   | `GET /workflows` · `POST /workflows` · `GET /workflows/:id` · `PUT /workflows/:id` · `PATCH /workflows/:id/status` · `DELETE /workflows/:id` · `POST /workflows/:id/run` · `POST /workflows/:id/test` |
| Executions  | `GET /executions` · `GET /executions/:id`                                                     |
| AI          | `POST /ai/generate-workflow` · `POST /ai/generate-text` · `POST /ai/analyze` · `GET /ai/providers` |
| Integrations| `GET /integrations` · `POST /integrations/:key/connect` · `DELETE /integrations/:key/disconnect` |
| Agents      | `GET /agents` · `POST /agents` · `PUT /agents/:id` · `DELETE /agents/:id` · `POST /agents/:id/run` |
| Analytics   | `GET /analytics/summary` · `GET /analytics/time-series` · `GET /analytics/used-workflows` · `GET /analytics/recent-executions` |
| Dashboard   | `GET /dashboard` · `GET /dashboard/credits`                                                   |
| Templates   | `GET /templates` · `GET /templates/:slug` · `POST /templates/:slug/use`                        |
| Team        | `GET /team` · `POST /team/invite` · `POST /team/accept-invite` · `PATCH /team/members/:id/role` · `DELETE /team/members/:id` · `GET /team/activity` |
| Billing     | `GET /billing/plans` · `GET /billing/current` · `POST /billing/checkout` · `POST /billing/cancel` |
| API keys    | `GET /api-keys` · `POST /api-keys` · `POST /api-keys/:id/revoke`                               |
| Notifications| `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/:id/read` · `POST /notifications/read-all` |

---

## Database

The backend reads `MONGODB_URI`:

1. **Local MongoDB** (`mongodb://127.0.0.1:27017/flowpilot`) — install and run MongoDB locally.
2. **MongoDB Atlas** — use a `mongodb+srv://` connection string.
3. **None (demo mode)** — if MongoDB is unreachable and `DEMO_MODE=true`, the backend starts `mongodb-memory-server` automatically. Data resets when the process stops.

Seed idempotent demo data with `npm run seed`.

---

## Demo mode

- **AI** — no keys → `mock` provider returns deterministic, structured JSON for all AI steps and the generator.
- **Integrations** — "connect" succeeds with generated credentials; runs emit realistic simulated outputs.
- **Billing** — checkout is a mock Stripe session.
- **Executions** — the engine simulates step latencies, branches and occasional failures with per-step logs.
- **Dashboard** — auto-seeded with realistic 30-day data on first boot.

Set `DEMO_MODE=false` and provide real API keys to route AI calls to live providers while keeping integrations/billing simulated.

---

## Roadmap

- Real password-reset email delivery (SendGrid / Resend).
- Real integration execution via HTTP/OAuth adapters (Gmail, Slack, HubSpot, Stripe, Sheets).
- True LLM-driven workflow generation when an API key is configured.
- Real Stripe checkout and webhooks.
- Google OAuth sign-in.
- Streaming agent runs with live step updates in the builder.
- Multi-workspace switching and Enterprise SSO.
- Pagination for workflows/executions and code-splitting the frontend bundle.

---

## Contributing

Contributions are welcome — read [CONTRIBUTING.md](CONTRIBUTING.md) to get started. Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) and report security issues privately per [SECURITY.md](SECURITY.md).

---

## License

Distributed under the [MIT License](LICENSE). All product names and company names in seed data are fictional.