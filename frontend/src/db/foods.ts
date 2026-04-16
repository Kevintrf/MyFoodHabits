import { db } from './client';
import { Food, FoodWithServings, FoodServing, FoodSource, ServingDraft } from '../services/api';

// ---------------------------------------------------------------------------
// Raw row types (SQLite returns INTEGER for booleans, not true/false)
// ---------------------------------------------------------------------------

interface FoodRow {
  id: number;
  name: string;
  barcode: string | null;
  liquid: number;
  source: string;
  created_by_user_id: number | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  created_at?: string;
  version?: number;
}

interface ServingRow {
  id: number;
  food_id: number;
  name: string;
  grams: number;
  is_default: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    liquid: !!row.liquid,
    source: row.source as FoodSource,
    created_by_user_id: row.created_by_user_id,
    calories_per_100g: row.calories_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
  };
}

function mapServing(row: ServingRow): FoodServing {
  return {
    id: row.id,
    food_id: row.food_id,
    name: row.name,
    grams: row.grams,
    is_default: !!row.is_default,
  };
}

async function getServingsForFood(foodId: number): Promise<FoodServing[]> {
  const rows = await db.getAllAsync<ServingRow>(
    'SELECT id, food_id, name, grams, is_default FROM food_servings WHERE food_id = ? ORDER BY is_default DESC, id',
    [foodId],
  );
  return rows.map(mapServing);
}

// ---------------------------------------------------------------------------
// Public API — signatures match frontend/src/services/api.ts exactly
// ---------------------------------------------------------------------------

export async function searchFoods(q: string): Promise<Food[]> {
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT id, name, barcode, liquid, source, created_by_user_id,
            calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
     FROM foods
     WHERE name LIKE ?
     ORDER BY name
     LIMIT 20`,
    [`%${q}%`],
  );
  return rows.map(mapFood);
}

export async function getFoodById(id: number): Promise<FoodWithServings> {
  const row = await db.getFirstAsync<FoodRow>(
    `SELECT id, name, barcode, liquid, source, created_by_user_id,
            calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_at
     FROM foods WHERE id = ?`,
    [id],
  );
  if (!row) throw new Error(`Food ${id} not found`);
  return { ...mapFood(row), servings: await getServingsForFood(id) };
}

// Checks local DB only. OFI fallback is added in the barcode task (task 4).
// Throws Error('BARCODE_NOT_FOUND') when not cached locally.
export async function getFoodByBarcode(barcode: string): Promise<Food> {
  const row = await db.getFirstAsync<FoodRow>(
    `SELECT id, name, barcode, liquid, source, created_by_user_id,
            calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
     FROM foods WHERE barcode = ? ORDER BY version DESC LIMIT 1`,
    [barcode],
  );
  if (!row) throw new Error('BARCODE_NOT_FOUND');
  return mapFood(row);
}

export async function getRecentFoods(): Promise<Food[]> {
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT f.id, f.name, f.barcode, f.liquid, f.source, f.created_by_user_id,
            f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g
     FROM foods f
     JOIN (
       SELECT li.food_id, MAX(li.logged_at) AS last_logged
       FROM log_items li
       JOIN day_logs dl ON li.day_log_id = dl.id
       WHERE dl.user_id = 1
       GROUP BY li.food_id
     ) recent ON recent.food_id = f.id
     ORDER BY recent.last_logged DESC
     LIMIT 10`,
    [],
  );
  return rows.map(mapFood);
}

export async function createFood(data: {
  name: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  liquid?: boolean;
  servings?: ServingDraft[];
}): Promise<Food> {
  let foodId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO foods
         (name, barcode, liquid, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          created_by_user_id, source, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'USER', 1)`,
      [
        data.name,
        data.barcode ?? null,
        data.liquid ? 1 : 0,
        data.calories_per_100g,
        data.protein_per_100g ?? 0,
        data.carbs_per_100g ?? 0,
        data.fat_per_100g ?? 0,
      ],
    );
    foodId = result.lastInsertRowId;

    for (const s of data.servings ?? []) {
      await db.runAsync(
        'INSERT INTO food_servings (food_id, name, grams, is_default) VALUES (?, ?, ?, ?)',
        [foodId, s.name, s.grams, s.is_default ? 1 : 0],
      );
    }
  });

  const row = await db.getFirstAsync<FoodRow>('SELECT * FROM foods WHERE id = ?', [foodId]);
  return mapFood(row!);
}

export async function editFood(
  id: number,
  data: {
    name: string;
    calories_per_100g: number;
    protein_per_100g?: number;
    carbs_per_100g?: number;
    fat_per_100g?: number;
    liquid?: boolean;
    servings?: ServingDraft[];
  },
): Promise<Food> {
  const existing = await db.getFirstAsync<FoodRow>('SELECT * FROM foods WHERE id = ?', [id]);
  if (!existing) throw new Error(`Food ${id} not found`);

  let newFoodId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO foods
         (name, barcode, liquid, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          created_by_user_id, source, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'USER', ?)`,
      [
        data.name,
        existing.barcode,
        data.liquid !== undefined ? (data.liquid ? 1 : 0) : existing.liquid,
        data.calories_per_100g,
        data.protein_per_100g ?? 0,
        data.carbs_per_100g ?? 0,
        data.fat_per_100g ?? 0,
        (existing.version ?? 1) + 1,
      ],
    );
    newFoodId = result.lastInsertRowId;

    for (const s of data.servings ?? []) {
      await db.runAsync(
        'INSERT INTO food_servings (food_id, name, grams, is_default) VALUES (?, ?, ?, ?)',
        [newFoodId, s.name, s.grams, s.is_default ? 1 : 0],
      );
    }
  });

  const row = await db.getFirstAsync<FoodRow>('SELECT * FROM foods WHERE id = ?', [newFoodId]);
  return mapFood(row!);
}
