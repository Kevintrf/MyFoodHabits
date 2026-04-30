import { db } from './client';
import { DayLog, DaySummary, LogItem } from '../services/api';
import { calcMacros, sumMacros } from './macros';

// ---------------------------------------------------------------------------
// Raw row types
// ---------------------------------------------------------------------------

interface LogItemRow {
  id: number;
  food_id: number;
  serving_id: number | null;
  quantity: number;
  meal_slot: string;
  logged_at: string;
  food_name: string;
  liquid: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_name: string | null;
  serving_grams: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Get-or-create a day_log row, return its id.
async function getOrCreateDayLog(date: string): Promise<number> {
  await db.runAsync(
    'INSERT OR IGNORE INTO day_logs (user_id, date) VALUES (1, ?)',
    [date],
  );
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM day_logs WHERE user_id = 1 AND date = ?',
    [date],
  );
  return row!.id;
}

// Fetch a complete LogItem row (with food + serving) by log_item id.
async function fetchLogItem(id: number): Promise<LogItem> {
  const row = await db.getFirstAsync<LogItemRow>(
    `SELECT li.id, li.food_id, li.serving_id, li.quantity, li.meal_slot, li.logged_at,
            f.name AS food_name, f.liquid,
            f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
            fs.name AS serving_name, fs.grams AS serving_grams
     FROM log_items li
     JOIN foods f ON li.food_id = f.id
     LEFT JOIN food_servings fs ON li.serving_id = fs.id
     WHERE li.id = ?`,
    [id],
  );
  if (!row) throw new Error(`LogItem ${id} not found`);
  return mapLogItemRow(row);
}

function mapLogItemRow(row: LogItemRow): LogItem {
  const servingGrams = row.serving_grams ?? 1;
  const macros = calcMacros(
    {
      calories_per_100g: row.calories_per_100g,
      protein_per_100g: row.protein_per_100g,
      carbs_per_100g: row.carbs_per_100g,
      fat_per_100g: row.fat_per_100g,
    },
    servingGrams,
    row.quantity,
  );
  return {
    id: row.id,
    food_id: row.food_id,
    food_name: row.food_name,
    liquid: !!row.liquid,
    serving_id: row.serving_id,
    serving_name: row.serving_name,
    serving_grams: servingGrams,
    quantity: row.quantity,
    logged_at: row.logged_at,
    macros,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getLog(date: string): Promise<DayLog> {
  const empty: DayLog = {
    date,
    totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    slots: {},
    vitamins_taken: false,
  };

  const dayLog = await db.getFirstAsync<{ id: number; vitamins_taken: number }>(
    'SELECT id, vitamins_taken FROM day_logs WHERE user_id = 1 AND date = ?',
    [date],
  );
  if (!dayLog) return empty;

  const rows = await db.getAllAsync<LogItemRow>(
    `SELECT li.id, li.food_id, li.serving_id, li.quantity, li.meal_slot, li.logged_at,
            f.name AS food_name, f.liquid,
            f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
            fs.name AS serving_name, fs.grams AS serving_grams
     FROM log_items li
     JOIN foods f ON li.food_id = f.id
     LEFT JOIN food_servings fs ON li.serving_id = fs.id
     WHERE li.day_log_id = ?
     ORDER BY li.logged_at`,
    [dayLog.id],
  );

  const slots: Record<string, LogItem[]> = {};
  const allMacros = [];

  for (const row of rows) {
    const item = mapLogItemRow(row);
    allMacros.push(item.macros);
    if (!slots[row.meal_slot]) slots[row.meal_slot] = [];
    slots[row.meal_slot].push(item);
  }

  return { date, totals: sumMacros(allMacros), slots, vitamins_taken: !!dayLog.vitamins_taken };
}

export async function setVitaminsTaken(date: string, taken: boolean): Promise<void> {
  const dayLogId = await getOrCreateDayLog(date);
  await db.runAsync(
    'UPDATE day_logs SET vitamins_taken = ? WHERE id = ?',
    [taken ? 1 : 0, dayLogId],
  );
}

export async function getMonthSummary(year: number, month: number): Promise<DaySummary[]> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad(month)}-${lastDay}`;

  const rows = await db.getAllAsync<{ date: string; calories: number }>(
    `SELECT dl.date AS date,
            ROUND(SUM(
              f.calories_per_100g
              * COALESCE(fs.grams, 1)
              / 100
              * li.quantity
            )) AS calories
     FROM day_logs dl
     JOIN log_items li ON li.day_log_id = dl.id
     JOIN foods f ON li.food_id = f.id
     LEFT JOIN food_servings fs ON li.serving_id = fs.id
     WHERE dl.user_id = 1 AND dl.date BETWEEN ? AND ?
     GROUP BY dl.date
     ORDER BY dl.date`,
    [startDate, endDate],
  );

  return rows;
}

export async function getCalorieHistory(days: number): Promise<{ date: string; calories: number }[]> {
  const rows = await db.getAllAsync<{ date: string; calories: number }>(
    `SELECT dl.date,
            ROUND(SUM(f.calories_per_100g * COALESCE(fs.grams, 1) / 100 * li.quantity)) AS calories
     FROM day_logs dl
     JOIN log_items li ON li.day_log_id = dl.id
     JOIN foods f ON li.food_id = f.id
     LEFT JOIN food_servings fs ON li.serving_id = fs.id
     WHERE dl.user_id = 1 AND dl.date >= date('now', ?)
     GROUP BY dl.date
     ORDER BY dl.date`,
    [`-${days} days`],
  );
  return rows;
}

export async function addLogItem(item: {
  date: string;
  meal_slot: string;
  food_id: number;
  serving_id?: number;
  quantity: number;
}): Promise<LogItem> {
  let logItemId = 0;

  await db.withTransactionAsync(async () => {
    const dayLogId = await getOrCreateDayLog(item.date);

    const result = await db.runAsync(
      `INSERT INTO log_items (day_log_id, food_id, serving_id, quantity, meal_slot, logged_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dayLogId,
        item.food_id,
        item.serving_id ?? null,
        item.quantity,
        item.meal_slot,
        new Date().toISOString(),
      ],
    );
    logItemId = result.lastInsertRowId;
  });

  return fetchLogItem(logItemId);
}

export async function deleteLogItem(id: number): Promise<{ deleted: boolean }> {
  const result = await db.runAsync(
    `DELETE FROM log_items
     WHERE id = ?
       AND day_log_id IN (SELECT id FROM day_logs WHERE user_id = 1)`,
    [id],
  );
  return { deleted: result.changes > 0 };
}

export async function updateLogItem(
  id: number,
  data: { quantity?: number; meal_slot?: string; serving_id?: number | null },
): Promise<LogItem> {
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.quantity !== undefined) {
    setClauses.push('quantity = ?');
    params.push(data.quantity);
  }
  if (data.meal_slot !== undefined) {
    setClauses.push('meal_slot = ?');
    params.push(data.meal_slot);
  }
  if (data.serving_id !== undefined) {
    setClauses.push('serving_id = ?');
    params.push(data.serving_id);
  }

  params.push(id);

  await db.runAsync(
    `UPDATE log_items
     SET ${setClauses.join(', ')}
     WHERE id = ?
       AND day_log_id IN (SELECT id FROM day_logs WHERE user_id = 1)`,
    params,
  );

  return fetchLogItem(id);
}
