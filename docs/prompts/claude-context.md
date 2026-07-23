# Claude Context

This file is a briefing document for Claude. Read this at the start of any conversation to get full context on the project.

---

## Project Summary

**MyFoodHabits** — a mobile calorie tracking app. The core idea: logging food should be effortless. The app learns from user habits and builds an increasingly accurate model of their typical day, allowing entire meals or full days to be logged with a single tap.

**MVP goal:** User can log 2 eggs + 2 slices of bread in under 5 seconds total.

**SLC model:** Simple, Loveable, Complete. Do the core well, not everything poorly.

---

## Current Architecture

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| App      | Expo (React Native), TypeScript                     |
| Storage  | SQLite on-device (expo-sqlite)                      |
| Food API | Open Food Facts (barcode lookups, direct from app)  |
| AI       | Anthropic API (nutrition estimation, direct from app)|

No backend server. All data lives in a local SQLite database managed by `app/src/db/`.

---

## Key Files

| File                                         | Purpose                                                      |
|----------------------------------------------|--------------------------------------------------------------|
| `docs/overview.md`                           | What the app is, core features, philosophy                   |
| `docs/architecture.md`                       | System design and screen list                                |
| `docs/roadmap.md`                            | Phased development plan with completion status               |
| `docs/decisions/`                            | ADRs — why we chose what we chose                            |
| `CHANGELOG.md`                               | Full history of every change made                            |

---

## Project Structure

```text
app/
  App.tsx               Wraps AppProvider + RootNavigator
  src/
    services/api.ts     Shared TypeScript types (no HTTP calls)
    context/AppContext  userId, todayDate, viewingLog, targets, weights, tdee
    navigation/RootNavigator.tsx  Bottom tabs + SearchStack + MealsStack
    db/
      client.ts         expo-sqlite database instance
      schema.ts         CREATE TABLE statements + migrations (current: v8)
      log.ts            Day log and log item CRUD
      foods.ts          Food search, barcode lookup, create/edit
      meals.ts          Saved meals CRUD and logging
      settings.ts       User targets (calories, protein, activity, etc.)
      weight.ts         Weight log
      macros.ts         calcMacros() and sumMacros() utilities
    screens/
      TodayScreen         Date, macro progress bars, log items by slot
      SearchScreen        Debounced search (250ms), navigates to Portion
      PortionScreen       Serving picker, quantity, meal slot, live preview
      MealsScreen         Lists saved meals, log whole meal with slot picker
      CreateMealScreen    Name input, food search, ±quantity draft list
      EditMealScreen      Edit a saved meal
      WeightScreen        Log weight, view history
      SettingsScreen      Calorie/protein targets, activity, profile, tracking toggles
      CreateFoodScreen    Form to create a custom food (name, macros, liquid flag)
      EditFoodScreen      Pre-filled form to edit a user-created food
      AiEstimateScreen    Describe a meal in text, AI returns estimated macros
```

---

## Running the App

```bash
# Expo Go on a physical phone
cd app && npx expo start --clear

# Android emulator
cd app && npx expo start --clear
# then press 'a' in Metro

# Standalone APK
cd app && npx expo run:android --variant release
```

---

## Known Gotchas

- **babel.config.js is required** in the app root — without it Metro skips `babel-preset-expo` and the app crashes in Expo Go with TurboModule errors.
- **user_id is hardcoded to 1 everywhere** in the DB layer.
- **Expo SDK version mapping**: as of early 2026, SDK 54 = React 19.1.0 + RN 0.81.5. Never guess SDK→RN mappings; run `npx expo start` and read the version warning output.
- **Schema migrations** live in `app/src/db/schema.ts` — bump `SCHEMA_VERSION` and add an `if (currentVersion < N)` block for every change.

---

## Coding Standards

- TypeScript everywhere — no plain JS files
- ESLint + Prettier enforced
- No `any` types without a comment explaining why
- Types live in `app/src/services/api.ts` — no `fetch()` to a backend server anywhere
- All DB queries go in `app/src/db/` — never inline SQL in components or screens
- Components stay under ~200 lines — extract before they grow past that
- All TextInputs must have `autoComplete="off" textContentType="none"` to suppress keyboard autofill

---

## Important Constraints

**Store nutrition per 100g.** Convert to serving sizes at read time. Never store per-serving values as the canonical source of truth.

**Foods are immutable.** Changes to a food create a new version — old log entries must never silently change their calorie values.

**Liquid foods** use `liquid: true` flag. All values still stored per 100g; the UI displays "per 100ml" instead of "per 100g" for liquid foods.

**Show only what matters.** Calories and protein are the primary metrics. Fat, carbs, sodium are secondary.
