const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// --- Types ---

export interface Food {
  id: number;
  name: string;
  barcode: string | null;
  liquid: boolean;
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

// --- HTTP helper ---

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// --- Foods ---

export const searchFoods = (q: string) =>
  request<Food[]>(`/foods/search?q=${encodeURIComponent(q)}`);

export const getFoodById = (id: number) =>
  request<FoodWithServings>(`/foods/${id}`);

// --- Log ---

export const getLog = (date: string) =>
  request<DayLog>(`/log/${date}`);

export const addLogItem = (item: {
  date: string;
  meal_slot: string;
  food_id: number;
  serving_id?: number;
  quantity: number;
}) => request<LogItem>('/log', { method: 'POST', body: JSON.stringify(item) });

// --- Meals ---

export const getMeals = () => request<Meal[]>('/meals');

export const logMeal = (mealId: number, date: string, meal_slot: string) =>
  request(`/meals/${mealId}/log`, { method: 'POST', body: JSON.stringify({ date, meal_slot }) });

// --- Weight ---

export const getWeights = () => request<WeightEntry[]>('/weight');

export const logWeight = (weight_kg: number) =>
  request<WeightEntry>('/weight', { method: 'POST', body: JSON.stringify({ weight_kg }) });
