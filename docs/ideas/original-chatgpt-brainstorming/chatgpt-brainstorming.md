
Grundfilosofin:
För varje knapptryck eller user entry. Skulle detta kunna ändras till en enkel ja/nej/modify knapp?
# Calorie tracking
"Food" is the basic object that everything is based on. This has a name, potentially barcode number and contains calories and macros. A food item is entered as the item ID as well as the amount of food (grams, liters and imperial equivalent). Also handle abstract "servings" such as "slices, pieces, etc" it should be possible to define these custom units when creating a custom food.
Food objects can be grouped into "meals", for example combine bread cheese and meat for a hamburger.
Meals can be made up of even more meals. So a meal could contain a hamburger meal as well as a meal of loaded fries which both contain several food objects.
Food objects are collected from the openfoodfacts database and can also be entered manually as a custom food object. Manually entered foods are always prioritized when searching.
The application should also have its own database of verified foods that will grow over time, we can see what foods users are adding and make sure the most popular ones are correct.
Openfoodfact sourced foods should be able to be voted up or down by users to see if its actually useful. Also allow the user to upload corrections. This way we can centrally "lock" good verified foods and also replace them with out own beter entries.
Meals can be saved and reused easily.
The user can add any amount of foods or meals to a given calendar day. Exercise could also be added but this function should be somewhat basic.
The user can assign a pattern that the same foods are used for example every weekday lunch. The application should also be smart enough to suggest this whenever the user begins entering the days foods/meals.
The user should be able to set a goal for calories and macros that can easily be tracked.
Using AI (or just basic smart querying) allow the user to simply write (or speak) "2 slices white bread with ham" and the application should try to predict and add what the user wants. This should also be based on previously logged foods from this user.

Food
id
name
brand
barcode
calories_per_100g
protein_per_100g
carbs_per_100g
fat_per_100g

serving_units:
  - slice: 30g
  - piece: 50g
  - tbsp: 15g

source:
  USER
  VERIFIED
  OPENFOODFACTS
  
Priority search order:

1. user foods
    
2. verified foods
    
3. openfoodfacts


Verified Foods System
Instead of just up/down votes, use:

confidence_score

based on:

- number of uses
    
- number of corrections
    
- number of votes
    

When confidence is high → promote to verified.




Nested Meals

Example:

Meal: Lunch  
  Meal: Hamburger  
      Food: Bread  
      Food: Cheese  
      Food: Beef  
  Meal: Loaded fries  
      Food: Fries  
      Food: Bacon  
      Food: Sauce

But you must add **meal scaling**:

1x hamburger meal  
0.5x hamburger meal

Otherwise portions become annoying.



## Pattern System

Your weekday pattern idea is good.

But it should also be **automatic**.

Example:

If user logs:

Oatmeal + banana

4 mornings in a row → suggest:

> "Log your usual breakfast?"

The best systems are **implicit**, not manual.
# Weight tracking
Let the user input its weight daily
Allow the app to predict weight in between days that are not counted
Show progression if following certain calorie goal
Show progression based on current trend

Trend weight
Use a **7-day moving average**.

Daily weight is mostly noise.

Without smoothing users get confused.

# Possible features
Grocery awareness - Track regular foods and help suggest grocery shopping lists
Macro distribution guidance - "You still need: 40g protein, 15g fat" and suggest foods that are good or usually eaten by the user
Photo logging, take photo of food and get calories. Convenience over accuracy. After taking photo give an easy prompt "Is this 2 eggs? (Yes, Wrong amount, Wrong food)" and ask that for each found food item in the photo.

# Monetization
Sneaky men: Spara all data och sälj skiten, no brainer

Free tier must feel complete, otherwise users feel crippled.
Free:

- logging
    
- barcode scanning
    
- weight tracking
    
- meal saving
    
- habit suggestions
## Premium Tier

Charge for **intelligence**, not basics.

Premium:

- AI food entry
    
- macro recommendations
    
- calorie coaching
    
- advanced analytics
    
- photo logging
    
- weight prediction
    
- smart grocery lists## Premium Tier

Charge for **intelligence**, not basics.

## Price

Reasonable range:

29–59 SEK / month

or

299–399 SEK / year

Premium:

- AI food entry
    
- macro recommendations
    
- calorie coaching
    
- advanced analytics
    
- photo logging
    
- weight prediction
    
- smart grocery lists

Freemium.
Free: Calorie logging, barcode scanning, weight tracking
Premium: AI food logging, macro optimization, weight prediction, pattern automation, custom analytics
Give the user these shortcuts for free X amount of times daily/weekly to incentivize them to buy it.

Free user: Manual food entry. Premium user: Write "2 slices of bread with ham"
Coaching mode: "Goal: lose 4kg. Timeline: 4 months" app automatically adjusts calories weekly
Premium feature: Macros for cutting/bulking/maintainance

Focus on swedish and nordic foods and make everything be tracked correctly. Then expand to different regions. Focus on the EU.

# How to succeed
Main points:
Extremely fast
Extremely simple
Learns user habits


#  Weak Spots to Fix

## Food Search Will Be Your Hardest Problem

Users search like this:

bread  
milk  
protein bar

But databases contain:

Protein Bar Chocolate 55g  
High Protein Bar 60g  
Protein Snack Bar

You need:

- fuzzy search
    
- ranking by popularity
    
- ranking by user history
    

Otherwise search becomes painful.

## Barcode Scan Must Be Instant

If scanning takes:

- 0.5 seconds → feels amazing
    
- 3 seconds → feels broken
    

So cache foods locally after scanning once.

## Portion Entry Must Be Fast

Most users hate entering grams.

Better flow:

Scan milk  
→ 1 glass  
→ done

instead of:

scan  
enter grams  
confirm

O

# Feature 1 — Habit Logging

This is huge.

Most people eat **the same 5–10 meals** repeatedly.

Your app should learn this.

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

One tap.

Logging becomes **1 second**.

No major app does this well.

# Feature 2 — "Remaining Macros Assistant"

Instead of just showing totals:

Calories: 1450 / 2000  
Protein: 60 / 120

Show:

Remaining today:  
550 kcal  
60g protein  
20g fat

Then suggest:

Good options:  
• Chicken breast  
• Protein shake  
• Skyr yogurt

Example brand:

Arla

This becomes **diet guidance**, not just tracking.

Very valuable.

# Feature 3 — Fast Add System

A command-style logger.

Example:

+2 eggs  
+protein shake  
+coffee milk

Hit enter → logged.

Or voice:

two eggs and a protein shake

Power users love this.

Logging becomes **seconds instead of minutes**.

# 6. One More Feature That Could Go Viral

This one is underrated:

### “Calorie Budget Mode”

Example:

User wants pizza tonight.

App shows:

Pizza tonight = 1100 kcal  
  
Suggested day plan:  
  
Breakfast: 300 kcal  
Lunch: 500 kcal  
Dinner: Pizza

This helps people **plan**, not just track.

# 7. Technical Advice

A few architecture tips early:

### Store everything per 100g

nutrition_per_100g

Then convert to servings.

### Keep food immutable

Never modify food entries.

Instead:

food_version

This prevents macro changes from breaking old logs.

### Cache heavily

Most users reuse foods.

Local caching dramatically improves speed.

# Overall Verdict

Your concept is **already stronger than many calorie apps** because:

- nested meals
    
- habit learning
    
- verified foods
    
- AI logging
    

The biggest challenge will not be features.

It will be:

Speed  
Search quality  
Logging friction

If those are excellent, the app will feel **10× better than competitors**.

**They treat calorie tracking as data entry instead of behavior support.**

Apps like MyFitnessPal, Cronometer, and Lose It! mostly function as **nutrition spreadsheets**.

They answer:

> “What did you eat?”

But the real user problem is:

> “What should I eat next to stay on track?”

That difference is where a new app can win.

---

# The Big Opportunity: Forward Guidance

Instead of only tracking **past food**, your app should help guide **future decisions**.

Example situation:

User has eaten:

Breakfast: 450 kcal  
Lunch: 650 kcal

Goal:

2000 kcal

Most apps show:

Remaining: 900 kcal

That’s not very helpful.

Your app could show something like:

Suggested dinner:  
• Chicken + rice bowl (650 kcal)  
• Salmon + potatoes (700 kcal)  
  
You still have room for:  
• Protein snack (~200 kcal)

Now the app **actively helps the user succeed**.

---

# Even Better: Real-Time Day Planning

As the user logs food, the app dynamically adjusts the rest of the day.

Example:

User logs a big lunch:

Lunch: 1100 kcal

Instead of just saying “you ate a lot”, show:

To stay on target today:  
  
Light dinner suggestion:  
• Omelette  
• Chicken salad  
• Skyr yogurt bowl

This is **diet coaching without a human coach**.

---

# Feature Concept: “Today Strategy”

Your daily screen could look like:

Calories  
1450 / 2000  
  
Remaining  
550 kcal  
  
Suggested plan  
  
Dinner  
• Chicken + vegetables (400 kcal)  
  
Snack  
• Skyr yogurt (150 kcal)

Brands like:

Arla  
Kvarg

would naturally appear because they’re common protein sources.

This turns the app from:

**tracker → decision tool**

# Another Big Mistake: Apps Ignore Human Habits

Most people eat **very repetitive diets**.

Typical pattern:

same breakfast  
same lunch  
3–5 rotating dinners

Most apps force the user to re-enter these repeatedly.

Your habit system can fix that.

Example morning screen:

Good morning.  
  
Log your usual breakfast?  
  
☑ Coffee with milk  
☑ Oatmeal  
☑ Banana  
[Add]

Logging takes **one tap**.

This is one of the strongest retention features you can build.

# Another Huge Gap: Protein Awareness

A lot of people tracking calories actually care about:

protein intake

especially gym users.

Instead of showing just macros:

Protein: 63 / 140g

show:

You still need ~77g protein today.  
  
Easy options:  
• Chicken breast  
• Protein shake  
• Cottage cheese

You’re now **helping users hit goals**, not just measuring them.

# A Feature That Could Make the App Popular

Something very simple:

### “Lazy Mode”

User sets:

Daily calories: 2000  
Protein target: 140g

Instead of logging everything, they log **only deviations**.

Example:

Default day:

Breakfast: oatmeal  
Lunch: chicken bowl  
Dinner: salmon  
Snack: yogurt

User only logs when they eat something different.

This massively reduces logging friction.

Almost no app supports this well.

# One Growth Trick That Works

Add a **weekly summary that feels rewarding**.

Example:

This week  
  
Calorie target hit: 5 / 7 days  
Average protein: 132g  
Weight trend: -0.4 kg  
  
Great consistency.

People love streaks and progress.

# One Thing You Should NOT Overbuild Early

Photo calorie estimation.

It sounds impressive but it’s very hard to make useful.

Even big companies struggle with it.

If you add it, treat it as:

quick estimate → user confirms foods

Your prompt idea is actually good:

Detected:  
Eggs  
  
Is this correct?  
[Yes]  
[Wrong amount]  
[Wrong food]

That’s the right direction.

# The Real Competitive Advantage You Could Build

Your biggest advantage could be:

Habit learning + predictive logging

Example day:

Morning app opens:

Good morning Kevin.  
  
Your usual day:  
  
Breakfast  
☑ Coffee + milk  
☑ Oatmeal  
  
Lunch  
☑ Chicken wrap  
  
Dinner planned  
☑ Salmon bowl  
  
Expected calories: 1950

The user barely logs anything.

That’s a **huge UX improvement**.

---

# Final Honest Feedback

Your concept is already stronger than most first versions of apps because you’re focusing on:

- **data quality**
    
- **fast logging**
    
- **habit learning**
    

Those three things matter more than fancy AI.

If you execute well on:

speed  
search quality  
habit automation

your app could genuinely feel better than the big trackers.