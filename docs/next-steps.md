# Next Steps

Last updated: 2026-04-12

---

## Finish Phase 3.5

Small remaining items before the phase is truly done.

- [ ] **Weight dot timezone bug** — `logged_at.startsWith(todayDate)` compares UTC timestamp strings. For UTC+ timezones a weight logged late at night may have tomorrow's UTC date, so the dot never clears. Fix by comparing dates in local time instead.
- [ ] **Performance pass** — pre-load today's log and recent foods on app open so there's no visible fetch delay when the app first launches.
- [ ] **Keyboard avoiding view** — needs testing in a built APK. `softwareKeyboardLayoutMode: "resize"` only takes effect after a native build, not in Expo Go. Test each screen and fix any that still hide behind the keyboard.

---

## Deferred — Needs a Design Decision

These are blocked on deciding the right approach, not on implementation effort.

- [ ] **Food immutability causes duplicate search results** — editing a food creates a new versioned row; both versions appear in search results. Options: only surface the highest-version row per barcode/name, or add a `superseded_by` foreign key and filter those out.
- [ ] **Food management screen** — a screen listing all user-created foods with the ability to delete them. Blocked on deletion strategy:
  - Soft-delete (hide from search, keep log references intact) — cleanest
  - Block delete if referenced by any log item or meal
  - Allow delete only if never logged

---

## Phase 4 — Options

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

- The app is fully functional and stable. Phase 3.5 is ~90% done.
- Option A is the natural next step — authentication in particular blocks any real multi-user use.
- Options B and C can run in parallel with A (UI work doesn't conflict with feature work).
- The full original Phase 4 and Phase 5 plans are still in `docs/roadmap.md`.
