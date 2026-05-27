import { ActivityLevel, Gender } from '../services/api';

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY:         1.2,
  LIGHTLY_ACTIVE:    1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE:       1.725,
  EXTREMELY_ACTIVE:  1.9,
};

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
