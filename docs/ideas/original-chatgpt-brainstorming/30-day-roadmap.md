Below is a **realistic 30-day roadmap for a solo developer** to reach a **working SLC (simple/lean concept)**. The goal is not perfection — the goal is **a usable product quickly**.

Key rule for the entire month:

**Always keep the app runnable.**  
Every few days you should have a working version.

---

# Goal of the 30 Days

By day 30 a user should be able to:

1. search for a food
    
2. add food to today
    
3. see calories/macros
    
4. save meals
    
5. scan barcode
    
6. log weight
    

Everything else is optional.

---

# Week 1 — Core Data + Basic Backend

Goal: **solid foundation and working API**

Do not build UI yet.

---

## Day 1 — Project Setup

Create project structure.

Backend

- framework setup
    
- database connection
    

Example stack:

Backend

- FastAPI / Node Express
    

Database

- PostgreSQL
    

Create repo and basic structure.

backend/  
frontend/  
database/

---

## Day 2 — Database Schema

Create the core tables.

foods  
food_servings  
meals  
meal_items  
day_logs  
log_items  
weights

Implement migrations.

Insert a few **test foods manually**.

Example:

Egg  
Bread  
Milk  
Chicken breast  
Rice

You want test data early.

---

## Day 3 — Food API

Implement:

GET /foods/search?q=  
POST /foods  
GET /foods/:id

Basic search using:

ILIKE '%query%'

No optimization yet.

---

## Day 4 — Logging API

Implement endpoints:

POST /log  
GET /log/:date

User should be able to:

add food  
specify grams  
save to date

---

## Day 5 — Macro Calculation

Implement calorie + macro calculation.

When requesting a day log:

Return:

foods  
total calories  
total protein  
total carbs  
total fat

---

## Day 6 — Meal System

Create:

POST /meal  
POST /meal/add_food  
GET /meals

Meals should store:

meal name  
foods  
grams

---

## Day 7 — Testing

Use Postman or curl.

Verify full flow:

create food  
search food  
log food  
create meal  
log meal

At the end of week 1 you have a **working calorie tracking backend**.

---

# Week 2 — Basic Frontend

Goal: **usable interface**

Focus on simplicity.

---

## Day 8 — Frontend Setup

Create frontend project.

Options:

- React
    
- Next.js
    
- simple SPA
    

Add API connection layer.

---

## Day 9 — Food Search UI

Build a page:

Search food

Features:

- search input
    
- list results
    
- select food
    

---

## Day 10 — Food Logging UI

When selecting food:

Show portion entry:

grams input  
add button

Logging flow:

search → select → enter amount → add

---

## Day 11 — Today Page

Create a **daily log page**.

Display:

foods eaten today  
calories  
protein  
carbs  
fat

Allow removing items.

---

## Day 12 — Meal Creation UI

Allow user to:

create meal  
add foods  
save meal

Very simple UI.

---

## Day 13 — Meal Logging

Add button:

Add meal

User selects saved meal → logs it.

---

## Day 14 — UI Cleanup

Improve UX slightly:

- faster search
    
- nicer list layout
    
- basic loading states
    

At end of week 2 you have a **functional calorie tracker**.

---

# Week 3 — Features That Make It Useful

Goal: **reduce logging friction**

---

## Day 15 — Weight Tracking

Create:

weight entry screen  
weight history graph

Basic features:

enter weight  
show list

Graph optional but nice.

---

## Day 16 — Serving Units

Add serving selection:

Example:

1 slice  
2 slices  
grams

Convert to grams internally.

---

## Day 17 — Barcode Scanning

Implement scanning.

Flow:

scan barcode  
→ lookup food  
→ add

If food not found:

create new food

Later you can connect to:

Open Food Facts

---

## Day 18 — Recently Used Foods

Create a **recent foods list**.

Most users eat the same foods.

Show:

Recent foods

at top of search.

This massively improves usability.

---

## Day 19 — Meal Scaling

Allow:

0.5 meal  
1 meal  
2 meals

Instead of editing each food.

---

## Day 20 — Performance Improvements

Add:

- local caching
    
- faster search
    
- debounce search input
    

Make logging feel **instant**.

---

## Day 21 — Internal Testing

Use the app yourself for several days.

Log real meals.

You will discover many problems.

Fix those.

---

# Week 4 — Differentiating Features

Goal: **make the app smarter**

---

## Day 22 — Remaining Calories

Display:

Calories remaining  
Protein remaining

Example:

Remaining today:  
600 kcal  
70g protein

---

## Day 23 — Habit Detection

Detect repeated meals.

Example logic:

if same foods logged 4 times  
→ suggest

Prompt:

Log usual breakfast?

---

## Day 24 — Quick Add Commands

Add simple command parser.

Example input:

+2 eggs  
+coffee milk

Parse and log.

---

## Day 25 — Day Summary

Show daily summary:

calories  
macros  
foods

Cleaner overview.

---

## Day 26 — Weekly Summary

Add weekly stats.

Example:

calorie target hit: 5/7  
avg protein: 120g  
weight trend

---

## Day 27 — Food Creation UX

Improve:

add custom food  
add servings  
add barcode

Make it quick.

---

## Day 28 — Bug Fixing

Focus on:

- logging speed
    
- search issues
    
- UI bugs
    

---

## Day 29 — Polish

Small improvements:

- keyboard shortcuts
    
- faster input
    
- nicer layout
    

---

## Day 30 — First Real Version

At this point you have:

✔ food search  
✔ calorie tracking  
✔ saved meals  
✔ barcode scanning  
✔ weight tracking  
✔ macro totals  
✔ habit suggestions

That is **already a competitive MVP**.

---

# What You Should NOT Build in the First 30 Days

Avoid these time sinks:

- AI photo calorie detection
    
- complex AI parsing
    
- voting systems
    
- verified food moderation
    
- grocery suggestions
    
- advanced coaching
    

Build them **after users exist**.

---

# Final Advice for a Solo Developer

Your biggest advantages are:

- speed
    
- focus
    
- iteration
    

Your biggest risk is:

**overbuilding before learning what users need.**

Ship early.

Use the app yourself daily.

Fix the friction you feel.

That alone will guide development better than planning.

---

If you want, I can also show you **the 5 design decisions that will make or break the usability of this app** (they’re small but extremely impactful).