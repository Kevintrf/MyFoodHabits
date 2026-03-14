import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db/client';

const router = Router();

// GET /weight?user_id=1
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const user_id = req.query.user_id ?? 1;

    const { rows } = await pool.query(
      'SELECT id, weight_kg, logged_at FROM weights WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 90',
      [user_id],
    );

    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /weight
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace user_id with value from auth middleware
    const { user_id = 1, weight_kg } = req.body;

    if (!weight_kg || isNaN(parseFloat(weight_kg))) {
      return res.status(400).json({ error: 'weight_kg required' });
    }

    const { rows: [entry] } = await pool.query(
      'INSERT INTO weights (user_id, weight_kg) VALUES ($1, $2) RETURNING id, weight_kg, logged_at',
      [user_id, parseFloat(weight_kg)],
    );

    return res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

export default router;
