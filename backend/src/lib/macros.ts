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
  const multiplier = (servingGrams / 100) * quantity;
  return {
    calories: round1(food.calories_per_100g * multiplier),
    protein_g: round1(food.protein_per_100g * multiplier),
    carbs_g: round1(food.carbs_per_100g * multiplier),
    fat_g: round1(food.fat_per_100g * multiplier),
  };
}

export function sumMacros(macros: MacroResult[]): MacroResult {
  const totals = macros.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  return {
    calories: round1(totals.calories),
    protein_g: round1(totals.protein_g),
    carbs_g: round1(totals.carbs_g),
    fat_g: round1(totals.fat_g),
  };
}
