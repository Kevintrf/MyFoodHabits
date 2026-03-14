# Claude Context

This file is a briefing document for Claude. Read this at the start of any conversation to get full context on the project.

---

## Project Summary

**MyFoodHabits** — a mobile calorie tracking app. The core idea: logging food should be effortless. The app learns from user habits and builds an increasingly accurate model of their typical day, allowing entire meals or full days to be logged with a single tap.

**MVP goal:** User can log 2 eggs + 2 slices of bread in under 5 seconds total.

**SLC model:** Simple, Loveable, Complete. Do the core well, not everything poorly.

---

## Current Architecture

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Expo (React Native), TypeScript   |
| Backend  | Express (Node.js), TypeScript     |
| Database | PostgreSQL                        |
| Food API | Open Food Facts (barcode lookups) |

See [../architecture.md](../architecture.md) for the full breakdown.

See [../../database/schema.md](../../database/schema.md) for the database schema and ER diagram.

---

## Key Files

| File                                         | Purpose                                                      |
|----------------------------------------------|--------------------------------------------------------------|
| `docs/overview.md`                           | What the app is, core features, philosophy                   |
| `docs/architecture.md`                       | System design, screen list, API routes                       |
| `docs/roadmap.md`                            | Phased development plan                                      |
| `docs/decisions/`                            | ADRs — why we chose what we chose                            |
| `database/schema.md`                         | Full DB schema with ER diagram                               |
| `docs/ideas/original-chatgpt-brainstorming/` | Raw brainstorming — spirit is valid, details may be outdated |

---

## Coding Standards

- TypeScript everywhere — no plain JS files
- ESLint + Prettier enforced
- No `any` types without a comment explaining why
- API calls go in `/services` — never `fetch()` directly in components
- Components stay under ~200 lines — extract before they grow past that
- Database queries go in dedicated repository/service functions — not inline in route handlers

---

## Important Constraints

**Always keep the app runnable.** Never leave the codebase in a broken state at end of day.

**Store nutrition per 100g.** Convert to serving sizes at read time. Never store per-serving values as the canonical source of truth.

**Foods are immutable.** Changes to a food create a new version — old log entries must never silently change their calorie values.

**Delay these until post-launch:**

- AI photo detection
- Natural language parsing
- Community food voting / moderation
- Barcode scanning (planned for Phase 3, not MVP)
- Premium tier / payments
- Advanced analytics or coaching

**Show only what matters.** Calories and protein are the primary metrics. Fat, fiber, sodium, sugar are secondary — hide them unless the user asks.

---

## Current Phase

> Update this section at the start of each new phase.

### Phase 1 — Foundation (Backend + Database)

Working on: Express setup, PostgreSQL schema, core API endpoints.

Check [../roadmap.md](../roadmap.md) for current task checklist.
