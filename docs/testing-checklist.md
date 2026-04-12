# Manual Testing Checklist

> **Walkthrough completed** — Phase 3.5, 2026-04-12. All actionable findings have been moved to [issues.md](issues.md). This file is kept as a record of what was tested and what the results were.

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
- [ ] **Needs re-test on same WiFi (no tunnel):** Barcode scanner backend communication — scanning a known barcode should look up DB / Open Food Facts and navigate to PortionScreen with the correct food
- [ ] **Needs re-test on same WiFi (no tunnel):** Scanning an unknown barcode shows "Not found" alert with three options: Create manually, Try again, Cancel
- [ ] **Needs re-test on same WiFi (no tunnel):** "Try again" re-opens the scanner
- [ ] **Needs re-test on same WiFi (no tunnel):** "Create manually" navigates to CreateFoodScreen with blank name
  - *Root cause: tunnel mode serves the bundle via ngrok but API calls still target the local IP, which the phone can't reach from outside the network*
- **UX question — duplicate foods:** users can create identical food entries; need to decide how to handle (prevent duplicates on creation? show a warning? deduplicate in search results?)
- **UX question — two create buttons:** the subtle "Create new food" button (when results exist) and the prominent "+ Create X" button (when no results) serve the same purpose but at different points; consider whether the subtle button adds value or just adds noise — could be removed and only show the prominent one on no-results

---

## Portion Screen
- [x] Food name and macros per 100g/ml shown in header
- [ ] "Edit food" link visible only for user-created foods (not for Open Food Facts / verified foods) — *needs re-test with a barcode-scanned food*
- [x] "Edit food" link navigates to EditFoodScreen
- [x] If food has no custom servings, serving picker section is hidden
- [x] If food has custom servings, they are listed; default serving is pre-selected
- [x] "100g" / "100ml" option is always available in the picker
- [x] Tapping a serving option selects it (highlights) and deselects the previous one
- [x] Live macro preview updates correctly when serving or quantity changes
- [x] Quantity defaults to 1; editing it updates the preview immediately
- [x] Meal slot defaults to Breakfast; selecting another highlights it
- [x] Tapping "Log Food" adds the item and navigates back to Today
- [x] Today screen immediately shows the new item with correct macros
- [ ] Entering 0 or empty quantity — silently does nothing; **design decision: allow logging 0g** (e.g. to track that you had something without knowing the exact amount) — currently blocked; needs code change to permit it

---

## Create Food Screen
- [x] Name field auto-focuses; pre-filled with search query if navigated from "+ Create X" button
- [ ] Name field is empty if navigated from "+ Create new food" — **UX issue:** the subtle "+ Create new food" button at the bottom of search results does not appear; needs a more accessible entry point — add a "+" button in the Search screen header (same pattern as Meals)
- [x] "Per 100g" label switches to "Per 100ml" when the liquid toggle is enabled in the form
  - **BUG:** PortionScreen and serving picker still show "g" instead of "ml" for liquid foods
- [x] Saving with empty name does not save
  - **Note:** alerts work on phone but not in browser — investigate alert compatibility separately
- [x] Saving with missing or invalid calories does not save
  - **Design decision:** allow saving with 0 or negative calories (creative use cases), but warn the user before proceeding
- [x] Protein/carbs/fat default to 0 if left blank
  - **Design decision:** saving with 0 macros should be allowed (tied to above)
- [x] Adding a serving works; first serving is marked "(default)"
  - **UX improvement:** add ability to change which serving is default without removing and re-adding
  - **UX improvement:** always show a non-removable 100g/ml base option in PortionScreen, or auto-restore it if all custom servings are removed
- [x] Removing a serving removes it; next serving becomes default
- [x] Adding a serving with invalid grams shows alert
- [x] Saving navigates directly to PortionScreen with the new food
- [x] Saved food appears in search results immediately

---

## Edit Food Screen
- [x] All fields pre-filled with existing food values
- [x] Existing servings load (spinner shows while loading) and appear pre-populated
- [x] Can remove existing servings, add new ones
- [x] Saving navigates to PortionScreen with the new food version
- [x] Old log entries on Today screen still show the original food name/macros (immutability)
  - **Design question:** food immutability (edits create a new version) is technically correct but may be surprising to users who expect an edit to update the food globally. Consider whether to communicate this in the UI (e.g. "Changes won't affect previous log entries") or reconsider the approach in Phase 3.5.
- [x] The new version of the food appears in search results as a separate entry
  - **Related to above:** this will cause duplicates in search over time if users edit foods repeatedly. May want to only show the latest version per food name/barcode.
- [ ] "Edit food" link is NOT visible on a barcode-scanned or verified food — *needs re-test once barcode backend is working*

---

## Meals Screen
- [x] List shows all saved meals with name, item count, total kcal and protein
  - **BUG:** list does not auto-refresh after creating a meal — must pull-to-refresh manually
- [x] Each meal card lists its food items
- [x] Empty state "No saved meals yet." shows when none exist
- [x] Pull-to-refresh reloads the list (workaround for above bug)
- [x] "+" button in header navigates to CreateMealScreen
- [x] Tapping "Log" opens the bottom-sheet modal
  - **UX note:** this modal is well-received — consider using the same pattern elsewhere (e.g. edit log item)
- [x] Modal shows the meal name, scale buttons (0.5×, 1×, 2×), macro preview, and slot selector
- [x] Scale buttons are mutually exclusive; selected scale is highlighted
- [x] Macro preview updates immediately when scale changes
- [x] Slot selector defaults to Breakfast; selecting another highlights it
- [x] Tapping "Log Meal" logs all items at correct scale and slot; returns to list
  - **Future improvement:** show the meal as a named unit in Today's log (e.g. "My Breakfast × 1") rather than individual food items
- [x] Today screen immediately shows the meal items under the correct slot
- [x] At 2× scale, Today screen shows doubled quantities/macros
- [x] At 0.5× scale, Today screen shows halved quantities/macros
- [x] Cancel button dismisses the modal without logging
- **Missing feature:** meal items only support the 100g base quantity — should support custom servings and gram/ml amounts
- **Missing feature:** no way to remove or edit an existing meal

---

## Create Meal Screen
- [x] Meal name input is present and required
- [x] Food search is debounced; results appear with name, kcal, protein
- [x] Tapping a search result adds it to the draft list and clears the search input
- [x] Adding the same food twice increments its quantity instead of adding a duplicate
- [x] − button decrements quantity (minimum 1); + button increments
- [x] ✕ button removes the food from the draft
- [x] "Save Meal" is disabled (greyed out) when no foods have been added
- [x] Tapping "Save Meal" with no meal name shows alert
- [x] "Save Meal" with a name but no foods — button is disabled so never reached; working correctly
- [x] Valid save navigates back to MealsScreen and the new meal appears in the list

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
- [x] Calorie and protein fields are pre-filled with current targets from the database
- [x] Changing both targets and saving shows "Saved" confirmation alert — *alert works on phone, not browser (known)*
- [x] Today screen macro cards immediately reflect the new targets after saving
- [x] Entering 0 or non-numeric values does not save
- [x] Targets persist after app restart

---

## Cross-Cutting / Edge Cases
- [ ] App opens cold with no data — no crashes, all empty states render — *cannot test (existing data in DB)*
- [x] Navigating between tabs does not reset Today screen log data
- [ ] Logging a food from a barcode-scanned result works end-to-end — *needs re-test once barcode backend works on same WiFi*
- [ ] **BUG:** `liquid: true` foods show "g" instead of "ml" in multiple places:
  - Create Food: serving input hint text still says "grams" when liquid toggle is on
  - Portion Screen: custom servings still show "g" in the picker
  - Meals Screen: food quantities show "g" instead of "ml"
- [x] Macro math: 100g of 200 kcal/100g food shows exactly 200 kcal ✓
- [x] Macro math: 0.5 × 50g custom serving shows 25g worth of macros ✓
