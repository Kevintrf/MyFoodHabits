import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db/client';

const router = Router();

// GET /users/me
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace with value from auth middleware
    const user_id = 1;

    const { rows: [user] } = await pool.query(
      'SELECT target_calories, target_protein_g FROM users WHERE id = $1',
      [user_id],
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /users/me
router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: replace with value from auth middleware
    const user_id = 1;

    const { target_calories, target_protein_g } = req.body;

    if (
      (target_calories !== undefined && (isNaN(parseInt(target_calories)) || parseInt(target_calories) <= 0)) ||
      (target_protein_g !== undefined && (isNaN(parseInt(target_protein_g)) || parseInt(target_protein_g) <= 0))
    ) {
      return res.status(400).json({ error: 'Targets must be positive integers' });
    }

    const { rows: [user] } = await pool.query(
      `UPDATE users
       SET target_calories  = COALESCE($1, target_calories),
           target_protein_g = COALESCE($2, target_protein_g)
       WHERE id = $3
       RETURNING target_calories, target_protein_g`,
      [
        target_calories !== undefined ? parseInt(target_calories) : null,
        target_protein_g !== undefined ? parseInt(target_protein_g) : null,
        user_id,
      ],
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
