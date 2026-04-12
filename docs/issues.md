# Issues & Improvements

Found during Phase 3.5 walkthrough. Work through these before moving to Phase 4.

---

## Bugs (broken behaviour)

- [x] **Delete log item** — confirmed working on device; was failing in browser due to Alert not working on web (fixed by cross-platform alert wrapper)
- [x] **Meals list does not auto-refresh after creating a meal** — fixed with useFocusEffect to see the new meal
- [x] **Liquid foods show "g" instead of "ml"** — fixed in Create Food, Edit Food, Portion Screen, and Meals Screen

---

## Missing Features

- [x] **No way to delete or edit a saved meal** — EditMealScreen added; tap a meal card to open it
- [ ] **Meal items only support 100g base quantity** — no way to set a custom serving or gram amount per food when building a meal
- [x] **No accessible entry point to create a food** — added "+" button in Search screen header; removed the inline create buttons from results list
- [ ] **Logging 0 quantity is blocked** — should be allowed (e.g. to track that you had something without knowing the exact amount); currently silently does nothing
- [ ] **Saving a food with 0 calories is blocked** — should be allowed, but warn the user before proceeding (e.g. "Calories are 0 — continue?")

---

## UX Improvements

- [ ] **Search input only auto-focuses on the first visit** — should auto-focus every time the Search tab is opened
- [ ] **Edit/delete log item requires long-press** — not discoverable; consider adding a visible edit icon or making items tappable
- [ ] **Invalid inputs fail silently** — entering an invalid quantity (Portion Screen), invalid weight (Weight Screen), or invalid food values (Create Food) gives no feedback; add a brief error toast
- [x] **Serving label in Today log should include grams** — now shows e.g. `1.5 × slice (45g)`
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
