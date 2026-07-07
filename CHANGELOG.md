# Changelog

All changes to the project are documented here. Descriptions are written to be used directly as git commit messages.

---

## 2026-07-07 (47)

### feat: smart meal slot auto-selection based on logging history
Added a toggleable "Smart meal slot" setting (on by default, under Settings → Tracking). When enabled, opening the portion or meal log screen automatically pre-selects the meal slot (breakfast/lunch/dinner/snack) based on which slot the user most commonly logs at the current hour of day. Uses a per-hour frequency count over all past log_items. Falls back to time-of-day heuristics (5–10 → Breakfast, 11–14 → Lunch, 17–21 → Dinner, otherwise → Snack) when no history exists. Per-food preferences still take priority over the smart selection. Schema bumped to v8.

---

## 2026-06-25 (46)

### feat: remember last serving, quantity, and meal slot per food
PortionScreen now pre-selects the serving type, quantity, and meal (breakfast/lunch/dinner/snack) from the last time that food was logged. Stored in a new food_log_prefs table (schema v7). Pre-fills are skipped when a quantity is passed in (e.g. from AI estimate flow).

---

## 2026-06-25 (45)

### feat: upgrade AI nutrition estimation model to claude-opus-4-8
Switched aiEstimate.ts from claude-sonnet-4-6 to claude-opus-4-8 for better nutrition estimation accuracy.

---

## 2026-05-27 (44)

### feat: always show 7d avg in calorie trend, move legend under each chart
Removed the 7d avg toggle — the overlay is now always visible. The icon legend now appears directly beneath each chart (calories and protein get their own) with correct per-chart dot labels (At/under vs At/above, Over vs Under).

---

## 2026-05-27 (43)

### feat: improve calorie trend graph axis readability
Y-axis for calories uses 250/500/750/1000 kcal intervals; protein uses 25/50/75/100g intervals — both auto-selected based on data range with tight padding to reduce empty space. X-axis replaced with "14 May" date format at non-overlapping intervals (2, 3, 7, 14, 21, or 30 days) covering the 7d, 30d, and 90d ranges.

---

## 2026-05-27 (42)

### feat: improve weight graph axis readability
Y-axis now uses nice round intervals (1kg, 0.5kg, or 0.25kg) selected automatically based on the data range, with tight 0.5kg padding instead of 20% padding to eliminate excess empty space. Labels show whole numbers at 1kg+ intervals and one decimal at finer intervals. X-axis labels replaced with date-based "14 May" format at 7, 14, or 30-day intervals (chosen to avoid overlap), replacing the jumbled day/month numbers.

---

## 2026-05-27 (41)

### fix: rename Plan/Trend TDEE labels to Estimated/Observed maintenance
Replaced confusing "Plan TDEE" and "Trend TDEE" labels in the 30-day forecast summary with "Estimated maintenance" (formula-based) and "Observed maintenance" (calibrated from data).

---

## 2026-05-27 (40)

### fix: forecast values stable and lines visually connected in all view modes
Forecast math always uses the raw latest weight so summary values (delta, end weight) don't change when toggling daily/7d avg. A connector point at the last visible chart weight is prepended to each forecast series so the lines visually attach to the actual line regardless of view mode.

---

## 2026-05-27 (39)

### fix: forecast lines connect to chart in 7d avg mode
In 7d avg view the forecast lines were visually disconnected from the actual weight line because the predictions started from the raw weight while the chart ended on the smoothed value. Now uses the last visible chart point as the forecast line's visual start, while keeping the raw weight for TDEE so the rate of change stays stable between view modes.

---

## 2026-05-27 (38)

### fix: weight forecast no longer changes when toggling daily/7d avg view
The forecast anchor (current weight and date) was incorrectly derived from the smoothed moving-average points, so switching to 7d avg mode changed the starting weight and shifted all prediction values. Now always reads from the last raw weight entry.

---

## 2026-05-27 (37)

### feat: use calibrated TDEE from weight history on today screen
The TDEE displayed on the Today screen now uses the same data-driven calibration as the weight forecast's Trend line (avgCalories − Δweight/day × 7700), falling back to Mifflin-St Jeor when fewer than 3 weight entries or 7 calorie log days exist. calibrateTDEE moved to utils/tdee.ts and shared by both screens. AppContext now fetches 90 days of calorie history alongside weights.

---

## 2026-05-27 (36)

### feat: use Mifflin-St Jeor for weight forecast Plan TDEE
The weight forecast Plan prediction now uses the proper Mifflin-St Jeor formula (via utils/tdee.ts) when gender, height, and birth year are set in the profile, replacing the rough weight×22×multiplier approximation. Falls back to the rough estimate when profile is incomplete. Removed duplicate estimateTDEE function and ACTIVITY_MULTIPLIER from WeightGraphScreen.

---

## 2026-05-26 (35)

### feat: AI meal estimation via Anthropic API
Added AI-powered meal estimation to the Search screen (sparkles icon in header). Users describe a meal in plain text, optionally specify a country, and receive an estimated nutritional breakdown (calories/protein/carbs/fat per 100g, total meal weight). All values are editable before saving. The result is saved as a food with an AI Estimate badge and navigates to PortionScreen pre-filled with the estimated total weight. Requires an Anthropic API key configured in Settings under the new AI ESTIMATION section (also stores default country). Schema migrated to v5 adding ai_estimated, country, and anthropic_api_key columns.

---

## 2026-05-22 (34)

### feat: export and import data from settings
Added a DATA section to the Settings screen with Export and Import buttons. Export serialises all tables (foods, food_servings, meals, meal_items, day_logs, log_items, weights, user_settings) to a JSON file and opens the system share sheet. Import picks a previously exported JSON file and restores all data inside a single transaction, prompting the user for confirmation first. Uses expo-file-system/legacy, expo-sharing, and expo-document-picker.

---

## 2026-04-29 (33)

### feat: auto-save settings on change
Removed the Save button from SettingsScreen. Calorie and protein inputs save 600ms after the user stops typing; activity level saves immediately on tap.

---

## 2026-04-29 (32)

### feat: paginated recent foods list in search screen
The recent foods list now loads 20 items at a time. Scrolling to the bottom loads the next page automatically with a spinner indicator. The list refreshes when the search screen is focused. Recent foods fetching has been moved from AppContext into SearchScreen directly.

---

## 2026-04-29 (31)

### feat: weight graph with trend and plan predictions
Added WeightGraphScreen accessible via chart icon in the Weight tab header. Shows an SVG line chart (react-native-svg) with actual weight, a plan prediction based on calorie target vs estimated TDEE, and a historical trend prediction derived from actual weight change rate. Supports 30d/90d range toggle and daily/7-day moving average toggle. TDEE is calibrated from actual weight+calorie history when enough data exists, otherwise estimated as weight × 22 × activity multiplier. A summary card shows predicted weight in 30 days for both scenarios. Activity level (sedentary through extremely active) is now collected in Settings and stored in user_settings; schema bumped to v3.

---

## 2026-04-29 (30)

### feat: decimal quantity input and Edit food button in meal screens
Replaced integer +/− stepper with a decimal TextInput in CreateMealScreen and EditMealScreen so quantities like 1.5 or 250 can be entered directly. EditMealScreen also shows an "Edit food" link under each food name that navigates to EditFoodScreen.

---

## 2026-04-29 (29)

### feat: Grams/Milliliters always present as non-removable default serving option
In EditFoodScreen, the Grams (or Milliliters for liquids) option is now always shown at the top of the servings list and cannot be removed. It can be set as the default serving, and setting any named serving as default automatically unsets Grams/Milliliters as default.

---

## 2026-04-29 (28)

### fix: show serving size in grams/ml in log edit modal
Serving picker entries in the TodayScreen log-edit modal now include the gram amount: "MyServing (123g)" so the user can see portion sizes without opening the food editor.

---

## 2026-04-20 (27)

### feat: Edit food button shown for all food sources in log modal and portion screen

---

## 2026-04-20 (26)

### feat: edit external foods in-place with locally_modified flag
External foods (Open Food Facts, Verified) can now be edited directly from PortionScreen and the TodayScreen log modal. Editing an external food updates the row in-place and sets a `locally_modified` flag instead of creating a new versioned row, so the same food is returned on future scans or searches. A "Modified" badge (amber) appears next to the source label in search results and on the portion screen. Schema bumped to v2 with an ALTER TABLE migration for existing installs. "Edit food" button is now shown for all food sources.

---

## 2026-04-20 (25)

### feat: gram/ml input for raw serving, serving picker and edit food in log modal
When no named serving is selected, the input now represents grams (or milliliters) directly — the serving picker option is labelled "Grams"/"Milliliters" instead of "100g", and the quantity label updates to match. Switching between servings auto-converts the quantity to preserve the same gram amount. The log-item edit modal in TodayScreen now shows a serving picker and an "Edit food" button (for user-created foods). `updateLogItem` accepts a `serving_id` change. Note: existing log entries saved without a serving type stored quantity as multiples of 100g; those entries will display incorrect values and should be re-logged.

---

## 2026-04-17 (24)

### fix: reset search stack to fresh screen after logging a food
After logging a food in PortionScreen, the SearchStack was left with Portion on top. Revisiting the Search tab would land on the previous food's screen. Now resets the SearchStack to a fresh Search screen before switching to Today.

---

## 2026-04-16 (23)

### fix: "+ Add Food" crash in release build
`TodayScreen` lives inside `TodayStack`, so `navigation.dispatch(CommonActions.reset(...))` was handled by the stack navigator — `state.routes` contained only stack routes, `findIndex('SearchTab')` returned -1, and `index: -1` caused a hard crash in release (Hermes). Replaced the broken reset dispatch with `navigation.getParent()?.navigate('SearchTab')` which correctly targets the parent tab navigator.

---

## 2026-04-16 (22)

### chore: rename app to MyFoodHabits, update icons and bundle identifiers
Set name/slug to MyFoodHabits/myfoodhabits in app.json. Updated iOS bundleIdentifier and Android package to com.kevintrf.myfoodhabits. Replaced all icon assets.

---

## 2026-04-16 (21)

### feat: remove backend dependency — app is now fully offline
Deleted `frontend/.env` (hardcoded server IP). Stripped `services/api.ts` to types only — all HTTP functions, the `request` helper, and `BASE_URL` removed. Updated `.env.example` to note the server is no longer required. Phase 4 (offline-first) is complete.

---

## 2026-04-16 (20)

### feat: barcode lookup direct from app via Open Food Facts
`getFoodByBarcode` in `db/foods.ts` now checks local SQLite first, then fetches from Open Food Facts, caches the result locally, and throws on unknown barcodes or network failure. Liquid detection and macro parsing ported from the backend route. The backend is no longer involved in barcode lookups.

---

## 2026-04-16 (19)

### feat: wire all screens and AppContext to local SQLite services
All 10 screens and AppContext now import functions from the db/ modules instead of the HTTP api.ts. Type-only imports (Food, Meal, LogItem, etc.) remain in api.ts which is now effectively a types file. No server connection required for any app feature.

---

## 2026-04-16 (18)

### feat: local SQLite service layer (foods, log, meals, settings, weight)
Added six db/ modules replacing all backend HTTP calls with direct SQLite queries: `macros.ts` (pure calc helpers), `foods.ts` (search, CRUD, versioned edit, local barcode lookup), `log.ts` (getLog with macro totals, month summary, add/delete/update items), `meals.ts` (CRUD + logMeal with scale factor), `settings.ts` (targets), `weight.ts` (history + log). Function signatures are identical to `api.ts` so screens need no changes when wired up.

---

## 2026-04-16 (17)

### feat: wire DB initialisation into app start
`initSchema()` is now called at module load in `App.tsx`, synchronously before any component mounts. On first install it creates all tables, indexes, and seeds the default `user_settings` row; on every subsequent launch it is a no-op.

---

## 2026-04-16 (16)

### feat: install expo-sqlite and define local SQLite schema
Added `expo-sqlite` v16. Created `src/db/client.ts` (DB singleton, foreign keys enabled) and `src/db/schema.ts` (all 8 tables + 6 indexes adapted from the PostgreSQL schema, plus `initSchema()` which creates tables and seeds default user settings on first install). Not yet wired into app start — that is the next task.

---

## 2026-04-15 (15)

### fix: weight dot timezone bug and performance pre-fetch on app open
`getTodayDate()` now uses local date methods instead of `.toISOString()` so the "logged today" check is correct for all timezones. The `logged_at` comparison also converts to local date. Additionally, `AppContext` now pre-fetches targets, weight status, and recent foods on mount; `recentFoods` is stored in context so `SearchScreen` renders the recent list immediately without a separate fetch.

---

## 2026-04-12 (14)

### feat: barcode scanning in Create Meal and Edit Meal screens
Added a barcode scanner button to the food search row in CreateMealScreen and EditMealScreen. Scanning a known barcode adds the food directly to the meal draft. If the barcode is not found, an alert offers "Try again" or "Cancel" (no "Create manually" option since that would navigate away from the draft). Also fixed MealsScreen using the renamed `refreshViewingLog` context method.

---

## 2026-04-12 (13)

### feat: duplicate food items and macro totals in meal builder
Create Meal and Edit Meal now allow adding the same food multiple times as separate entries. Each food item shows its computed macros (calories, protein, carbs, fat) based on quantity and selected serving. A total macro row is shown above the save button.

---

## 2026-04-12 (12)

### fix: edit meal quantity NaN and allow 0 quantity
PostgreSQL returns numeric columns as strings; coerce `mi.quantity` with `Number()` on init so `+` arithmetic works correctly. Changed `Math.max(1, ...)` to `Math.max(0, ...)` in both Create and Edit Meal so quantities can be reduced to 0.

---

## 2026-04-12 (11)

### feat: custom serving selection in Create and Edit Meal
Foods with custom servings now show serving chips (e.g. "slice (30g)") in the meal builder. The default serving is pre-selected when adding a food. Serving is saved to the meal item and used in macro calculations.

---

## 2026-04-12 (10)

### fix: today edit modal appears instantly and closes on outside tap
Removed slide animation so modal appears immediately. Tapping the dark overlay now dismisses the modal.

---

## 2026-04-12 (9)

### fix: tap log item to edit instead of long press

---

## 2026-04-12 (8)

### feat: allow logging 0 quantity with confirmation
Logging 0 now shows a confirmation alert instead of silently blocking. Invalid (non-numeric) input still does nothing.

---

## 2026-04-12 (7)

### feat: add + button to Search header, remove inline create food buttons
Added a "+" button in the Search screen header (same pattern as Meals). Removed the "Create X" and "Create new food" inline buttons from the results list.

---

## 2026-04-12 (6)

### fix: search screen not scrollable
Consolidated recent foods and search results into a single FlatList so the whole screen scrolls. Search bar and section header moved to ListHeaderComponent.

---

## 2026-04-12 (5)

### fix: show total grams in serving label on Today screen
Serving labels now show the total gram/ml amount in parentheses, e.g. `1.5 × slice (45g)` instead of just `1.5 × slice`.

---

## 2026-04-12 (4)

### fix: liquid foods showing "g" instead of "ml"
Fixed serving unit labels across Create Food, Edit Food, Portion Screen, and Meals Screen to use "ml" when a food has liquid=true.

---

## 2026-04-12 (3)

### fix: delete meal crashing with JSON parse error
The request helper always called res.json() even on 204 No Content responses. Added a 204 check to return early without parsing.

---

## 2026-04-12 (2)

### feat: edit and delete meals
Added `EditMealScreen` — tap any meal card to open it. Pre-populates name and food list from the existing meal. Save changes via `PATCH /meals/:id` (replaces items in a transaction). Delete meal via `DELETE /meals/:id` with confirmation. Also fixed meals list not auto-refreshing after create/edit by switching to `useFocusEffect`.

---

## 2026-04-12

### fix: cross-platform alert wrapper for web testing
Created `frontend/src/utils/alert.ts` — a `showAlert` wrapper that uses React Native `Alert` on native and `window.alert`/`window.confirm` on web. Replaced all `Alert.alert` calls across 8 screens so alerts work correctly in both the browser and on device.

---

## 2026-03-21 (11)

### `fix: today empty state and meals item spacing`

- Fixed `frontend/src/screens/TodayScreen.tsx` — "Nothing logged today yet." now uses `Object.keys(slots).length === 0` instead of `!todayLog`; the previous check only showed the message before the first data load, never after
- Fixed `frontend/src/screens/MealsScreen.tsx` — meal item line was missing a space before `×` in the no-serving-name branch (`× 100g` → ` × 100g`)
- Added `docs/testing-checklist.md` — full manual testing checklist for the Phase 3.5 walkthrough
- Added weight dot timezone edge case to Phase 3.5 in `docs/roadmap.md` — to be fixed after walkthrough

---

## 2026-03-21 (10)

### `docs: mark doc audit items complete in roadmap`

- Checked off "Review all docs against the codebase" and "Audit CHANGELOG, roadmap, and claude-context for gaps" in Phase 3.5

---

## 2026-03-21 (9)

### `fix: docs/code audit — sync architecture.md and fix POST /foods response`

- Updated `docs/architecture.md` — added all missing API routes (`GET /foods/recent`, `GET /foods/:id`, `PATCH /foods/:id`, `DELETE /log/items/:id`, `PATCH /log/items/:id`, `GET /users/me`, `PATCH /users/me`); removed non-existent `POST /meals/:id/add-food`; added missing screens (SettingsScreen, CreateFoodScreen, EditFoodScreen, CreateMealScreen); updated State Management description to include targets and loggedWeightToday
- Updated `docs/prompts/claude-context.md` — AppContext description now includes `targets`, `refreshTargets()`, `loggedWeightToday`, `refreshWeightToday()`
- Fixed `backend/src/routes/foods.ts` — `POST /foods` RETURNING clause now includes `created_by_user_id` (was missing; all other endpoints already returned it)

---

## 2026-03-21 (8)

### `feat: recently used foods`

- Added `GET /foods/recent` to `backend/src/routes/foods.ts` — joins `log_items` → `day_logs` → `foods`, groups by food, orders by most recent `logged_at`, returns top 10
- Added `getRecentFoods` to `frontend/src/services/api.ts`
- Updated `frontend/src/screens/SearchScreen.tsx` — loads recent foods on mount; when query is empty and recents exist, shows them under a RECENT section header instead of the placeholder text

---

## 2026-03-21 (7)

### `feat: custom serving units`

- Added `ServingDraft` interface to `frontend/src/services/api.ts`; added `servings` param to `createFood` and `editFood`
- Updated `PATCH /foods/:id` in `backend/src/routes/foods.ts` — now accepts `servings` array and inserts them for the new food version within the same transaction
- Updated `frontend/src/screens/CreateFoodScreen.tsx` — servings editor below macros: name + grams inputs, "Add serving" button, list of added servings with remove; first serving is automatically marked as default
- Updated `frontend/src/screens/EditFoodScreen.tsx` — same editor, but pre-populated by calling `getFoodById` on mount to load existing servings

---

## 2026-03-21 (6)

### `feat: meal scaling`

- Updated `POST /meals/:id/log` in `backend/src/routes/meals.ts` — accepts optional `scale` param (default 1); multiplies each item's quantity by scale before inserting log entries
- Updated `logMeal` in `frontend/src/services/api.ts` — added `scale` parameter
- Rewrote `frontend/src/screens/MealsScreen.tsx` — replaced Alert slot picker with a bottom-sheet modal; modal shows 0.5×/1×/2× scale buttons, a live macro preview that updates with scale, and a slot selector before confirming

---

## 2026-03-21 (5)

### `docs: restructure roadmap phases for habit detection and performance pass`

- Removed habit detection v1 from Phase 3 — moved to Phase 5 alongside v2; needs real usage data to be useful
- Removed performance pass from Phase 3 — moved to Phase 3.5; better to optimise based on what actually feels slow during the walkthrough
- Phase 3 now ends after recently used foods, custom serving units, and meal scaling

---

## 2026-03-21 (4)

### `docs: add Phase 3.5 Stabilise to roadmap`

- Added Phase 3.5 between Phase 3 and Phase 4 — end-to-end device walkthrough, bug fixes, docs/code audit, and removal of anything that didn't work as intended
- Updated claude-context.md to note Phase 3.5 exists between Phase 3 and the UI overhaul

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
