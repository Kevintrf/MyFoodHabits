import { db } from './client';
import { UserTargets, ActivityLevel } from '../services/api';

interface RawTargets {
  target_calories: number | null;
  target_protein_g: number | null;
  activity_level: ActivityLevel;
  show_vitamins: number;
}

export async function getTargets(): Promise<UserTargets> {
  const row = await db.getFirstAsync<RawTargets>(
    'SELECT target_calories, target_protein_g, activity_level, show_vitamins FROM user_settings WHERE id = 1',
    [],
  );
  return row
    ? { ...row, show_vitamins: !!row.show_vitamins }
    : { target_calories: 2000, target_protein_g: 150, activity_level: 'SEDENTARY', show_vitamins: false };
}

export async function updateTargets(data: {
  target_calories?: number;
  target_protein_g?: number;
  activity_level?: ActivityLevel;
  show_vitamins?: boolean;
}): Promise<UserTargets> {
  await db.runAsync(
    `UPDATE user_settings
     SET target_calories  = COALESCE(?, target_calories),
         target_protein_g = COALESCE(?, target_protein_g),
         activity_level   = COALESCE(?, activity_level),
         show_vitamins    = COALESCE(?, show_vitamins)
     WHERE id = 1`,
    [
      data.target_calories ?? null,
      data.target_protein_g ?? null,
      data.activity_level ?? null,
      data.show_vitamins !== undefined ? (data.show_vitamins ? 1 : 0) : null,
    ],
  );
  return getTargets();
}
