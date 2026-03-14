# 1. Start With the Data Model (Database First)

Your entire app revolves around **food → meals → logs**, so you should design this first.

If the schema is wrong, everything becomes painful later.

Start with **a very small schema**.

### Tables (SLC version)

**foods**

id  
name  
brand  
barcode  
calories_per_100g  
protein_per_100g  
carbs_per_100g  
fat_per_100g  
source (USER / OFF / VERIFIED)  
created_at
(HA OCKSÅ EN VERSION FÖR VARJE FOOD SÅ IFALL VI ÄNDRAR DEN KAN FOLK BEHÅLLA SIN GAMLA OCH INTE BLI ARGA PÅ ATT VI ÄNDRARD DERAS DATA)

**food_servings**

id  
food_id  
name (slice, piece, tbsp)  
grams

**meals**

id  
name  
created_by_user

**meal_items**

id  
meal_id  
food_id  
grams

**day_logs**

id  
user_id  
date

**log_items**

id  
day_log_id  
food_id  
grams  
meal_id (nullable)

**weights**

id  
user_id  
date  
weight

That’s enough to build **80% of the product**.

Do **not** build:

- habit system
    
- verified foods
    
- voting system
    
- AI
    
- grocery features
    

yet.

---

# 2. Build Backend Next

You want a **thin API** over the database.

Your backend only needs a few endpoints initially.

### Required API endpoints

GET /foods/search?q=  
POST /foods  
GET /foods/barcode/:code  
  
POST /log  
GET /log/:date  
  
POST /meal  
GET /meals  
POST /meal/add_food  
  
POST /weight  
GET /weights

That’s enough for the first usable version.

---

# 3. Then Build the Frontend

Now you can build UI around those endpoints.

Your first UI should only support **4 actions**:

### 1. Search food

### 2. Log food

### 3. View today calories

### 4. Enter weight

That’s it.

If the user can do those things smoothly, you already have a usable product.

---

# 4. The First Real Feature You Should Complete

Do **not** start with AI or photo scanning.

The **first killer feature** should be:

### Fast Food Logging

The flow should be:

Search food  
→ choose food  
→ select portion  
→ add

Time goal:

**< 3 seconds**

This determines if people will keep using the app.

---

# 5. Second Feature: Saved Meals

After basic logging works, build:

### Saved Meals

Example:

Chicken + rice + sauce

User saves it.

Then logs later with:

Add meal → Chicken rice bowl

This drastically speeds up logging.

---

# 6. Third Feature: Barcode Scanning

Barcode scanning is extremely high value.

Use:

- camera scan
    
- lookup barcode
    
- show food
    
- log
    

If not found:

Create new food

Later you can connect to:

Open Food Facts

---

# 7. Fourth Feature: Habit Suggestions

Only after you have real usage data.

Example:

You logged oatmeal 5 mornings.  
  
Log usual breakfast?

This requires **historical logs**, so build it later.

---

# 8. Fifth Feature: Remaining Macros

Show:

Calories remaining  
Protein remaining

Then optionally suggest foods.

---

# 9. Sixth Feature: Natural Language Logging

Example:

2 eggs and toast

This is powerful but **not required for MVP**.

---

# 10. Things You Should Delay

As a solo developer these are **huge time sinks**.

Delay:

- photo calorie estimation
    
- AI meal recognition
    
- community voting
    
- verified food moderation
    
- grocery suggestions
    
- advanced analytics
    
- coaching mode
    

Build these **only after users exist**.

---

# 11. Ideal Tech Stack for a Solo Dev

You want **minimal complexity**.

Example stack:

Backend

- Python (FastAPI) or Node (Express)
    

Database

- PostgreSQL
    

Frontend
    
- React Native if you want mobile
    

Barcode scanning

- device camera library
    

Hosting

- single VPS initially
    

---

# 12. Your SLC Milestone

Your **first milestone** should be this:

A user can:

1 search food  
2 log food  
3 see daily calories  
4 save meals  
5 log weight

If that works smoothly, you already have a **functional calorie tracker**.

---

# 13. The Biggest Mistake Solo Devs Make

They build **infrastructure instead of user experience**.

Avoid spending weeks on:

- authentication systems
    
- microservices
    
- complex AI
    
- optimization
    

Instead focus on:

food search  
fast logging  
simple UI

That’s what users actually feel.

---

# 14. The Real MVP Goal

Your SLC should allow this scenario:

User opens app.

Search: eggs  
+2 eggs  
  
Search: bread  
+2 slices

Total time:

**5 seconds**

If you achieve that, you’re already beating many existing apps.

---

If you want, I can also show you **a very efficient development roadmap for the first 30 days** of building this app solo. It would break the work into small steps so you always have a working version.