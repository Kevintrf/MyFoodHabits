import {
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from './client';

const EXPORT_VERSION = 1;

export interface AppExport {
  export_version: number;
  exported_at: string;
  user_settings: Record<string, unknown>[];
  foods: Record<string, unknown>[];
  food_servings: Record<string, unknown>[];
  meals: Record<string, unknown>[];
  meal_items: Record<string, unknown>[];
  day_logs: Record<string, unknown>[];
  log_items: Record<string, unknown>[];
  weights: Record<string, unknown>[];
}

export async function exportAllData(): Promise<void> {
  const data: AppExport = {
    export_version: EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    user_settings: db.getAllSync('SELECT * FROM user_settings'),
    foods: db.getAllSync('SELECT * FROM foods'),
    food_servings: db.getAllSync('SELECT * FROM food_servings'),
    meals: db.getAllSync('SELECT * FROM meals'),
    meal_items: db.getAllSync('SELECT * FROM meal_items'),
    day_logs: db.getAllSync('SELECT * FROM day_logs'),
    log_items: db.getAllSync('SELECT * FROM log_items'),
    weights: db.getAllSync('SELECT * FROM weights'),
  };

  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const path = documentDirectory + `myfoodhabits-backup-${date}.json`;
  await writeAsStringAsync(path!, json, { encoding: EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export MyFoodHabits data' });
}

export async function importAllData(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false };
    }

    const uri = result.assets[0].uri;
    const json = await readAsStringAsync(uri, { encoding: EncodingType.UTF8 });
    const data: AppExport = JSON.parse(json);

    if (!data.export_version || !Array.isArray(data.foods)) {
      return { success: false, error: 'Invalid backup file format.' };
    }

    db.withTransactionSync(() => {
      db.execSync('DELETE FROM log_items');
      db.execSync('DELETE FROM day_logs');
      db.execSync('DELETE FROM meal_items');
      db.execSync('DELETE FROM meals');
      db.execSync('DELETE FROM food_servings');
      db.execSync('DELETE FROM foods');
      db.execSync('DELETE FROM weights');

      for (const row of data.foods) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO foods (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }
      for (const row of data.food_servings) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO food_servings (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }
      for (const row of data.meals) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO meals (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }
      for (const row of data.meal_items) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO meal_items (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }
      for (const row of data.day_logs) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO day_logs (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }
      for (const row of data.log_items) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO log_items (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }
      for (const row of data.weights) {
        const keys = Object.keys(row);
        db.runSync(
          `INSERT OR REPLACE INTO weights (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          keys.map((k) => row[k]) as any[],
        );
      }

      // Restore settings but keep schema_version from current install
      if (data.user_settings?.[0]) {
        const s = data.user_settings[0];
        db.runSync(
          `UPDATE user_settings SET
            name = ?, target_calories = ?, target_protein_g = ?,
            activity_level = ?, show_vitamins = ?
          WHERE id = 1`,
          [s.name ?? null, s.target_calories, s.target_protein_g, s.activity_level, s.show_vitamins] as any[],
        );
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Import failed.' };
  }
}
