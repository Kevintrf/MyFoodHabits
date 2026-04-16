// Types only — all data access now goes through src/db/ (local SQLite).
// HTTP functions have been removed; this file is kept as the canonical type source.

export type FoodSource = 'USER' | 'VERIFIED' | 'OPENFOODFACTS';

export interface Food {
  id: number;
  name: string;
  barcode: string | null;
  liquid: boolean;
  source: FoodSource;
  created_by_user_id: number | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface FoodServing {
  id: number;
  food_id: number;
  name: string;
  grams: number;
  is_default: boolean;
}

export interface FoodWithServings extends Food {
  servings: FoodServing[];
}

export interface ServingDraft {
  name: string;
  grams: number;
  is_default: boolean;
}

export interface MacroResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface LogItem {
  id: number;
  food_id: number;
  food_name: string;
  liquid: boolean;
  serving_id: number | null;
  serving_name: string | null;
  serving_grams: number;
  quantity: number;
  logged_at: string;
  macros: MacroResult;
}

export interface DayLog {
  date: string;
  totals: MacroResult;
  slots: Record<string, LogItem[]>;
}

export interface DaySummary {
  date: string;
  calories: number;
}

export interface MealItem {
  id: number;
  meal_id: number;
  food_id: number;
  food_name: string;
  liquid: boolean;
  serving_id: number | null;
  serving_name: string | null;
  serving_grams: number | null;
  quantity: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface Meal {
  id: number;
  name: string;
  category: string | null;
  created_at: string;
  items: MealItem[];
}

export interface WeightEntry {
  id: number;
  weight_kg: number;
  logged_at: string;
}

export interface UserTargets {
  target_calories: number | null;
  target_protein_g: number | null;
}
