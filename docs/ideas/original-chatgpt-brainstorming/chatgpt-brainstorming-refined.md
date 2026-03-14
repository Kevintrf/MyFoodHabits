GE CREDITS SOM GÅR MOT PREMIUM OM MAN RAPPORTERAR IN KORREKTA VÄRDEN PÅ EN PRODUKT. SKICKA IN BILD PÅ STRECKKOD, INNEHÅLL, SAMT FRAMSIDA/BILD PÅ SJÄVLA PRODUKTEN.

# Calorie Tracking App Concept

- grams
    
- liters
    
- imperial equivalent
    

Also handle abstract servings such as:

- slices
    
- pieces
    
- tbsp
    

These **custom serving units** should be definable when creating a custom food.

Example data model:

Food  
id  
name  
brand  
barcode  
calories_per_100g  
protein_per_100g  
carbs_per_100g  
fat_per_100g

Serving units:

serving_units:  
  - slice: 30g  
  - piece: 50g  
  - tbsp: 15g

Source:

source:  
  USER  
  VERIFIED  
  OPENFOODFACTS

---

## Food Data Sources

Food objects are collected from:

- Open Food Facts
    
- manually entered foods
    

Manually entered foods are **always prioritized when searching**.

Priority search order:

1. user foods
    
2. verified foods
    
3. openfoodfacts
    

---

## Verified Food Database

The application should maintain its own **verified food database**.

This database grows over time by:

- observing foods users add
    
- correcting popular entries
    
- replacing bad database entries
    

OpenFoodFacts foods should allow:

- user voting up or down
    
- user corrections
    
- submission of improved entries
    

The system can then:

- centrally **lock verified foods**
    
- replace incorrect foods with improved versions
    

Instead of just up/down votes, use:

confidence_score

based on:

- number of uses
    
- number of corrections
    
- number of votes
    

When confidence is high → promote to **verified**.

---

# Meals

Food objects can be grouped into **meals**.

Example:

Bread + cheese + meat → Hamburger

Meals can also contain **other meals**.

Example structure:

Meal: Lunch  
  Meal: Hamburger  
      Food: Bread  
      Food: Cheese  
      Food: Beef  
  Meal: Loaded fries  
      Food: Fries  
      Food: Bacon  
      Food: Sauce

Meals can be **saved and reused easily**.

Meal scaling must be supported:

1x hamburger meal  
0.5x hamburger meal

Otherwise portions become annoying.

---

# Daily Logging

The user can add **any number of foods or meals** to a calendar day.

Exercise logging can exist but should be **basic**.

---

# Pattern / Habit System

Users should be able to assign patterns:

Example:

Weekday lunch → same meal.

But the system should also learn patterns automatically.

Example:

If a user logs:

Oatmeal + banana

four mornings in a row → suggest:

> Log your usual breakfast?

The best systems are **implicit**, not manual.

---

# Habit Logging

Most people eat **the same 5–10 meals repeatedly**.

Example:

User logs:

Coffee + milk  
Protein shake

every morning.

Next morning the app shows:

Your usual breakfast:  
☑ Coffee with milk  
☑ Protein shake  
[Add]

Logging becomes **one tap**.

This dramatically reduces friction.

---
# Fast Add System

Provide a command-style logger.

Example:

+2 eggs  
+protein shake  
+coffee milk

Press enter → logged.

Voice alternative:

two eggs and a protein shake

Logging becomes **seconds instead of minutes**.

---

# AI / Smart Food Entry

Using AI or smart querying, the user can write or speak:

2 slices white bread with ham

The app should:

- predict the foods
    
- insert correct portions
    
- prefer foods the user has logged before
    

---

# Forward Guidance (Decision Support)

Instead of only showing what the user ate, the app should help guide **what to eat next**.

Example:

User has eaten:

Breakfast: 450 kcal  
Lunch: 650 kcal  
Goal: 2000 kcal

Typical apps show:

Remaining: 900 kcal

Better approach:

Suggested dinner:  
• Chicken + rice bowl (650 kcal)  
• Salmon + potatoes (700 kcal)  
  
Remaining snack:  
• Protein snack (~200 kcal)

The app becomes **diet guidance instead of a tracker**.

---

# Remaining Macro Assistant

Instead of showing totals:

Calories: 1450 / 2000  
Protein: 60 / 120

Show:

Remaining today:  
550 kcal  
60g protein  
20g fat

Then suggest foods:

- chicken breast
    
- protein shake
    
- skyr yogurt
    

Brands like:

Arla  
Kvarg

naturally fit high-protein suggestions.

---

# Calorie Budget Mode

Example scenario:

User wants pizza tonight.

The app shows:

Pizza tonight = 1100 kcal

Suggested daily plan:

Breakfast: 300 kcal  
Lunch: 500 kcal  
Dinner: Pizza

This helps users **plan the day** instead of reacting afterward.

---

# Lazy Mode

User sets default meals:

Daily calories: 2000  
Protein target: 140g

Default day:

Breakfast: oatmeal  
Lunch: chicken bowl  
Dinner: salmon  
Snack: yogurt

User only logs **when deviating from the plan**.

This drastically reduces logging effort.

---

# Weight Tracking

Users can input **daily weight**.

Features:

- predict weight between missing days
    
- show progression if following calorie goal
    
- show progression based on current trend
    

Trend weight should use:

**7-day moving average**

Daily weight fluctuates due to water, sodium, and glycogen.

Without smoothing users get confused.

---

# Possible Features

## Grocery Awareness

Track regularly eaten foods and suggest **grocery lists**.

---

## Macro Distribution Guidance

Example:

You still need:  
40g protein  
15g fat

Suggest foods commonly eaten by the user.

---

## Photo Logging

User takes a photo of food and receives calorie estimates.

Accuracy is less important than convenience.

After detection:

Is this 2 eggs?  
  
[Yes]  
[Wrong amount]  
[Wrong food]

Each detected item is confirmed quickly.

---

# Growth and Retention

## Weekly Summary

Example:

This week  
  
Calorie target hit: 5 / 7 days  
Average protein: 132g  
Weight trend: -0.4 kg  
  
Great consistency.

Progress feedback increases engagement.

---

# Weak Spots to Fix

## Food Search

Users search:

bread  
milk  
protein bar

But databases contain:

Protein Bar Chocolate 55g  
High Protein Bar 60g  
Protein Snack Bar

Required improvements:

- fuzzy search
    
- ranking by popularity
    
- ranking by user history
---
## Barcode Speed

Barcode scanning must be extremely fast.

Perceived performance:

0.5 seconds → amazing  
3 seconds → broken

Foods should be cached locally after scanning.

---

## Portion Entry

Users dislike entering grams.

Better flow:

Scan milk  
→ 1 glass  
→ done

Instead of:

scan  
enter grams  
confirm

---

# Technical Architecture

## Store Nutrition per 100g

nutrition_per_100g

Convert to servings dynamically.

---

## Food Immutability

Never modify foods.

Use versioning:

food_version

Prevents old logs from changing when macros are updated.

---

## Heavy Caching

Most users reuse foods.

Local caching dramatically improves speed.

---

# Monetization

Freemium model.

Free tier must feel **complete**, otherwise users feel crippled.

Free:

- logging
    
- barcode scanning
    
- weight tracking
    
- meal saving
    
- habit suggestions
    

---

## Premium Tier

Charge for **intelligence**, not basic functionality.

Premium features:

- AI food entry
    
- macro recommendations
    
- calorie coaching
    
- advanced analytics
    
- photo logging
    
- weight prediction
    
- smart grocery lists
    

Other premium features:

- macro optimization
    
- pattern automation
    
- custom analytics
    
- cutting / bulking / maintenance macro presets
    

Example AI entry:

Free user:

Manual entry.

Premium user:

2 slices of bread with ham

---

## Coaching Mode

Example:

Goal: lose 4 kg  
Timeline: 4 months

App automatically adjusts calorie targets weekly.

---

## Pricing

Suggested pricing:

29–59 SEK / month

or

299–399 SEK / year

---

## Alternative Monetization

Sneaky option:

Spara all data och sälj skiten

(no brainer)

---

# Market Strategy

Focus first on **Swedish and Nordic foods**.

Ensure foods from local stores are correctly tracked.

Examples:

- ICA
    
- Coop
    
- Lidl
    

Expand later to other EU regions.

---

# Core Competitive Advantage

The strongest differentiator could be:

**Habit learning + predictive logging**

Example morning screen:

Good morning.  
  
Log your usual breakfast?  
  
☑ Coffee with milk  
☑ Oatmeal  
☑ Banana  
[Add]

Or even a predicted day:

Your usual day  
  
Breakfast  
☑ Coffee + milk  
☑ Oatmeal  
  
Lunch  
☑ Chicken wrap  
  
Dinner planned  
☑ Salmon bowl  
  
Expected calories: 1950

The user barely logs anything.

This dramatically improves the experience.

---

# Final Verdict

The concept is already strong because it focuses on:

- data quality
    
- fast logging
    
- habit learning
    

These matter more than complex AI features.

If the app executes well on:

- **speed**
    
- **search quality**
    
- **habit automation**
    

it could genuinely feel **much better than existing calorie trackers**.