<div align="center">

# FlowPilot

**AI-powered business automation that works for you.**

Connect your business tools, automate repetitive workflows, and let AI handle the work.

</div>

FlowPilot is a full-stack, production-quality SaaS application for building, running, monitoring and analyzing AI-automated workflows. It is designed as a portfolio / demonstration project: a cohesive, polished product — not a CRUD prototype — with a visual workflow builder, an AI workflow generator, AI agents, integrations, executions, analytics, templates, team management, and billing.

> **Demo mode is enabled by default.** No API keys, integrations or external services are required — AI and integrations are simulated so the whole product can be demoed end to end.

---

## Screenshots

<div align="center">

<img src="assets/Screenshot%202026-08-10%20002211.png" alt="FlowPilot app preview" width="88%" />

<br/><br/>

<img src="assets/Screenshot%202026-08-10%20000445.png" alt="FlowPilot app preview" width="44%" />
<img src="assets/Screenshot%202026-08-10%20002311.png" alt="FlowPilot app preview" width="44%" />

</div>

Screenshots live in [`assets/`](assets/) and are captured from the current demo build.

---

## Features

### Core platform
- **Visual workflow builder** — drag-and-drop React Flow canvas with triggers, AI steps, conditions, actions and utilities; node inspector, duplicate, enable/disable, connect, run history.
- **AI workflow creator** — describe a workflow in plain English; FlowPilot generates a node graph to approve, edit, regenerate or save.
- **AI agents** — create specialized agents (sales, support, lead qualification…) with instructions, model, temperature, tools, memory and execution limits; track runs, success rate, tokens and latency.
- **Executions** — per-step execution timelines with success / failed / running / waiting statuses, durations, messages and input/output payloads.
- **Analytics** — executions, success rate, failed runs, AI tasks, API usage, time-saved and cost estimates with charts.
- **Templates** — prebuilt workflows (lead qualification, email follow-up, support assistant, invoice processing, meeting summary) with preview and one-click install.
- **Integrations marketplace** — Gmail, Slack, Google Sheets, HubSpot, Salesforce, Stripe, WhatsApp, Webhooks, OpenAI, Anthropic, DeepSeek; connect/disconnect with simulated credentials in demo mode.
- **Team management** — roles (owner / admin / member / viewer), invites, role changes, activity log.
- **Billing** — Free / Pro / Business plans with mock Stripe checkout.
- **Settings** — profile (name, email), profile image upload with **crop** + a gallery of preset avatars, company, security (change password), notifications, real API-key creation / revocation.
- **Dashboard** — stats, recent executions, performance charts, AI usage, credits and quick actions.
- **Onboarding** — goal → tools → natural-language description → AI-generated workflow review → save.

### UX & polish
- **Light & dark theme** — full light/dark design system with a persisted toggle across the app and the marketing site.
- Cohesive token-based design system (colors, status tints, cards, buttons, forms) built with Tailwind.
- Fully responsive: sidebar → mobile drawer, adaptive grids, responsive workflow canvas.

### Auth & security
- Email/password authentication with bcrypt (cost 12) hashing.
- JWT sessions; organization-level data isolation on every query.
- Zod input validation, rate limiting, Helmet, CORS.
- API keys are SHA-256 hashed before storage.
- Google OAuth structure reserved for future implementation.

---

## Architecture

The project is a monorepo with two npm workspaces.

```
FlowPilot/
├── assets/                  # README screenshots
├── backend/                 # Express + TypeScript REST API
│   ├── src/
│   │   ├── app.ts           # app bootstrap (helmet, cors, rate limit, routes)
│   │   ├── server.ts        # entrypoint (connect db, auto-seed demo data)
│   │   ├── routes/          # REST route definitions
│   │   ├── controllers/     # request/response layer
│   │   ├── services/        # business logic layer
│   │   ├── models/          # Mongoose schemas
│   │   ├── automation/      # workflow engine + node definitions
│   │   ├── ai/              # provider abstraction (OpenAI, Anthropic, DeepSeek, Mock)
│   │   ├── middleware/      # auth, validation, errors, rate limiting
│   │   ├── config/          # env + db connection
│   │   ├── seed/            # realistic demo data
│   │   ├── validation/      # Zod schemas
│   │   └── utils/           # error helpers, JWT, HTTP responses
│   └── .env.example
└── frontend/                # React + Vite + TS + Tailwind SPA
    └── src/
        ├── pages/           # route-level views (dashboard, builder, auth, …)
        ├── components/      # layout + shared UI primitives
        ├── lib/             # api client, types, utils
        ├── store/           # zustand auth + theme stores
        └── App.tsx          # routing
```

### Workflow engine
`backend/src/automation/engine.ts` executes a workflow graph with BFS traversal:

- Trigger nodes seed execution; conditions branch on `TRUE`/`FALSE` handles.
- Node settings (e.g. prompt, field, threshold, output key) resolve `{{template}}` placeholders against execution context.
- AI nodes run through the provider abstraction; disabled nodes are skipped (pass-through).
- Every step is logged to an `Execution` document with status, duration, input/output and error.
- In demo mode all external calls are simulated.

### AI provider abstraction
`backend/src/ai/` resolves a provider by name: `openai`, `anthropic`, `deepseek` or `mock`. Providers are called only when the matching `*_API_KEY` exists; otherwise a simulated provider returns deterministic, structured results — so the product runs fully offline.

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

## Installation

Requirements: **Node.js ≥ 20**, **npm ≥ 9**. MongoDB is optional in demo mode.

```bash
# 1. Install workspace dependencies
npm install

# 2. Configure environment
cp backend/.env.example backend/.env   # then edit if needed
# (optional) cp frontend/.env.example frontend/.env

# 3. Seed demo data (optional — the API also auto-seeds on first boot in demo mode)
npm run seed
```

Root `.env.example` documents every variable; the backup sections are grouped in `backend/.env`.

---

## Environment variables

See [`.env.example`](.env.example) and `backend/.env.example`. The important ones:

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

> Never commit real secrets. `.env` files are git-ignored.

---

## Running locally

```bash
# Both servers (backend on :5000, frontend on :5173)
npm run dev

# Individually
npm run dev:backend     # nodemon-style reload via tsx watch
npm run dev:frontend    # Vite dev server
```

Open http://localhost:5173 (frontend) and http://localhost:5000/api/health (API).

Demo data is seeded automatically on first boot when `DEMO_MODE=true` (or via `npm run seed`).

---

## Demo credentials

| Field    | Value                   |
|----------|-------------------------|
| Email    | `sarmad@flowpilot.app`  |
| Password | `Demo1234!`             |

The seeded workspace (`FlowPilot Labs`, Pro plan) includes 5 workflows, ~1,180 executions across the last 30 days, 5 AI agents, 5 templates, connected integrations, notifications and activity logs — so the dashboard looks populated on first launch.

### Demo workflow
**"AI Lead Qualification & Follow-up"** — hit **Run Demo** in the top bar (or "Test run" in the builder) and watch the execution move through lead → AI analysis → score condition → CRM/email/task (or nurture). In demo mode every step is simulated with realistic status updates.

---

## API documentation

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

## Database setup

The backend reads `MONGODB_URI`. You have three options:

1. **Local MongoDB** (`mongodb://127.0.0.1:27017/flowpilot`) — install and run MongoDB locally.
2. **MongoDB Atlas** — use a `mongodb+srv://` connection string.
3. **None (demo mode)** — if MongoDB is unreachable and `DEMO_MODE=true`, the backend starts `mongodb-memory-server` automatically. Data resets when the process stops.

Seed:
```bash
npm run seed   # idempotent demo data (user, org, workflows, executions, agents, templates)
```

---

## Demo mode

- **AI**: no keys → `mock` provider returns deterministic, structured JSON for all AI steps and the workflow generator.
- **Integrations**: "connect" succeeds with generated credentials; runs emit realistic simulated outputs.
- **Billing**: checkout is a mock stripe session.
- **Executions**: the engine simulates step latencies, branches and occasional failures with full per-step logs.
- **Dashboard**: auto-seeded with realistic 30-day data on first boot.

To disable simulation, set `DEMO_MODE=false` and provide the relevant API keys — the engine then routes AI calls to the real providers while keeping integrations/billing simulated.

---

## Future roadmap

- **Reset-password email delivery** — wire a real email provider (SendGrid / Resend) instead of returning the demo token in the response.
- **Real integration execution** — replace `simulateAction` with real HTTP/OAuth adapters for Gmail, Slack, HubSpot, Stripe, Sheets.
- **True LLM workflow generation** — upscale the deterministic generator with an LLM call when an API key is present.
- **Real Stripe checkout** and webhook handling.
- **Google OAuth** sign-in.
- **Streaming agent runs** with SSE/websocket live step updates in the builder.
- **Multi-workspace switching** and Enterprise SSO.
- **Pagination** on workflows/executions and code-splitting the frontend bundle.

---

## License

Private demo / portfolio project. All product names and company names in seed data are fictional.#   F l o w P i l o t  
 