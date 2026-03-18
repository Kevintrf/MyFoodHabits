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
| `docs/roadmap.md`                            | Phased development plan with completion status               |
| `docs/decisions/`                            | ADRs — why we chose what we chose                            |
| `database/schema.md`                         | Full DB schema with ER diagram                               |
| `CHANGELOG.md`                               | Full history of every change made                            |
| `docs/ideas/original-chatgpt-brainstorming/` | Raw brainstorming — spirit is valid, details may be outdated |

---

## Current Phase

**Phase 1 ✅ and Phase 2 ✅ are complete.** Currently in Phase 3 — Reduce Friction.

### Phase 3 remaining items (roadmap order)

- [x] Edit/delete log items — long-press on TodayScreen opens bottom-sheet modal; `DELETE /log/items/:id` + `PATCH /log/items/:id`
- [ ] User-configurable macro targets — settings screen; currently hardcoded to 2000kcal / 150g in TodayScreen
- [ ] Create meals from UI — frontend flow to build a saved meal; `POST /meals` backend exists
- [ ] Edit a custom food — needs UI + `PATCH /foods/:id`; backend handles immutability via versioning
- [ ] Barcode scanning — Open Food Facts integration, local caching
- [ ] Recently used foods — surface at the top of search and today screen
- [ ] Custom serving units per food (slice, piece, cup, tbsp)
- [ ] Meal scaling (0.5x, 1x, 2x) on the log-meal flow
- [ ] Habit detection v1 — detect repeated morning patterns, prompt "Log your usual breakfast?"
- [ ] Manual food creation — form UI; `POST /foods` backend already exists
- [ ] Performance pass — pre-load today's log and recent foods on app open

---

## Project Structure

```text
backend/
  src/
    index.ts            Express app entry, mounts all routers
    db/client.ts        pg Pool (dotenv loaded here before Pool creation)
    lib/macros.ts       calcMacros() and sumMacros() utilities
    routes/
      foods.ts          GET /foods/search, GET /foods/:id, POST /foods
      log.ts            POST /log, GET /log/:date, DELETE /log/items/:id, PATCH /log/items/:id
      meals.ts          POST /meals, GET /meals, POST /meals/:id/log
      weight.ts         GET /weight, POST /weight
  migrations/           node-pg-migrate migration files
  scripts/seed.js       Inserts default dev user (id=1)

frontend/
  App.tsx               Wraps AppProvider + RootNavigator
  src/
    services/api.ts     All typed API calls (no fetch in components)
    context/AppContext  userId, todayDate, todayLog, refreshTodayLog()
    navigation/RootNavigator.tsx  Bottom tabs + SearchStack
    screens/
      TodayScreen       Date, macro progress bars, log items by slot
      SearchScreen      Debounced search (250ms), navigates to Portion
      PortionScreen     Serving picker, quantity, meal slot, live preview
      MealsScreen       Lists meals, Alert slot picker to log whole meal
      WeightScreen      Log weight, view history
```

---

## Fresh Environment Setup

```bash
# 1. Start the database
docker compose up -d

# 2. Apply schema migrations
cd backend && npm run migrate:up

# 3. Seed the default dev user (id=1)
npm run seed

# 4. Start the API
npm run dev

# 5. Start the frontend (separate terminal)
cd ../frontend && npx expo start --clear
```

---

## Known Gotchas

- **dotenv must be loaded in `db/client.ts`** — not just `index.ts`. All imports run before any code in index.ts, so the Pool would be created with `DATABASE_URL=undefined` if dotenv is only called there.
- **babel.config.js is required** in the Expo project root — without it Metro skips `babel-preset-expo` and the app crashes in Expo Go with TurboModule errors.
- **user_id is hardcoded to 1 everywhere** — all routes have `// TODO: replace with auth middleware`. The seed script creates this user.
- **Expo SDK version mapping**: as of early 2026, SDK 54 = React 19.1.0 + RN 0.81.5. Never guess SDK→RN mappings; run `npx expo start` and read the version warning output.
- **Phone needs LAN IP**: set `EXPO_PUBLIC_API_URL=http://<machine-ip>:3000` in `frontend/.env`. The same IP works for browser too.

---

## Coding Standards

- TypeScript everywhere — no plain JS files
- ESLint + Prettier enforced
- No `any` types without a comment explaining why
- API calls go in `frontend/src/services/api.ts` — never `fetch()` directly in components
- Components stay under ~200 lines — extract before they grow past that
- Database queries go in route handlers for now — extract to a service layer when complexity demands it

---

## Important Constraints

**Store nutrition per 100g.** Convert to serving sizes at read time. Never store per-serving values as the canonical source of truth.

**Foods are immutable.** Changes to a food create a new version — old log entries must never silently change their calorie values.

**Liquid foods** use `liquid: true` flag. All values still stored per 100g; the UI displays "per 100ml" instead of "per 100g" for liquid foods.

**Show only what matters.** Calories and protein are the primary metrics. Fat, carbs, sodium are secondary.

**Delay these until post-launch:**

- AI photo detection, natural language parsing
- Community food voting / moderation
- Premium tier / payments
- Advanced analytics or coaching
