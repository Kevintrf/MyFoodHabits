import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db/client';

const router = Router();

// POST /meals
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const { user_id = 1, name, category, items = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [meal] } = await client.query(
        `INSERT INTO meals (user_id, name, category) VALUES ($1, $2, $3) RETURNING *`,
        [user_id, name, category ?? null],
      );

      const insertedItems = [];
      for (const item of items as { food_id: number; serving_id?: number; quantity?: number }[]) {
        const { rows: [mi] } = await client.query(
          `INSERT INTO meal_items (meal_id, food_id, serving_id, quantity)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [meal.id, item.food_id, item.serving_id ?? null, item.quantity ?? 1],
        );
        insertedItems.push(mi);
      }

      await client.query('COMMIT');
      return res.status(201).json({ ...meal, items: insertedItems });
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

// GET /meals?user_id=1
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const user_id = req.query.user_id ?? 1;

    const { rows: meals } = await pool.query(
      'SELECT * FROM meals WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id],
    );

    const result = await Promise.all(
      meals.map(async (meal) => {
        const { rows: items } = await pool.query(
          `SELECT mi.*,
                  f.name AS food_name, f.liquid,
                  f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
                  fs.name AS serving_name, fs.grams AS serving_grams
           FROM meal_items mi
           JOIN foods f ON mi.food_id = f.id
           LEFT JOIN food_servings fs ON mi.serving_id = fs.id
           WHERE mi.meal_id = $1`,
          [meal.id],
        );
        return { ...meal, items };
      }),
    );

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /meals/:id/log
router.post('/:id/log', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const { id } = req.params;
    const { user_id = 1, date, meal_slot, scale = 1 } = req.body;

    if (!date || !meal_slot) {
      return res.status(400).json({ error: 'date and meal_slot required' });
    }
    if (typeof scale !== 'number' || scale <= 0) {
      return res.status(400).json({ error: 'scale must be a positive number' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [meal] } = await client.query('SELECT * FROM meals WHERE id = $1', [id]);
      if (!meal) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'meal not found' });
      }

      const { rows: mealItems } = await client.query(
        'SELECT * FROM meal_items WHERE meal_id = $1',
        [id],
      );

      const { rows: [dayLog] } = await client.query(
        `INSERT INTO day_logs (user_id, date) VALUES ($1, $2)
         ON CONFLICT (user_id, date) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id`,
        [user_id, date],
      );

      const loggedItems = [];
      for (const mi of mealItems) {
        const { rows: [item] } = await client.query(
          `INSERT INTO log_items (day_log_id, food_id, serving_id, quantity, meal_slot)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [dayLog.id, mi.food_id, mi.serving_id, mi.quantity * scale, meal_slot],
        );
        loggedItems.push(item);
      }

      await client.query('COMMIT');
      return res.status(201).json({ logged: loggedItems.length, items: loggedItems });
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

export default router;
