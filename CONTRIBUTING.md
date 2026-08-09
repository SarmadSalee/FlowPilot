# Contributing to FlowPilot

Thanks for your interest in contributing! FlowPilot is built as a polished, real-world full-stack application, and contributions that keep it coherent and production-quality are very welcome.

Read the [README](README.md) first to understand the project, then follow the guide below.

---

## Code of conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## How to contribute

### 1. Find or open an issue
- Check the open issues before starting work to avoid overlaps.
- For new work, open an issue describing the **problem** and the **proposed change** so maintainers can weigh in early.
- Label ideas that are small, self-contained, or good for first-time contributors.

### 2. Set up the project

```bash
# requirements: Node.js >= 20, npm >= 9
npm install
cp backend/.env.example backend/.env   # edit if needed
npm run seed                            # optional: demo data
npm run dev                             # backend :5000 + frontend :5173
```

See the [README](README.md#getting-started) for full setup instructions.

### 3. Make your changes
- Format and typecheck both workspaces before submitting:

```bash
npm run typecheck:backend   # tsc --noEmit
npm run typecheck:frontend  # tsc -p tsconfig.json
npm run build:frontend      # tsc -b && vite build (catches CSS/apply errors too)
```

- Follow existing conventions: token-based Tailwind classes on the frontend, layered Express (routes → controllers → services → models) on the backend, Zod validation on every public input.
- Do not commit `.env` files or real secrets.

### 4. Commit
- Keep commits small and focused. Use clear, imperative messages:

```
feat(builder): add node duplication
fix(engine): resolve template vars in condition thresholds
style(theme): align toggle with design tokens
```

### 5. Open a pull request
- Describe what changed and why, and how to verify it.
- Reference the issue your PR resolves (e.g. `Closes #12`).
- Include screenshots or a short screen capture for UI changes.
- Keep PRs reviewable — prefer several focused PRs over one large one.

---

## Development tips

### Frontend
- The visual system lives in `frontend/src/index.css` (design tokens) and `tailwind.config.js` (token → utility mapping). Change tokens there, not by hardcoding colors.
- Theme: light/dark is driven by the `.dark` class on `<html>`; use tokens (`text-ink`, `bg-surface`, …) so both themes stay consistent.
- Route-level views live in `frontend/src/pages`, shared UI in `frontend/src/components`, state stores in `frontend/src/store`.

### Backend
- Public endpoints are declared in `backend/src/routes`, validated with Zod in `backend/src/validation`.
- Business logic goes in `backend/src/services` (keep controllers thin).
- The workflow engine is `backend/src/automation/engine.ts`; node implementations are the node definition catalog.
- AI providers are abstracted in `backend/src/ai` — every new provider must implement the same interface.

### Demo mode
Most external behavior (AI, integrations, billing) is simulated when `DEMO_MODE=true`. If you change simulated behavior, keep it deterministic so the demo is stable and seeded data stays consistent.

---

## Reporting bugs

Bug reports are contributions too. Please include:
- Browser/OS, Node version, and whether you're on demo mode
- Steps to reproduce
- Expected vs. actual behavior
- Console output / network errors if any

## Feature requests

Explain the **user problem** you're solving and how the feature should behave. Mock-ups or wireframes are a big plus.

---

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).