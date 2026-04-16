// Pure macro calculation helpers — no DB dependency.
// Mirrors backend/src/lib/macros.ts exactly.

export interface MacroResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface FoodNutrition {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calcMacros(food: FoodNutrition, servingGrams: number, quantity: number): MacroResult {
  const m = (servingGrams / 100) * quantity;
  return {
    calories: round1(food.calories_per_100g * m),
    protein_g: round1(food.protein_per_100g * m),
    carbs_g: round1(food.carbs_per_100g * m),
    fat_g: round1(food.fat_per_100g * m),
  };
}

export function sumMacros(list: MacroResult[]): MacroResult {
  const t = list.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  return {
    calories: round1(t.calories),
    protein_g: round1(t.protein_g),
    carbs_g: round1(t.carbs_g),
    fat_g: round1(t.fat_g),
  };
}
