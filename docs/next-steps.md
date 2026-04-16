# Next Steps

Last updated: 2026-04-16

---

## Finish Phase 3.5

Small remaining items before the phase is truly done.

- [x] **Weight dot timezone bug** — Fixed: `getTodayDate()` now uses local date methods instead of `.toISOString()` (UTC). The `logged_at` comparison also converts to local date before comparing.
- [x] **Performance pass** — Fixed: `AppContext` pre-fetches targets, weight status, and recent foods on mount. `recentFoods` moved into context so `SearchScreen` gets data instantly without its own fetch.
- [ ] **Keyboard avoiding view** — `softwareKeyboardLayoutMode: "resize"` tested on a physical device (2026-04-15) but keyboard still obscures inputs on some screens. Needs a proper fix (likely per-screen `KeyboardAvoidingView` tuning). Deferred — not blocking.

---

## Deferred — Needs a Design Decision

These are blocked on deciding the right approach, not on implementation effort.

- [ ] **Food immutability causes duplicate search results** — editing a food creates a new versioned row; both versions appear in search results. Options: only surface the highest-version row per barcode/name, or add a `superseded_by` foreign key and filter those out.
- [ ] **Food management screen** — a screen listing all user-created foods with the ability to delete them. Blocked on deletion strategy:
  - Soft-delete (hide from search, keep log references intact) — cleanest
  - Block delete if referenced by any log item or meal
  - Allow delete only if never logged

---

## Phase 4 — Offline-first (go serverless)

**Goal:** The app runs entirely on-device with no backend server. Data lives in a local SQLite database. Barcode lookups hit Open Food Facts directly from the app. The backend and PostgreSQL become optional (kept for future multi-user sync, but not required to use the app).

**Why now:** Removes the requirement to run a server locally before the app is usable. Enables real daily use for finding bugs and improvements.

**Architecture after this phase:**
```
[Expo App] → [expo-sqlite local DB]
                      ↑
           [Open Food Facts API]   (barcode lookups only, with local cache)
```

### Tasks (in order)

- [x] **Install expo-sqlite and design the local schema**
  `expo-sqlite` v16 installed. `src/db/client.ts` opens the DB singleton with `PRAGMA foreign_keys = ON`. `src/db/schema.ts` defines all tables (`user_settings`, `foods`, `food_servings`, `day_logs`, `log_items`, `meals`, `meal_items`, `weights`) and indexes, adapted for SQLite (TEXT CHECK for enums, INTEGER PRIMARY KEY, ISO-8601 TEXT timestamps, REAL for floats). `initSchema()` exported — not yet wired into app start.

- [x] **DB initialisation on app start**
  `initSchema()` called at module load in `App.tsx` — runs synchronously before any component mounts. Creates all tables and indexes (no-op after first install) and seeds the `user_settings` row with defaults.

- [x] **Write the local service layer**
  Six files created with identical function signatures to `api.ts`: `db/macros.ts` (pure calc helpers), `db/foods.ts` (search, CRUD, versioned edit, local barcode lookup), `db/log.ts` (getLog, month summary, add/delete/update log items), `db/meals.ts` (CRUD + logMeal with scale), `db/settings.ts` (targets), `db/weight.ts` (history + log). Not yet wired into app — screens still use `api.ts`.

- [x] **Move barcode lookup to the app**
  `getFoodByBarcode` in `db/foods.ts` now checks local DB first, then falls back to Open Food Facts (`/api/v0/product/{barcode}.json`), caches the result in SQLite with `source='OPENFOODFACTS'`, and throws `BARCODE_NOT_FOUND` for unknown barcodes or network failures. Liquid detection and macro parsing ported from backend.

- [x] **Wire up AppContext and screens to local services**
  All 10 screens and AppContext now import functions from `db/` modules. Type-only imports (`Food`, `Meal`, `LogItem`, etc.) still come from `services/api.ts` — that file is now types-only. TypeScript confirms zero errors.

- [ ] **Remove backend dependency from the app**
  Delete `frontend/.env`, `frontend/app.config.js` API URL references. The backend directory stays in the repo but is no longer needed to run the app.

### Decisions already made
- **SQLite library:** `expo-sqlite` — built into Expo, no extra native config, sufficient for single-user
- **No ORM:** Raw SQL queries in typed service functions — keeps it simple and debuggable
- **User ID:** Keep hardcoded `user_id = 1`; authentication is Phase 5
- **Food immutability:** Preserve the same versioning pattern (edit = insert new row, old row stays)
- **Backend:** Keep it in the repo, untouched — useful for future multi-user sync

---

## Phase 5 — Options

We discussed three directions. Pick one (or mix) before starting.

### Option A: Polish & Prepare for Real Users *(recommended first)*
Functional completions that matter before showing the app to anyone:

- [ ] **Authentication** — replace hardcoded `user_id = 1` with real sign-up / login. The `users` table already has `email`. Probably JWT + bcrypt, or a simple magic-link flow.
- [ ] **Onboarding flow** — first-run screen to set name, calorie target, protein target before the app is meaningful to a new user.
- [ ] **Food management screen** — list of user-created foods, with edit and delete (once the deletion strategy is decided above).
- [ ] **Edit barcode on existing foods** — "Edit barcode" button in EditFoodScreen that opens the scanner; scanned value replaces the stored barcode. Useful when a food was created manually and the barcode wasn't captured at the time.
- [ ] **Weight chart** — line chart on the Weight screen showing the trend over the last 30/90 days. Use a 7-day moving average rather than raw daily values — daily weight fluctuates heavily due to water/sodium/glycogen and the raw line confuses people.
- [ ] **Search result ranking** — user-created foods should be ranked above Open Food Facts results for the same query. Currently all results are sorted by name alphabetically regardless of source.
- [ ] **Copy a previous day's log** — "Log same as [date]" shortcut, or a button on the calendar day view to re-log an entire past day.

### Option B: Full UI Overhaul *(original Phase 4 plan)*
Makes the app look intentional and screenshot-worthy before sharing it.

- [ ] Define a design system — colour palette, typography scale, spacing tokens
- [ ] Redesign TodayScreen — macro ring or bar, cleaner meal section hierarchy
- [ ] Redesign SearchScreen — better empty state, recent foods cards
- [ ] Redesign PortionScreen — cleaner serving picker, macro preview
- [ ] Redesign MealsScreen — meal cards with macro summary
- [ ] Redesign WeightScreen — trend chart, cleaner history list
- [ ] Micro-interactions and loading states throughout
- [ ] Dark mode support

### Option C: Differentiating Features *(Phase 5 in roadmap)*
Things that make this app better than the alternatives:

- [ ] Remaining macros view — "You still need 77g protein today, here are some options"
- [ ] Day summary — calories, protein, consistency streak shown on Today
- [ ] Weekly summary — trend view, weight progress
- [ ] Habit detection v1 — detect repeated morning patterns, prompt "Log your usual breakfast?"
- [ ] Calorie budget mode — plan remaining meals around a target
- [ ] Data export — CSV of the full food log
- [ ] Quick-add command input — type `+2 eggs +coffee` to log multiple items at once

---

## Notes

- Phase 3.5 is functionally complete (keyboard view deferred, not blocking).
- **Phase 4 (offline-first) is the current priority** — enables daily use without running a server.
- Phase 5 options A/B/C are unchanged from the original roadmap; Option A (polish for real users) is still the recommended next step after offline-first.
- The full original roadmap is still in `docs/roadmap.md`.
