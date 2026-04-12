# Issues & Improvements

Found during Phase 3.5 walkthrough. Work through these before moving to Phase 4.

---

## Bugs (broken behaviour)

- [ ] **Delete log item does nothing** — long-press edit modal has a Delete button that shows no confirmation and does not remove the item from the log
- [ ] **Meals list does not auto-refresh after creating a meal** — must pull-to-refresh manually to see the new meal
- [ ] **Liquid foods show "g" instead of "ml" in multiple places:**
  - Create Food Screen: serving input hint text still says "grams" when liquid toggle is on
  - Portion Screen: custom servings show "(30g)" instead of "(30ml)"
  - Meals Screen: food quantities show "g" instead of "ml"

---

## Missing Features

- [ ] **No way to delete or edit a saved meal** — once created, a meal is permanent
- [ ] **Meal items only support 100g base quantity** — no way to set a custom serving or gram amount per food when building a meal
- [ ] **No accessible entry point to create a food without a search query** — the subtle "+ Create new food" button at the bottom of search results does not appear; needs a "+" button in the Search screen header (same pattern as Meals tab)
- [ ] **Logging 0 quantity is blocked** — should be allowed (e.g. to track that you had something without knowing the exact amount); currently silently does nothing
- [ ] **Saving a food with 0 calories is blocked** — should be allowed, but warn the user before proceeding (e.g. "Calories are 0 — continue?")

---

## UX Improvements

- [ ] **Search input only auto-focuses on the first visit** — should auto-focus every time the Search tab is opened
- [ ] **Edit/delete log item requires long-press** — not discoverable; consider adding a visible edit icon or making items tappable
- [ ] **Invalid inputs fail silently** — entering an invalid quantity (Portion Screen), invalid weight (Weight Screen), or invalid food values (Create Food) gives no feedback; add a brief error toast
- [ ] **Serving label in Today log should include grams** — e.g. `1.5 × slice (45g)` instead of just `1.5 × slice`
- [ ] **No way to change the default serving** — must remove and re-add servings to reorder; should be able to mark any serving as default
- [ ] **Food immutability causes duplicate search results** — editing a food creates a new version which appears as a separate entry in search; consider only showing the latest version per food

---

## Needs Re-testing

- [x] **Barcode scanner backend flow** — all flows confirmed working on same WiFi: known barcode lookup, unknown barcode alert, Try again, Create manually
- [x] **"Edit food" link correctly hidden for non-user foods** ✓

---

## New Issues Found During Barcode Re-test

- [ ] **Manually created food is not matched when its barcode is later scanned** — if a user creates a food manually without a barcode, then later scans that product's barcode, the scanner creates a new Open Food Facts entry instead of linking to the existing manual entry. The two entries are not deduplicated.
- [ ] **No food source indicator in the UI** — Portion Screen and search results don't show where a food came from (user-created, Open Food Facts, verified); should show the source and make clear that non-user foods are not editable
