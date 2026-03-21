import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db/client';

const router = Router();

// GET /foods/search?q=chicken&limit=20
// GET /foods/search?barcode=1234567890
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, barcode, limit = '20' } = req.query;

    if (barcode) {
      const { rows } = await pool.query(
        `SELECT id, name, barcode, liquid, created_by_user_id,
                calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
         FROM foods WHERE barcode = $1 LIMIT 1`,
        [barcode],
      );
      return res.json(rows[0] ?? null);
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'q or barcode query param required' });
    }

    const { rows } = await pool.query(
      `SELECT id, name, barcode, liquid, created_by_user_id,
              calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
       FROM foods
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT $2`,
      [`%${q}%`, parseInt(limit as string, 10)],
    );

    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /foods
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const {
      user_id = 1,
      name,
      barcode,
      liquid = false,
      calories_per_100g,
      protein_per_100g = 0,
      carbs_per_100g = 0,
      fat_per_100g = 0,
      servings = [],
    } = req.body;

    if (!name || calories_per_100g === undefined) {
      return res.status(400).json({ error: 'name and calories_per_100g required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [food] } = await client.query(
        `INSERT INTO foods
           (name, barcode, liquid, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, barcode, liquid,
                   calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_at`,
        [name, barcode ?? null, liquid, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, user_id],
      );

      const insertedServings = [];
      for (const serving of servings as { name: string; grams: number; is_default?: boolean }[]) {
        const { rows: [s] } = await client.query(
          `INSERT INTO food_servings (food_id, name, grams, is_default)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [food.id, serving.name, serving.grams, serving.is_default ?? false],
        );
        insertedServings.push(s);
      }

      await client.query('COMMIT');
      return res.status(201).json({ ...food, servings: insertedServings });
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

// PATCH /foods/:id — creates a new food version with updated fields (immutability)
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // TODO: replace with auth middleware
    const user_id = 1;

    const { rows: [existing] } = await pool.query(
      'SELECT * FROM foods WHERE id = $1',
      [id],
    );

    if (!existing) return res.status(404).json({ error: 'food not found' });
    if (existing.created_by_user_id !== user_id) {
      return res.status(403).json({ error: 'cannot edit a food you did not create' });
    }

    const {
      name = existing.name,
      liquid = existing.liquid,
      calories_per_100g = existing.calories_per_100g,
      protein_per_100g = existing.protein_per_100g,
      carbs_per_100g = existing.carbs_per_100g,
      fat_per_100g = existing.fat_per_100g,
    } = req.body;

    const { rows: [newFood] } = await pool.query(
      `INSERT INTO foods
         (name, barcode, liquid, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_by_user_id, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, barcode, liquid, created_by_user_id,
                 calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g`,
      [name, existing.barcode, liquid, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, user_id, existing.version + 1],
    );

    return res.json(newFood);
  } catch (err) {
    next(err);
  }
});

// GET /foods/:id — returns food with its servings
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows: [food] } = await pool.query(
      `SELECT id, name, barcode, liquid, created_by_user_id,
              calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_at
       FROM foods WHERE id = $1`,
      [id],
    );

    if (!food) return res.status(404).json({ error: 'food not found' });

    const { rows: servings } = await pool.query(
      'SELECT * FROM food_servings WHERE food_id = $1 ORDER BY is_default DESC, id',
      [id],
    );

    return res.json({ ...food, servings });
  } catch (err) {
    next(err);
  }
});

export default router;
