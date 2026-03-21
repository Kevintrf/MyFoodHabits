import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { getMeals, logMeal, Meal, MealItem } from '../services/api';
import { useApp } from '../context/AppContext';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
const SCALES = [0.5, 1, 2] as const;

function calcMealMacros(items: MealItem[], scale: number) {
  return items.reduce(
    (acc, item) => {
      const grams = item.serving_grams ?? 100;
      const mult = (grams / 100) * item.quantity * scale;
      return {
        calories: acc.calories + item.calories_per_100g * mult,
        protein_g: acc.protein_g + item.protein_per_100g * mult,
      };
    },
    { calories: 0, protein_g: 0 },
  );
}

export default function MealsScreen() {
  const { todayDate, refreshTodayLog } = useApp();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logTarget, setLogTarget] = useState<Meal | null>(null);
  const [slot, setSlot] = useState<string>('BREAKFAST');
  const [scale, setScale] = useState<number>(1);
  const [logging, setLogging] = useState(false);

  const fetchMeals = useCallback(async () => {
    const data = await getMeals();
    setMeals(data);
  }, []);

  useEffect(() => {
    fetchMeals().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchMeals().finally(() => setRefreshing(false));
  }

  function openLogModal(meal: Meal) {
    setLogTarget(meal);
    setSlot('BREAKFAST');
    setScale(1);
  }

  async function handleLog() {
    if (!logTarget) return;
    setLogging(true);
    try {
      await logMeal(logTarget.id, todayDate, slot, scale);
      await refreshTodayLog();
      setLogTarget(null);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLogging(false);
    }
  }

  if (loading) return <ActivityIndicator style={styles.loader} color="#2D6A4F" />;

  const previewMacros = logTarget ? calcMealMacros(logTarget.items, scale) : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No saved meals yet.</Text>}
        renderItem={({ item }) => {
          const macros = calcMealMacros(item.items, 1);
          return (
            <View style={styles.mealCard}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{item.name}</Text>
                <Text style={styles.mealMeta}>
                  {item.items.length} items · {Math.round(macros.calories)} kcal ·{' '}
                  {Math.round(macros.protein_g)}g protein
                </Text>
                {item.items.map((mi) => (
                  <Text key={mi.id} style={styles.mealItemLine}>
                    · {mi.food_name} ({mi.quantity}
                    {mi.serving_name ? ` × ${mi.serving_name}` : `× 100g`})
                  </Text>
                ))}
              </View>
              <TouchableOpacity style={styles.logBtn} onPress={() => openLogModal(item)}>
                <Text style={styles.logBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal
        visible={!!logTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setLogTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{logTarget?.name}</Text>

            <Text style={styles.sectionLabel}>SCALE</Text>
            <View style={styles.scaleRow}>
              {SCALES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.scaleBtn, scale === s && styles.scaleBtnActive]}
                  onPress={() => setScale(s)}
                >
                  <Text style={[styles.scaleBtnText, scale === s && styles.scaleBtnTextActive]}>
                    {s}×
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {previewMacros && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  {Math.round(previewMacros.calories)} kcal · {Math.round(previewMacros.protein_g)}g protein
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>MEAL</Text>
            <View style={styles.slotRow}>
              {MEAL_SLOTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.slotBtn, slot === s && styles.slotBtnActive]}
                  onPress={() => setSlot(s)}
                >
                  <Text style={[styles.slotBtnText, slot === s && styles.slotBtnTextActive]}>
                    {s[0] + s.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleLog} disabled={logging}>
              <Text style={styles.confirmBtnText}>{logging ? 'Logging…' : 'Log Meal'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLogTarget(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, marginTop: 100 },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  mealMeta: { fontSize: 13, color: '#666', marginTop: 3, marginBottom: 6 },
  mealItemLine: { fontSize: 12, color: '#999', marginTop: 1 },
  logBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  logBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 8 },
  scaleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  scaleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  scaleBtnActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  scaleBtnText: { fontSize: 16, fontWeight: '700', color: '#666' },
  scaleBtnTextActive: { color: '#fff' },
  preview: {
    backgroundColor: '#F0FAF4',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewText: { fontSize: 15, fontWeight: '600', color: '#2D6A4F' },
  slotRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  slotBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  slotBtnActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  slotBtnText: { fontSize: 11, fontWeight: '600', color: '#666' },
  slotBtnTextActive: { color: '#fff' },
  confirmBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#999', fontSize: 15 },
});
