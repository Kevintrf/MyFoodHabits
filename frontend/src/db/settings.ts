import { db } from './client';
import { UserTargets, ActivityLevel, Gender } from '../services/api';

interface RawTargets {
  target_calories: number | null;
  target_protein_g: number | null;
  activity_level: ActivityLevel;
  show_vitamins: number;
  smart_meal_slot: number;
  gender: Gender | null;
  height_cm: number | null;
  birth_year: number | null;
}

export interface AiSettings {
  country: string | null;
  anthropic_api_key: string | null;
}

export async function getTargets(): Promise<UserTargets> {
  const row = await db.getFirstAsync<RawTargets>(
    'SELECT target_calories, target_protein_g, activity_level, show_vitamins, smart_meal_slot, gender, height_cm, birth_year FROM user_settings WHERE id = 1',
    [],
  );
  return row
    ? { ...row, show_vitamins: !!row.show_vitamins, smart_meal_slot: !!row.smart_meal_slot }
    : { target_calories: 2000, target_protein_g: 150, activity_level: 'SEDENTARY', show_vitamins: false, smart_meal_slot: true, gender: null, height_cm: null, birth_year: null };
}

export async function getAiSettings(): Promise<AiSettings> {
  const row = await db.getFirstAsync<AiSettings>(
    'SELECT country, anthropic_api_key FROM user_settings WHERE id = 1',
  );
  return row ?? { country: null, anthropic_api_key: null };
}

export async function saveAiSettings(data: AiSettings): Promise<void> {
  await db.runAsync(
    'UPDATE user_settings SET country = ?, anthropic_api_key = ? WHERE id = 1',
    [data.country || null, data.anthropic_api_key || null],
  );
}

export async function updateTargets(data: {
  target_calories?: number;
  target_protein_g?: number;
  activity_level?: ActivityLevel;
  show_vitamins?: boolean;
  smart_meal_slot?: boolean;
  gender?: Gender | null;
  height_cm?: number | null;
  birth_year?: number | null;
}): Promise<UserTargets> {
  await db.runAsync(
    `UPDATE user_settings
     SET target_calories  = COALESCE(?, target_calories),
         target_protein_g = COALESCE(?, target_protein_g),
         activity_level   = COALESCE(?, activity_level),
         show_vitamins    = COALESCE(?, show_vitamins),
         smart_meal_slot  = COALESCE(?, smart_meal_slot),
         gender           = COALESCE(?, gender),
         height_cm        = COALESCE(?, height_cm),
         birth_year       = COALESCE(?, birth_year)
     WHERE id = 1`,
    [
      data.target_calories ?? null,
      data.target_protein_g ?? null,
      data.activity_level ?? null,
      data.show_vitamins !== undefined ? (data.show_vitamins ? 1 : 0) : null,
      data.smart_meal_slot !== undefined ? (data.smart_meal_slot ? 1 : 0) : null,
      data.gender ?? null,
      data.height_cm ?? null,
      data.birth_year ?? null,
    ],
  );
  return getTargets();
}
