# Issues & Improvements

Found during Phase 3.5 walkthrough. Work through these before moving to Phase 4.

---

## Bugs (broken behaviour)

- [x] **Delete log item** — confirmed working on device; was failing in browser due to Alert not working on web (fixed by cross-platform alert wrapper)
- [x] **Meals list does not auto-refresh after creating a meal** — fixed with useFocusEffect to see the new meal
- [x] **Liquid foods show "g" instead of "ml"** — fixed in Create Food, Edit Food, Portion Screen, and Meals Screen
- [x] **Edit Meal quantity goes NaN when decremented** — PostgreSQL returns numeric as string; coerce with `Number()` on init; also allow 0 quantity (changed `Math.max(1)` → `Math.max(0)` in Create/Edit Meal)

---

## Missing Features

- [x] **No way to delete or edit a saved meal** — EditMealScreen added; tap a meal card to open it
- [x] **Meal items only support 100g base quantity** — serving chips now appear in Create/Edit Meal for foods that have custom servings
- [x] **No accessible entry point to create a food** — added "+" button in Search screen header; removed the inline create buttons from results list
- [x] **Logging 0 quantity** — now allowed with a confirmation alert warning that 0 calories/macros will be logged
- [x] **Saving a food with 0 calories** — works correctly; 0 is allowed, negative and non-numeric values are blocked

---

## UX Improvements

- [ ] **Search input only auto-focuses on the first visit** — should auto-focus every time the Search tab is opened
- [x] **Edit/delete log item requires long-press** — changed to single tap
- [ ] **Invalid inputs fail silently** — entering an invalid quantity (Portion Screen), invalid weight (Weight Screen), or invalid food values (Create Food) gives no feedback; add a brief error toast
- [x] **Serving label in Today log should include grams** — now shows e.g. `1.5 × slice (45g)`
- [ ] **No way to change the default serving** — must remove and re-add servings to reorder; should be able to mark any serving as default
- [ ] **Food immutability causes duplicate search results** — editing a food creates a new version which appears as a separate entry in search; consider only showing the latest version per food

---

## Needs Re-testing

- [x] **Barcode scanner backend flow** — all flows confirmed working on same WiFi: known barcode lookup, unknown barcode alert, Try again, Create manually
- [x] **"Edit food" link correctly hidden for non-user foods** ✓

---

## Deferred / Needs Design

- [ ] **Food management screen** — a list of all user-created foods with the ability to delete them
  - **Design consideration:** foods are immutable by design — old log entries reference their original food row, so deleting a food would orphan those log entries. Options to consider:
    - Soft-delete: mark the food as deleted so it no longer appears in search, but log entries still resolve correctly
    - Block delete if the food is referenced by any log entry or meal item; show which logs use it
    - Allow delete only if the food has never been logged
  - Hold until the approach is decided

---

## Phase 4 Features

- [ ] **History / calendar view** — a calendar screen where each day is tappable to view that day's full log
  - Day colour: green if kcal goal was met, red if logged but goal not met, grey if nothing was logged
  - Tapping a day opens a read-only view of that day's log (slots + items + totals), same layout as Today
  - Backend needs an endpoint to fetch a day log by date (may already exist via the today endpoint generalised to accept a date param)
  - Consider where to put it in the tab bar — could replace or sit alongside the Today tab

---

## New Issues Found During Barcode Re-test

- [ ] **Manually created food is not matched when its barcode is later scanned** — if a user creates a food manually without a barcode, then later scans that product's barcode, the scanner creates a new Open Food Facts entry instead of linking to the existing manual entry. The two entries are not deduplicated.
- [ ] **No food source indicator in the UI** — Portion Screen and search results don't show where a food came from (user-created, Open Food Facts, verified); should show the source and make clear that non-user foods are not editable
