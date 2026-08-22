# Architecture

## System Design

MyFoodHabits is a single Expo (React Native) app with **no backend server** — all data lives on-device in a local SQLite database (`expo-sqlite`). Two external APIs are called directly from the app, never through a server:

```text
[Expo App]
    |-- reads/writes -->  [expo-sqlite local DB]
    |-- barcode lookups -->  [Open Food Facts API]   (cached locally on first hit)
    '-- meal estimation -->  [Anthropic API]          (user-supplied API key)
```

This wasn't the original design — the app started as Expo + Express + PostgreSQL (see [decisions/stack-choice.md](decisions/stack-choice.md), now superseded) and was migrated to fully local/serverless storage to remove the friction of running a server before the app was usable. There is one implicit local user (`user_id` hardcoded to `1`); no authentication.

## Frontend

**Technology:** Expo (React Native), TypeScript

### Navigation

Bottom tab bar with five tabs, each its own stack:

| Tab       | Stack screens                                                       |
|-----------|----------------------------------------------------------------------|
| Today     | TodayScreen → CalendarScreen, CalorieTrendScreen                     |
| Search    | SearchScreen → PortionScreen, CreateFoodScreen, EditFoodScreen, AiEstimateScreen |
| Meals     | MealsScreen → CreateMealScreen, EditMealScreen                       |
| Weight    | WeightScreen → WeightGraphScreen                                     |
| Settings  | SettingsScreen                                                       |

### Screens

| Screen             | Purpose                                                                    |
|--------------------|------------------------------------------------------------------------------|
| TodayScreen        | Main dashboard — calories/macros for the viewing date, TDEE, log by meal slot |
| CalendarScreen     | Month view; tap a day to set it as the active viewing date on Today          |
| CalorieTrendScreen | Calorie and protein trend charts (7d/30d/90d) vs. target                      |
| SearchScreen       | Debounced food search, recent foods, barcode scanner, entry to AI estimate    |
| PortionScreen      | Serving/quantity/meal-slot picker with live macro preview; pre-fills from last use |
| CreateFoodScreen   | Create a custom food (name, macros per 100g, liquid flag, servings)           |
| EditFoodScreen     | Edit a user-created food (new versioned row) or hide it from search/recent    |
| AiEstimateScreen   | Describe a meal in text; Anthropic API returns estimated macros               |
| MealsScreen        | Saved meals — view and log whole meals with a scale picker (0.5×/1×/2×)       |
| CreateMealScreen   | Create a new saved meal with food search and ±quantity draft list             |
| EditMealScreen     | Edit or delete a saved meal                                                   |
| WeightScreen       | Log body weight; reminder dot when nothing logged today                       |
| WeightGraphScreen  | Weight trend chart with TDEE-based forecast                                   |
| SettingsScreen     | Calorie/protein targets, activity level, profile (for TDEE), AI key, data export/import |

### State Management

- React Context (`AppContext`) for global state — today's date/log, viewing date, macro targets, weight status, calibrated TDEE, recent foods
- Local component state for everything else
- No Redux — keep it simple until complexity demands otherwise

### Key Principles

- Debounce search input at 250ms
- Pre-load today's log, targets, and recent foods on app open (`AppContext`)
- Keep components under ~200 lines; extract a component before it grows past that
- All DB access goes through `app/src/db/*.ts` — no inline SQL in components or screens

## Local Data Layer

**Technology:** `expo-sqlite`, raw SQL (no ORM)

`app/src/db/client.ts` opens a single shared `expo-sqlite` connection with `PRAGMA foreign_keys = ON`. `app/src/db/schema.ts` defines all tables and runs migrations on startup (see [../database/schema.md](../database/schema.md) for the current schema).

Query modules, one per domain, each exposing plain async functions the screens call directly:

```text
db/
  client.ts     expo-sqlite connection singleton
  schema.ts     CREATE TABLE statements + versioned migrations
  foods.ts      search, barcode lookup/caching, create/edit (versioned), hide
  log.ts        day logs and log items — CRUD, day/month summaries
  meals.ts      saved meals — CRUD, log a meal at a given scale
  settings.ts   user_settings — targets, profile, AI key
  weight.ts     weight entries — CRUD, history
  macros.ts     calcMacros() / sumMacros() pure calculation helpers
  dataTransfer.ts   full-DB JSON export/import (Settings → Data)
```

Types are still centralized in `app/src/services/api.ts`, but that file is **types only** — there are no `fetch()` calls to a backend anywhere in the app.

### Key Design Decisions

- All nutrition values stored per 100g, converted to servings at read time
- `foods` are immutable — editing inserts a new versioned row; hiding (`hidden` flag) is the only "delete", so `log_items`/`meal_items` referencing an older or hidden food never break
- `food_servings` allows custom units (slice, piece, tbsp) per food
- `foods.source` enum distinguishes user-created vs. verified vs. Open Food Facts data
- `food_log_prefs` remembers each food's last serving/quantity/meal-slot to pre-fill PortionScreen

## External APIs

**Open Food Facts** — free, open food database

- Called directly from `db/foods.ts` for barcode scanning lookups
- Results are cached in the local `foods` table on first lookup (`source = 'OPENFOODFACTS'`) to avoid repeated calls

**Anthropic API** — meal nutrition estimation

- Called directly from `services/aiEstimate.ts` using a user-supplied API key (stored in `user_settings.anthropic_api_key`)
- User describes a meal in plain text; result is saved as a food with `ai_estimated = true`

## Deployment

No server to deploy — the app ships as a standalone Android/iOS build (`npx expo run:android --variant release` produces an installable APK with the JS bundle embedded). See the root [README.md](../README.md) for build instructions.
