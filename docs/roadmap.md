# Roadmap

## Guiding Rules

- Always keep the app runnable — never let it sit broken
- Build the smallest thing that proves the concept, then iterate
- Delay: AI features, community features, advanced analytics
- Test the core loop constantly: can I log food in under 5 seconds?

---

## Phase 1 — Foundation (Backend + Database) ✅ COMPLETE

Goal: A working API with a real database that can store and retrieve food logs.

- [x] Initialize Express project (TypeScript, ESLint, Prettier)
- [x] Set up PostgreSQL (local Docker container for dev)
- [x] Write and run database migrations (schema v1)
- [x] `GET /foods/search` — basic name search
- [x] `POST /log` + `GET /log/:date` — add and retrieve log items
- [x] `POST /foods` — create a new food
- [x] Macro calculation (calories, protein, carbs, fat from per-100g values + serving size)
- [x] `POST /meals` + `GET /meals` — create and list saved meals
- [x] `POST /meals/:id/log` — log a whole meal at once

**Milestone:** Can log a meal via API calls (no UI yet). Macros calculate correctly. ✅

---

## Phase 2 — Basic Frontend ✅ COMPLETE

Goal: A working mobile UI for the full core loop.

- [x] Initialize Expo project (TypeScript)
- [x] TodayScreen — show calories, protein, today's log grouped by meal
- [x] SearchScreen — search foods, show recent foods on empty state
- [x] PortionScreen — select serving size and log
- [x] MealsScreen — list saved meals, tap to log
- [x] WeightScreen — log and view weight history
- [x] Wire up all screens to the live API

**Milestone:** Full core loop works on device — search food, log it, see it on today's screen. ✅

---

## Phase 3 — Reduce Friction

Goal: Make logging fast enough that users actually want to use it daily.

- [x] Edit/delete log items — fix mistakes after logging; requires `DELETE /log/items/:id` and `PATCH /log/items/:id` backend endpoints
- [x] User-configurable macro targets — settings screen to set calorie and protein goals (`GET /users/me` + `PATCH /users/me`; targets stored in DB, loaded into AppContext)
- [x] Create meals from UI — CreateMealScreen with name input, food search, ±quantity draft list; + button in Meals tab header; saves via `POST /meals`
- [x] Edit a custom food — correct wrong macros; `PATCH /foods/:id` creates a new versioned row; EditFoodScreen pre-fills form; Edit link shown on PortionScreen for user-created foods
- [x] Barcode scanning — Open Food Facts integration, local caching; barcode icon on SearchScreen opens full-screen scanner; results cached in DB
- [x] Recently used foods — `GET /foods/recent` returns 10 most recently logged distinct foods; shown on SearchScreen empty state under a RECENT header
- [x] Custom serving units per food — name + grams editor in CreateFoodScreen and EditFoodScreen; first added serving is default; backend stores in food_servings and PortionScreen already surfaces them
- [x] Meal scaling (0.5x, 1x, 2x) on the log-meal flow — bottom-sheet modal replaces Alert picker; shows scale buttons, live macro preview, and slot selector before logging
- [x] Manual food creation — form to define name, calories, protein, carbs, fat per 100g; liquid toggle; accessible via SearchScreen; navigates to PortionScreen on save

**Milestone:** User can log a typical day in under 2 minutes. App feels fast.

---

## Phase 3.5 — Stabilise

Goal: Before touching the UI, make sure everything that exists actually works correctly and is properly documented.

- [ ] End-to-end walkthrough on a real device — test every feature in every screen, note anything broken or awkward
- [ ] Bug fixes and UX rough edges found during walkthrough
- [ ] Performance pass — pre-load today's log and recent foods on app open; optimise anything that felt slow during walkthrough
- [ ] Review all docs against the codebase — anything in the docs that wasn't implemented, anything in the code that isn't documented
- [ ] Audit CHANGELOG, roadmap, and claude-context for gaps or stale entries
- [ ] Remove or flag any features that didn't work as intended

**Milestone:** Every existing feature works correctly on device. Docs and code are fully in sync.

---

## Phase 4 — UI Overhaul

Goal: Replace the functional-but-rough Phase 2 UI with a polished, opinionated design that feels good to use daily.

- [ ] Define design system — color palette, typography scale, spacing tokens, component library
- [ ] Redesign TodayScreen — clear macro ring/bar, meal sections with better hierarchy
- [ ] Redesign SearchScreen — better empty state, recent foods cards, barcode scan entry point
- [ ] Redesign PortionScreen — cleaner serving picker, macro preview, confirmation flow
- [ ] Redesign MealsScreen — meal cards with macro summary, quick-log UX
- [ ] Redesign WeightScreen — weight chart/trend visualization
- [ ] Micro-interactions and loading states throughout
- [ ] Dark mode support

**Milestone:** App looks and feels intentional. Screenshots are worth sharing. Ready for real users.

---

## Phase 5 — Differentiating Features

Goal: Features that make this app meaningfully better than alternatives.

- [ ] Authentication — replace hardcoded `user_id=1` with real sign-up/login; schema already has `email` on users table
- [ ] Onboarding flow — first-run screen to set name, calorie target, protein target before anything is meaningful
- [ ] Copy a previous day's log — "log same as yesterday" or pick any past date to repeat
- [ ] Nested meal collections — meals can contain other meals, not just food items (see schema note); enables composing "Weekend brunch" = "Usual breakfast" + extras
- [ ] Data export — CSV download of the full food log
- [ ] Remaining macros view — "You still need 77g protein, here are some options"
- [ ] Quick add command input — `+2 eggs +coffee with milk`
- [ ] Day summary — calories, protein, consistency streak
- [ ] Weekly summary — trend view, weight progress
- [ ] Habit detection v1 — detect repeated morning patterns, prompt "Log your usual breakfast?"
- [ ] Habit detection v2 — full day pattern, "Log your usual day?"
- [ ] Calorie budget mode — plan remaining meals around a target
- [ ] Offline-first storage — local SQLite mirrors server data; writes are instant locally and sync in background; requires auth to be meaningful

**Milestone:** App has a clear reason to exist over MyFitnessPal. Users actively recommend it.

---

## Deferred (Post-Launch)

These get built only after there are real users with real feedback.

- AI photo food detection
- Natural language food entry
- Community food verification / voting
- Premium tier + payment integration
- Grocery list generation
- Advanced coaching / AI recommendations
