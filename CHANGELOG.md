# Changelog

All changes to the project are documented here. Descriptions are written to be used directly as git commit messages.

---

## 2026-03-15

### `docs: expand roadmap with missing features and nested meal collections`

- Added Phase 4 UI overhaul between Reduce Friction and Differentiating Features
- Added to Phase 3: edit/delete log items, user-configurable targets, create meals from UI, edit custom food
- Added to Phase 5: authentication, onboarding, copy previous day, nested meal collections, data export
- Updated `database/schema.md` — documented planned `sub_meal_id` evolution on `meal_items` with cycle detection and recursive macro calculation constraints noted

---

## 2026-03-14

### `fix: correct SDK 54 package versions (React 19, RN 0.81.5)`

- Updated `frontend/package.json` — wrong versions were pinned (React 18/RN 0.76); correct SDK 54 versions are React 19.1.0, RN 0.81.5, expo-status-bar ~3.0.9, react-native-screens ~4.16.0, react-native-safe-area-context ~5.6.0

### `fix: add missing babel.config.js with babel-preset-expo`

- Created `frontend/babel.config.js` — missing from manual SDK downgrade; without it Metro skips Expo's architecture interop layer, causing TurboModule crashes in Expo Go

### `fix: downgrade Expo SDK from 55 to 54 for Expo Go compatibility`

- Updated `frontend/package.json` — expo ~54.0.0, react 18.3.1, react-native 0.76.7, TypeScript ~5.5.0, and all compatible SDK 54 peer packages

### `feat: add seed script for default dev user`

- Created `backend/scripts/seed.js` — inserts user id=1 if not present; required because all routes hardcode user_id=1 until auth is implemented
- Added `seed` npm script to `backend/package.json`

### `fix: load dotenv before pg Pool is created`

- Updated `backend/src/db/client.ts` — moved `dotenv.config()` here so DATABASE_URL is set before `new Pool()` runs; previously the Pool was constructed before `index.ts` had a chance to call dotenv

### `feat: scaffold Expo frontend with all Phase 2 screens (Phase 2 complete)`

- Initialized `frontend/` — Expo SDK 55, TypeScript, blank template
- Installed `@react-navigation/native`, `bottom-tabs`, `native-stack`, `react-native-screens`, `react-native-safe-area-context`, `@expo/vector-icons`
- Created `frontend/src/services/api.ts` — typed fetch wrapper for all API endpoints; uses `EXPO_PUBLIC_API_URL`
- Created `frontend/src/context/AppContext.tsx` — `AppProvider` holding today's date, today's log, and `refreshTodayLog()`
- Created `frontend/src/navigation/RootNavigator.tsx` — bottom tab navigator (Today / Search / Meals / Weight) with SearchStack (Search → Portion)
- Created `frontend/src/screens/TodayScreen.tsx` — date header, calorie + protein progress cards, log items grouped by meal slot
- Created `frontend/src/screens/SearchScreen.tsx` — debounced 250ms search input, taps navigate to PortionScreen
- Created `frontend/src/screens/PortionScreen.tsx` — serving picker, quantity input, meal slot selector, live macro preview, logs and returns to Today
- Created `frontend/src/screens/MealsScreen.tsx` — lists saved meals with macros; Alert slot picker to log a whole meal
- Created `frontend/src/screens/WeightScreen.tsx` — log weight entries, display history
- Created `frontend/.env.example`, updated `frontend/.gitignore`
- Added `GET /foods/:id` to `backend/src/routes/foods.ts` — returns food with servings
- Added `backend/src/routes/weight.ts` — `GET /weight`, `POST /weight`
- Updated `backend/src/index.ts` — mounts weight router

### `feat: implement Phase 1 API endpoints with macro calculation`

- Created `backend/src/lib/macros.ts` — `calcMacros` and `sumMacros` utilities, formula: `(per_100g / 100) * serving_grams * quantity`
- Created `backend/src/routes/foods.ts` — `GET /foods/search` (name ILIKE + barcode lookup), `POST /foods` (with optional servings, transactional)
- Created `backend/src/routes/log.ts` — `POST /log` (upserts day_log, calculates macros on response), `GET /log/:date` (returns slots grouped by meal with per-item and total macros)
- Created `backend/src/routes/meals.ts` — `POST /meals`, `GET /meals`, `POST /meals/:id/log` (logs all meal items in one transaction)
- Updated `backend/src/index.ts` — mounts all routers, adds global error handler

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
