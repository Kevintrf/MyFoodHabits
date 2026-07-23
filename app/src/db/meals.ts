import { db } from './client';
import { Meal, MealItem } from '../services/api';

async function getOrCreateDayLog(date: string): Promise<number> {
  await db.runAsync('INSERT OR IGNORE INTO day_logs (user_id, date) VALUES (1, ?)', [date]);
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM day_logs WHERE user_id = 1 AND date = ?',
    [date],
  );
  return row!.id;
}

// ---------------------------------------------------------------------------
// Raw row types
// ---------------------------------------------------------------------------

interface MealRow {
  meal_id: number;
  meal_name: string;
  category: string | null;
  created_at: string;
  // item columns — nullable because of LEFT JOIN (meal with no items)
  item_id: number | null;
  food_id: number | null;
  serving_id: number | null;
  quantity: number | null;
  food_name: string | null;
  liquid: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  serving_name: string | null;
  serving_grams: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Fetch a single complete meal (with items) by id.
async function fetchMeal(id: number): Promise<Meal> {
  const rows = await db.getAllAsync<MealRow>(
    `SELECT m.id AS meal_id, m.name AS meal_name, m.category, m.created_at,
            mi.id AS item_id, mi.food_id, mi.serving_id, mi.quantity,
            f.name AS food_name, f.liquid,
            f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
            fs.name AS serving_name, fs.grams AS serving_grams
     FROM meals m
     LEFT JOIN meal_items mi ON mi.meal_id = m.id
     LEFT JOIN foods f ON mi.food_id = f.id
     LEFT JOIN food_servings fs ON mi.serving_id = fs.id
     WHERE m.id = ?
     ORDER BY mi.id`,
    [id],
  );
  if (!rows.length) throw new Error(`Meal ${id} not found`);
  return groupMealRows(rows)[0];
}

// Group flat JOIN rows into Meal objects with nested items.
function groupMealRows(rows: MealRow[]): Meal[] {
  const map = new Map<number, Meal>();

  for (const row of rows) {
    if (!map.has(row.meal_id)) {
      map.set(row.meal_id, {
        id: row.meal_id,
        name: row.meal_name,
        category: row.category,
        created_at: row.created_at,
        items: [],
      });
    }

    if (row.item_id !== null && row.food_id !== null) {
      const meal = map.get(row.meal_id)!;
      const item: MealItem = {
        id: row.item_id,
        meal_id: row.meal_id,
        food_id: row.food_id,
        food_name: row.food_name!,
        liquid: !!row.liquid,
        serving_id: row.serving_id,
        serving_name: row.serving_name,
        serving_grams: row.serving_grams,
        quantity: row.quantity!,
        calories_per_100g: row.calories_per_100g!,
        protein_per_100g: row.protein_per_100g!,
        carbs_per_100g: row.carbs_per_100g!,
        fat_per_100g: row.fat_per_100g!,
      };
      meal.items.push(item);
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getMeals(): Promise<Meal[]> {
  const rows = await db.getAllAsync<MealRow>(
    `SELECT m.id AS meal_id, m.name AS meal_name, m.category, m.created_at,
            mi.id AS item_id, mi.food_id, mi.serving_id, mi.quantity,
            f.name AS food_name, f.liquid,
            f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
            fs.name AS serving_name, fs.grams AS serving_grams
     FROM meals m
     LEFT JOIN meal_items mi ON mi.meal_id = m.id
     LEFT JOIN foods f ON mi.food_id = f.id
     LEFT JOIN food_servings fs ON mi.serving_id = fs.id
     WHERE m.user_id = 1
     ORDER BY m.created_at DESC, mi.id`,
    [],
  );
  return groupMealRows(rows);
}

export async function createMeal(data: {
  name: string;
  category?: string;
  items: { food_id: number; serving_id?: number; quantity: number }[];
}): Promise<Meal> {
  let mealId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO meals (user_id, name, category) VALUES (1, ?, ?)',
      [data.name, data.category ?? null],
    );
    mealId = result.lastInsertRowId;

    for (const item of data.items) {
      await db.runAsync(
        'INSERT INTO meal_items (meal_id, food_id, serving_id, quantity) VALUES (?, ?, ?, ?)',
        [mealId, item.food_id, item.serving_id ?? null, item.quantity ?? 1],
      );
    }
  });

  return fetchMeal(mealId);
}

export async function logMeal(
  mealId: number,
  date: string,
  meal_slot: string,
  scale = 1,
): Promise<void> {
  const mealItems = await db.getAllAsync<{ food_id: number; serving_id: number | null; quantity: number }>(
    'SELECT food_id, serving_id, quantity FROM meal_items WHERE meal_id = ?',
    [mealId],
  );

  await db.withTransactionAsync(async () => {
    const dayLogId = await getOrCreateDayLog(date);

    for (const mi of mealItems) {
      await db.runAsync(
        `INSERT INTO log_items (day_log_id, food_id, serving_id, quantity, meal_slot, logged_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [dayLogId, mi.food_id, mi.serving_id, mi.quantity * scale, meal_slot, new Date().toISOString()],
      );
    }
  });
}

export async function editMeal(
  mealId: number,
  data: {
    name?: string;
    items?: { food_id: number; serving_id?: number; quantity: number }[];
  },
): Promise<Meal> {
  await db.withTransactionAsync(async () => {
    if (data.name !== undefined) {
      await db.runAsync('UPDATE meals SET name = ? WHERE id = ?', [data.name, mealId]);
    }

    if (data.items !== undefined) {
      await db.runAsync('DELETE FROM meal_items WHERE meal_id = ?', [mealId]);
      for (const item of data.items) {
        await db.runAsync(
          'INSERT INTO meal_items (meal_id, food_id, serving_id, quantity) VALUES (?, ?, ?, ?)',
          [mealId, item.food_id, item.serving_id ?? null, item.quantity],
        );
      }
    }
  });

  return fetchMeal(mealId);
}

export async function deleteMeal(mealId: number): Promise<void> {
  // meal_items are deleted automatically via ON DELETE CASCADE
  await db.runAsync('DELETE FROM meals WHERE id = ?', [mealId]);
}
