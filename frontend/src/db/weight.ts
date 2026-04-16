import { db } from './client';
import { WeightEntry } from '../services/api';

export async function getWeights(): Promise<WeightEntry[]> {
  return db.getAllAsync<WeightEntry>(
    'SELECT id, weight_kg, logged_at FROM weights WHERE user_id = 1 ORDER BY logged_at DESC LIMIT 90',
    [],
  );
}

export async function logWeight(weight_kg: number): Promise<WeightEntry> {
  const logged_at = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO weights (user_id, weight_kg, logged_at) VALUES (1, ?, ?)',
    [weight_kg, logged_at],
  );
  return { id: result.lastInsertRowId, weight_kg, logged_at };
}
