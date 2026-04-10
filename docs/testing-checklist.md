# Manual Testing Checklist

Work through this during the Phase 3.5 end-to-end walkthrough. Check off items as you go and note anything broken or awkward.

---

## Today Screen
- [x] Opens to today's date with correct day/date label
- [x] Macro cards show 0/target on a fresh day with nothing logged
- [x] Calorie and protein targets reflect what's set in Settings (not hardcoded 2000/150)
- [x] Progress bars fill correctly as food is logged
- [x] Progress bar turns red when target is exceeded
- [x] Log items appear grouped under the correct meal slot (Breakfast, Lunch, Dinner, Snack)
- [x] Each log item shows correct food name, portion label, calories, and protein
- [x] Portion label: shows `1.5 × slice` format when a named serving is used; shows `150g` / `150ml` when using 100g base
  - **UX note:** should also show the grams per serving (e.g. `1.5 × slice (45g)`)
- [x] "Nothing logged today yet." text shows before anything is logged (and disappears after)
- [x] "+ Add Food" button navigates to Search tab
- [x] Long-pressing a log item opens the edit/delete bottom sheet
  - **UX note:** consider also adding a visible tap button so it's discoverable without knowing about long-press
- [x] Edit modal shows correct food name, current quantity, and current meal slot pre-selected
- [x] Changing quantity and saving updates the item and refreshes totals
- [x] Changing meal slot and saving moves the item to the correct section
- [x] Cancel button dismisses the modal without changes
- [x] Saving an invalid quantity (empty, 0, letters) does not submit
  - **UX note:** silently does nothing — should show a small error message or toast
- [ ] **BUG:** Delete button does NOT show confirmation alert — deletes nothing, item stays in log
- [ ] Confirming delete removes the item and refreshes totals — *blocked by bug above*

---

## Search Screen
- [~] Search input auto-focuses on open — works on first open only; should auto-focus every time the tab is visited
- [x] Typing shows a spinner then results after ~250ms debounce
- [x] Results show food name, kcal and protein per 100g/ml
- [x] Tapping a result navigates to PortionScreen
- [x] Clearing the search input returns to the recent foods state
- [x] **Recent foods**: on empty state, shows RECENT section header with previously logged foods
- [x] **Recent foods**: tapping a recent food navigates to PortionScreen
- [x] **Recent foods**: placeholder text shows only when there are no recents
- [x] **No results**: "No results for X" message appears
- [x] **No results**: prominent green "+ Create 'X'" button appears and pre-fills name in CreateFoodScreen
- [x] **Has results**: subtle "+ Create new food" button appears at bottom of list
- [x] Barcode icon is visible next to search input
- [x] Tapping barcode icon requests camera permission if not granted
- [x] Denying permission shows an alert
- [x] Granting permission opens the full-screen scanner with frame overlay and hint text
- [x] Close (✕) button dismisses the scanner
- [ ] **BUG:** Barcode scanner has no backend communication — all barcodes navigate directly to PortionScreen without checking the DB or Open Food Facts. Likely caused by the phone being unable to reach the backend API when using tunnel mode (the bundle loads via tunnel but API calls still target the local IP). The "Not found" alert, "Try again", and "Create manually" flows are therefore untested.
- **UX question — duplicate foods:** users can create identical food entries; need to decide how to handle (prevent duplicates on creation? show a warning? deduplicate in search results?)
- **UX question — two create buttons:** the subtle "Create new food" button (when results exist) and the prominent "+ Create X" button (when no results) serve the same purpose but at different points; consider whether the subtle button adds value or just adds noise — could be removed and only show the prominent one on no-results

---

## Portion Screen
- [ ] Food name and macros per 100g/ml shown in header
- [ ] "Edit food" link visible only for user-created foods (not for Open Food Facts / verified foods)
- [ ] "Edit food" link navigates to EditFoodScreen
- [ ] If food has no custom servings, serving picker section is hidden
- [ ] If food has custom servings, they are listed; default serving is pre-selected
- [ ] "100g" / "100ml" option is always available in the picker
- [ ] Tapping a serving option selects it (highlights) and deselects the previous one
- [ ] Live macro preview updates correctly when serving or quantity changes
- [ ] Quantity defaults to 1; editing it updates the preview immediately
- [ ] Meal slot defaults to Breakfast; selecting another highlights it
- [ ] Tapping "Log Food" adds the item and navigates back to Today
- [ ] Today screen immediately shows the new item with correct macros
- [ ] Entering 0 or empty quantity shows an alert and does not log

---

## Create Food Screen
- [ ] Name field auto-focuses; pre-filled with search query if navigated from "+ Create X" button
- [ ] Name field is empty if navigated from "+ Create new food" (no initial name passed)
- [ ] "Per 100g" label switches to "Per 100ml" when the liquid toggle is enabled
- [ ] Saving with empty name shows alert
- [ ] Saving with missing or invalid calories shows alert
- [ ] Protein/carbs/fat default to 0 if left blank
- [ ] Liquid toggle saves correctly (PortionScreen shows "per 100ml" for liquid foods)
- [ ] Adding a serving: entering name and grams then tapping "+ Add serving" adds it to the list
- [ ] First serving is marked "(default)" in the list
- [ ] Removing a serving: tapping Remove removes it; next serving becomes default
- [ ] Adding a serving with empty name shows alert
- [ ] Adding a serving with invalid grams shows alert
- [ ] Saving navigates directly to PortionScreen with the new food (not back to Search)
- [ ] Saved food appears in search results immediately

---

## Edit Food Screen
- [ ] All fields pre-filled with existing food values
- [ ] Existing servings load (spinner shows while loading) and appear pre-populated
- [ ] Can remove existing servings, add new ones
- [ ] Saving navigates to PortionScreen with the new food version
- [ ] Old log entries on Today screen still show the original food name/macros (immutability)
- [ ] The new version of the food appears in search results
- [ ] "Edit food" link is NOT visible on a barcode-scanned or verified food

---

## Meals Screen
- [ ] List shows all saved meals with name, item count, total kcal and protein
- [ ] Each meal card lists its food items
- [ ] Empty state "No saved meals yet." shows when none exist
- [ ] Pull-to-refresh reloads the list
- [ ] "+" button in header navigates to CreateMealScreen
- [ ] Tapping "Log" opens the bottom-sheet modal
- [ ] Modal shows the meal name, scale buttons (0.5×, 1×, 2×), macro preview, and slot selector
- [ ] Scale buttons are mutually exclusive; selected scale is highlighted
- [ ] Macro preview updates immediately when scale changes (0.5× shows half, 2× shows double)
- [ ] Slot selector defaults to Breakfast; selecting another highlights it
- [ ] Tapping "Log Meal" logs all items at the correct scale and slot; returns to list
- [ ] Today screen immediately shows the meal items under the correct slot
- [ ] At 2× scale, Today screen shows doubled quantities/macros
- [ ] At 0.5× scale, Today screen shows halved quantities/macros
- [ ] Cancel button dismisses the modal without logging

---

## Create Meal Screen
- [ ] Meal name input is present and required
- [ ] Food search is debounced; results appear with name, kcal, protein
- [ ] Tapping a search result adds it to the draft list and clears the search input
- [ ] Adding the same food twice increments its quantity instead of adding a duplicate
- [ ] − button decrements quantity (minimum 1); + button increments
- [ ] ✕ button removes the food from the draft
- [ ] "Save Meal" is disabled (greyed out) when no foods have been added
- [ ] Tapping "Save Meal" with no meal name shows alert
- [ ] Tapping "Save Meal" with a name but no foods shows alert
- [ ] Valid save navigates back to MealsScreen and the new meal appears in the list

---

## Weight Screen
- [x] Latest weight card shows the most recent entry
- [x] History list shows all previous entries
- [x] Entering a weight and tapping "Log" adds it to the list immediately
- [x] Input clears after successful log
- [ ] Pull-to-refresh reloads the history — *not tested*
- [x] Invalid inputs do not go through
  - **UX note:** silently does nothing — should show an error toast
- [x] **Weight reminder dot**: red dot on the Weight tab icon is visible when no weight logged today
- [x] **Dot clears immediately** after logging a weight

---

## Settings Screen
- [ ] Calorie and protein fields are pre-filled with current targets from the database
- [ ] Changing both targets and saving shows "Saved" confirmation alert
- [ ] Today screen macro cards immediately reflect the new targets after saving
- [ ] Entering 0 or non-numeric values shows alert and does not save
- [ ] Targets persist after app restart

---

## Cross-Cutting / Edge Cases
- [ ] App opens cold with no data — no crashes, all empty states render
- [ ] Navigating between tabs does not reset Today screen log data
- [ ] Logging a food from a barcode-scanned result works end-to-end
- [ ] A food with `liquid: true` shows "per 100ml" consistently in Search, Portion, Today, and Meals screens
- [ ] Macro math: log 100g of a food with 200 kcal/100g — Today should show exactly 200 kcal
- [ ] Macro math: log 0.5 serving of a food with a 50g custom serving — should show 25g worth of macros
