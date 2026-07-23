import { ActivityLevel, Gender, WeightEntry } from '../services/api';

const KCAL_PER_KG = 7700;

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY:         1.2,
  LIGHTLY_ACTIVE:    1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE:       1.725,
  EXTREMELY_ACTIVE:  1.9,
};

// Derived from actual weight change + calorie history: TDEE = avgCalories − (Δweight × 7700 / Δdays)
// Returns null when there is insufficient data or the result fails a sanity check.
export function calibrateTDEE(
  weightEntries: WeightEntry[],
  calorieHistory: { date: string; calories: number }[],
): number | null {
  if (weightEntries.length < 3 || calorieHistory.length < 7) return null;

  const sorted = [...weightEntries].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
  );
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  const deltaWeight = newest.weight_kg - oldest.weight_kg;
  const oldestMs = new Date(oldest.logged_at.slice(0, 10) + 'T00:00:00').getTime();
  const newestMs = new Date(newest.logged_at.slice(0, 10) + 'T00:00:00').getTime();
  const deltaDays = Math.max(1, Math.round((newestMs - oldestMs) / 86400000));
  const avgCalories = calorieHistory.reduce((s, d) => s + d.calories, 0) / calorieHistory.length;

  const tdee = avgCalories - (deltaWeight * KCAL_PER_KG) / deltaDays;
  if (tdee < 1000 || tdee > 6000) return null;
  return Math.round(tdee);
}

// Mifflin-St Jeor BMR, then scaled by activity multiplier.
// Gender OTHER uses the average of the male (+5) and female (-161) constants = -78.
export function calculateTDEE(params: {
  weight_kg: number;
  height_cm: number;
  birth_year: number;
  gender: Gender;
  activity_level: ActivityLevel;
}): number {
  const age = new Date().getFullYear() - params.birth_year;
  const base = 10 * params.weight_kg + 6.25 * params.height_cm - 5 * age;
  const genderOffset = params.gender === 'MALE' ? 5 : params.gender === 'FEMALE' ? -161 : -78;
  const bmr = base + genderOffset;
  return Math.round(bmr * ACTIVITY_MULTIPLIER[params.activity_level]);
}
