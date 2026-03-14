# Changelog

All changes to the project are documented here. Descriptions are written to be used directly as git commit messages.

---

## 2026-03-14

### `chore: add docker-compose for local PostgreSQL`

- Created `docker-compose.yml` — PostgreSQL 17 Alpine with named volume, exposed on port 5432

### `feat: scaffold Express + TypeScript backend (Phase 1 start)`

- Created `backend/package.json` — Express, pg, node-pg-migrate, dotenv, cors; dev deps: TypeScript, ts-node, nodemon, ESLint, Prettier
- Created `backend/tsconfig.json` — targets ES2022/CommonJS, strict mode
- Created `backend/eslint.config.mjs` — ESLint v9 flat config with typescript-eslint + prettier
- Created `backend/.prettierrc` — single quotes, trailing commas, 100 print width
- Created `backend/nodemon.json` — watches `src/`, runs via ts-node
- Created `backend/.env.example` — DATABASE_URL and PORT
- Created `backend/.gitignore` — node_modules, dist, .env
- Created `backend/src/index.ts` — Express app with `/health` endpoint
- Created `backend/src/db/client.ts` — pg Pool using DATABASE_URL
- Created `backend/migrations/1773446400000_initial-schema.js` — full schema: enums, all 8 tables, indexes

---

### `docs: fill out project documentation from brainstorming`
- Created `docs/overview.md` — app description, target users, MVP vs deferred features, philosophy
- Created `docs/architecture.md` — system diagram, screens, API routes, design principles
- Created `docs/roadmap.md` — 4-phase development plan with checkboxes
- Created `docs/prompts/claude-context.md` — Claude briefing document for future sessions
- Created `docs/decisions/database-choice.md` — ADR for PostgreSQL
- Created `docs/decisions/stack-choice.md` — ADR for Express + Expo + PostgreSQL

### `docs: add initial database schema with ER diagram`
- Created `database/schema.md` — full schema with Mermaid ER diagram and table descriptions
- Tables: `users`, `foods`, `food_servings`, `meals`, `meal_items`, `day_logs`, `log_items`, `weights`

### `docs: add liquid flag to foods table`
- Updated `database/schema.md` — added `liquid` boolean to `foods`
- Liquids stored per 100g like solids; flag is used by UI to display "per 100ml" instead of "per 100g"

### `docs: add changelog`
- Created `CHANGELOG.md`
