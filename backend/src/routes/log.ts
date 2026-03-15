import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db/client';
import { calcMacros, sumMacros, MacroResult } from '../lib/macros';

const router = Router();

// POST /log
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const { user_id = 1, date, meal_slot, food_id, serving_id, quantity = 1 } = req.body;

    if (!date || !meal_slot || !food_id) {
      return res.status(400).json({ error: 'date, meal_slot, and food_id required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create day_log for this user+date
      const { rows: [dayLog] } = await client.query(
        `INSERT INTO day_logs (user_id, date) VALUES ($1, $2)
         ON CONFLICT (user_id, date) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id`,
        [user_id, date],
      );

      const { rows: [food] } = await client.query('SELECT * FROM foods WHERE id = $1', [food_id]);
      if (!food) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'food not found' });
      }

      let servingGrams = 100;
      let serving = null;
      if (serving_id) {
        const { rows: [s] } = await client.query(
          'SELECT * FROM food_servings WHERE id = $1 AND food_id = $2',
          [serving_id, food_id],
        );
        if (s) {
          serving = s;
          servingGrams = parseFloat(s.grams);
        }
      }

      const { rows: [item] } = await client.query(
        `INSERT INTO log_items (day_log_id, food_id, serving_id, quantity, meal_slot)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [dayLog.id, food_id, serving_id ?? null, quantity, meal_slot],
      );

      await client.query('COMMIT');

      const macros = calcMacros(food, servingGrams, parseFloat(quantity));
      return res.status(201).json({ ...item, food, serving, macros });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// GET /log/:date?user_id=1
router.get('/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const { date } = req.params;
    const user_id = req.query.user_id ?? 1;

    const { rows: [dayLog] } = await pool.query(
      'SELECT * FROM day_logs WHERE user_id = $1 AND date = $2',
      [user_id, date],
    );

    if (!dayLog) {
      return res.json({ date, totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, slots: {} });
    }

    const { rows: items } = await pool.query(
      `SELECT li.*,
              f.name AS food_name, f.liquid,
              f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
              fs.name AS serving_name, fs.grams AS serving_grams
       FROM log_items li
       JOIN foods f ON li.food_id = f.id
       LEFT JOIN food_servings fs ON li.serving_id = fs.id
       WHERE li.day_log_id = $1
       ORDER BY li.logged_at`,
      [dayLog.id],
    );

    const slots: Record<string, unknown[]> = {};
    const allMacros: MacroResult[] = [];

    for (const item of items) {
      const servingGrams = item.serving_grams ? parseFloat(item.serving_grams) : 100;
      const macros = calcMacros(
        {
          calories_per_100g: parseFloat(item.calories_per_100g),
          protein_per_100g: parseFloat(item.protein_per_100g),
          carbs_per_100g: parseFloat(item.carbs_per_100g),
          fat_per_100g: parseFloat(item.fat_per_100g),
        },
        servingGrams,
        parseFloat(item.quantity),
      );

      allMacros.push(macros);

      if (!slots[item.meal_slot]) slots[item.meal_slot] = [];
      slots[item.meal_slot].push({
        id: item.id,
        food_id: item.food_id,
        food_name: item.food_name,
        liquid: item.liquid,
        serving_id: item.serving_id,
        serving_name: item.serving_name ?? null,
        serving_grams: servingGrams,
        quantity: parseFloat(item.quantity),
        logged_at: item.logged_at,
        macros,
      });
    }

    return res.json({ date, totals: sumMacros(allMacros), slots });
  } catch (err) {
    next(err);
  }
});

// DELETE /log/items/:id
router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const user_id = 1;
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM log_items
       WHERE id = $1
         AND day_log_id IN (SELECT id FROM day_logs WHERE user_id = $2)`,
      [id, user_id],
    );

    if (rowCount === 0) return res.status(404).json({ error: 'log item not found' });
    return res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /log/items/:id
router.patch('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const user_id = 1;
    const { id } = req.params;
    const { quantity, meal_slot } = req.body;

    if (quantity === undefined && meal_slot === undefined) {
      return res.status(400).json({ error: 'quantity or meal_slot required' });
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (quantity !== undefined) {
      params.push(quantity);
      setClauses.push(`quantity = $${params.length}`);
    }
    if (meal_slot !== undefined) {
      params.push(meal_slot);
      setClauses.push(`meal_slot = $${params.length}`);
    }

    params.push(id);
    const idIdx = params.length;
    params.push(user_id);
    const userIdx = params.length;

    const { rows: [item] } = await pool.query(
      `UPDATE log_items
       SET ${setClauses.join(', ')}
       WHERE id = $${idIdx}
         AND day_log_id IN (SELECT id FROM day_logs WHERE user_id = $${userIdx})
       RETURNING *`,
      params,
    );

    if (!item) return res.status(404).json({ error: 'log item not found' });

    const { rows: [food] } = await pool.query('SELECT * FROM foods WHERE id = $1', [item.food_id]);
    let servingGrams = 100;
    if (item.serving_id) {
      const { rows: [serving] } = await pool.query(
        'SELECT grams FROM food_servings WHERE id = $1',
        [item.serving_id],
      );
      if (serving) servingGrams = parseFloat(serving.grams);
    }

    const macros = calcMacros(food, servingGrams, parseFloat(item.quantity));
    return res.json({ ...item, macros });
  } catch (err) {
    next(err);
  }
});

export default router;
