import { db } from './client';
import { UserTargets } from '../services/api';

export async function getTargets(): Promise<UserTargets> {
  const row = await db.getFirstAsync<UserTargets>(
    'SELECT target_calories, target_protein_g FROM user_settings WHERE id = 1',
    [],
  );
  return row ?? { target_calories: 2000, target_protein_g: 150 };
}

export async function updateTargets(data: {
  target_calories?: number;
  target_protein_g?: number;
}): Promise<UserTargets> {
  await db.runAsync(
    `UPDATE user_settings
     SET target_calories  = COALESCE(?, target_calories),
         target_protein_g = COALESCE(?, target_protein_g)
     WHERE id = 1`,
    [data.target_calories ?? null, data.target_protein_g ?? null],
  );
  return getTargets();
}
