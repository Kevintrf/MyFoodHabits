For a solo developer the biggest frontend risk is **component chaos**. If the UI structure is messy early, everything becomes harder to maintain. The goal is **small reusable components** and a very shallow hierarchy.

Below is a **simple React structure that fits your app well**.

---

# 1. Recommended Folder Structure

Keep it simple and predictable.

src/  
  components/  
  screens/  
  hooks/  
  services/  
  types/  
  utils/

Example:

src/  
  components/  
      FoodItem.tsx  
      MacroBar.tsx  
      PortionSelector.tsx  
      MealCard.tsx  
      SearchBar.tsx  
      FoodList.tsx  
  
  screens/  
      TodayScreen.tsx  
      SearchScreen.tsx  
      PortionScreen.tsx  
      MealsScreen.tsx  
      WeightScreen.tsx  
  
  services/  
      api.ts  
      foodService.ts  
      logService.ts  
  
  hooks/  
      useFoodSearch.ts  
      useDailyLog.ts  
  
  types/  
      food.ts  
      meal.ts  
      log.ts

This keeps the project **very readable**.

---

# 2. Core Screens

Your entire app can start with **5 screens**.

### Today Screen

Main dashboard.

TodayScreen  
 ├ MacroBar  
 ├ FoodList  
 ├ SuggestionCard  
 └ AddFoodButton

---

### Search Screen

SearchScreen  
 ├ SearchBar  
 ├ RecentFoods  
 ├ PopularFoods  
 └ FoodList

---

### Portion Screen

PortionScreen  
 ├ FoodInfo  
 ├ PortionSelector  
 └ AddButton

---

### Meals Screen

MealsScreen  
 ├ MealCard  
 └ CreateMealButton

---

### Weight Screen

WeightScreen  
 ├ WeightInput  
 ├ WeightHistory  
 └ WeightChart

---

# 3. Example Component Breakdown

## FoodItem Component

Used everywhere.

FoodItem  
 ├ name  
 ├ calories  
 ├ protein  
 └ onClick

Example React component:

function FoodItem({ food, onSelect }) {  
  return (  
    <div className="food-item" onClick={() => onSelect(food)}>  
      <div>{food.name}</div>  
      <div>{food.calories_per_100g} kcal / 100g</div>  
      <div>{food.protein_per_100g}g protein</div>  
    </div>  
  )  
}

Reusable in:

- search results
    
- recent foods
    
- meal creation
    

---

# 4. PortionSelector Component

Handles portion logic.

PortionSelector  
 ├ serving buttons  
 ├ custom input  
 └ confirm

Example UI:

Chicken breast  
  
Choose portion  
  
[100g] [150g] [200g]  
[1 piece] [2 pieces]  
  
Custom: [___] g

React structure:

function PortionSelector({ servings, onSelect }) {  
  return (  
    <div>  
      {servings.map(s => (  
        <button onClick={() => onSelect(s.grams)}>  
          {s.label}  
        </button>  
      ))}  
    </div>  
  )  
}

---

# 5. MacroBar Component

Shows calorie progress.

MacroBar  
 ├ calories  
 ├ protein  
 └ progress bars

Example UI:

Calories  
1450 / 2000  
  
Protein  
82 / 140g

React example:

function MacroBar({ calories, target }) {  
  const percent = calories / target * 100  
  
  return (  
    <div>  
      <div>{calories} / {target} kcal</div>  
      <progress value={percent} max="100"/>  
    </div>  
  )  
}

---

# 6. FoodList Component

Displays a list of foods.

FoodList  
 └ FoodItem[]

function FoodList({ foods, onSelect }) {  
  return (  
    <div>  
      {foods.map(food => (  
        <FoodItem  
          key={food.id}  
          food={food}  
          onSelect={onSelect}  
        />  
      ))}  
    </div>  
  )  
}

Reusable everywhere.

---

# 7. API Service Layer

Keep API logic outside components.

Example:

services/  
  api.ts  
  foodService.ts  
  logService.ts

Example service:

export async function searchFoods(query) {  
  const res = await fetch(`/api/foods/search?q=${query}`)  
  return res.json()  
}

Then in a hook:

function useFoodSearch(query) {  
  const [foods, setFoods] = useState([])  
  
  useEffect(() => {  
    searchFoods(query).then(setFoods)  
  }, [query])  
  
  return foods  
}

---

# 8. State Management

Do **not** introduce Redux or heavy state libraries early.

Use:

React state  
React context (if needed)

Example global state:

User  
Daily log

Everything else can stay local.

---

# 9. Suggested Routing

/  
→ TodayScreen  
  
/search  
→ SearchScreen  
  
/portion/:foodId  
→ PortionScreen  
  
/meals  
→ MealsScreen  
  
/weight  
→ WeightScreen

Simple and predictable.

---

# 10. Example Development Order

Build UI in this order:

1. TodayScreen
    
2. Food search
    
3. Portion selector
    
4. Logging flow
    
5. Saved meals
    
6. Weight screen
    

That gets you a **working app quickly**.

---

# 11. Performance Tip

Search should **not fire every keystroke**.

Use debounce.

Example:

debounce 250ms

This prevents backend overload.

---

# 12. Biggest Frontend Mistake to Avoid

Do not make components too big.

Bad:

TodayScreen = 1500 lines

Good:

TodayScreen  
 ├ MacroBar  
 ├ FoodList  
 ├ SuggestionCard

Small components = easier iteration.

---

# Final Advice

If you keep:

5 screens  
~15 components  
simple API layer

your frontend will remain manageable even as the app grows.

---

If you want, I can also show you **a very simple database schema diagram for your app (foods → meals → logs)** that will help prevent future schema problems.