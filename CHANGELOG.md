# Changelog

All changes to the project are documented here. Descriptions are written to be used directly as git commit messages.

---

## 2026-03-21 (3)

### `feat: weight tab reminder dot`

- Added `loggedWeightToday` and `refreshWeightToday` to `AppContext` — calls `GET /weight`, checks if the most recent entry's `logged_at` matches today's date
- Updated `RootNavigator.tsx` — Weight tab uses a custom `WeightTabIcon` component that overlays a small red dot when `loggedWeightToday` is false; dot disappears as soon as weight is logged
- Updated `WeightScreen.tsx` — calls `refreshWeightToday` after successfully logging weight so the dot clears immediately

---

## 2026-03-21 (2)

### `feat: barcode scanning`

- Added `GET /foods/barcode/:barcode` to `backend/src/routes/foods.ts` — checks DB cache first; on miss fetches from Open Food Facts API, parses nutriments (with kJ fallback for calories, liquid detection via `categories_tags`), caches result with `source = 'OPENFOODFACTS'` using `ON CONFLICT DO UPDATE`
- Added `getFoodByBarcode` to `frontend/src/services/api.ts`
- Installed `expo-camera` (SDK 54 compatible)
- Updated `frontend/src/screens/SearchScreen.tsx` — barcode icon button next to search input; tapping requests camera permission then opens a full-screen `CameraView` modal with a frame overlay; on scan calls backend and navigates to PortionScreen; on not-found prompts to create manually or try again

---

## 2026-03-21

### `feat: edit a custom food`

- Added `PATCH /foods/:id` to `backend/src/routes/foods.ts` — inserts a new row with `version + 1`, preserving the original for existing log entries; returns 403 if the food was not created by the requesting user
- Exposed `created_by_user_id` on all food responses (search, get by id, post, patch)
- Added `created_by_user_id` field to `Food` interface in `frontend/src/services/api.ts`
- Added `editFood` API call to `frontend/src/services/api.ts`
- Created `frontend/src/screens/EditFoodScreen.tsx` — form pre-filled with existing values; on save navigates to PortionScreen with the new food version
- Added `EditFood` route to `SearchStackParamList` and `SearchStack.Navigator` in `RootNavigator.tsx`
- Updated `frontend/src/screens/PortionScreen.tsx` — shows "Edit food" link below the food name when `created_by_user_id === 1`

---

## 2026-03-18 (4)

### `feat: create meals from UI`

- Added `createMeal` to `frontend/src/services/api.ts` — typed wrapper for `POST /meals`
- Created `frontend/src/screens/CreateMealScreen.tsx` — meal name input, debounced food search, draft items list with ±quantity controls and remove button, save button calls `POST /meals` and returns to MealsScreen
- Wrapped Meals tab in `MealsStack` in `RootNavigator.tsx` — added `MealsStackParamList`, `MealsStackNavigator`, and a native header + button that navigates to `CreateMealScreen`
- Removed custom header text from `MealsScreen.tsx` — replaced by the stack navigator's native header

---

## 2026-03-18 (3)

### `feat: manual food creation`

- Added `createFood` to `frontend/src/services/api.ts` — typed wrapper for `POST /foods`
- Created `frontend/src/screens/CreateFoodScreen.tsx` — form with name, calories/protein/carbs/fat per 100g, and a liquid toggle; on save navigates directly to PortionScreen so the food can be logged immediately; name is pre-filled from the search query
- Updated `frontend/src/screens/SearchScreen.tsx` — when results exist, a subtle "Create new food" button appears at the bottom of the list; when no results are found, a prominent green "Create [query]" button is shown
- Added `CreateFood` route to `SearchStackParamList` and `SearchStack.Navigator` in `RootNavigator.tsx`

---

## 2026-03-18 (2)

### `feat: user-configurable macro targets`

- Added `backend/src/routes/users.ts` — `GET /users/me` returns `target_calories` and `target_protein_g`; `PATCH /users/me` updates them (COALESCE so partial updates work)
- Mounted `/users` router in `backend/src/index.ts`
- Added `getTargets` and `updateTargets` to `frontend/src/services/api.ts`
- Updated `frontend/src/context/AppContext.tsx` — loads targets on app start, exposes `targets` and `refreshTargets`; falls back to 2000kcal / 150g if DB values are null
- Created `frontend/src/screens/SettingsScreen.tsx` — two numeric inputs for calorie and protein targets, save button calls `PATCH /users/me` then refreshes context
- Updated `frontend/src/screens/TodayScreen.tsx` — removed hardcoded `TARGETS` constant; MacroCards now read from `targets` in AppContext
- Added Settings tab (gear icon) to `frontend/src/navigation/RootNavigator.tsx`

---

## 2026-03-18

### `docs: sync claude-context with roadmap`

- Updated `docs/prompts/claude-context.md` — Phase 3 section now matches `docs/roadmap.md` exactly: edit/delete log items marked complete, all 10 remaining items listed in roadmap order with matching descriptions
- Updated project structure comment in claude-context.md — `log.ts` now lists all four endpoints including `DELETE /log/items/:id` and `PATCH /log/items/:id`

---

## 2026-03-15

### `feat: edit and delete log items`

- Added `DELETE /log/items/:id` and `PATCH /log/items/:id` to `backend/src/routes/log.ts` — both verify item belongs to the requesting user via day_log ownership check
- Added `deleteLogItem` and `updateLogItem` to `frontend/src/services/api.ts`
- Updated `frontend/src/screens/TodayScreen.tsx` — log items are now long-pressable; opens a bottom-sheet modal to change quantity or meal slot, or delete with a confirmation alert

---

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
