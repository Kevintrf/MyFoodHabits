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
} from 'react-native';
import { getMeals, logMeal, Meal, MealItem } from '../services/api';
import { useApp } from '../context/AppContext';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

function calcMealMacros(items: MealItem[]) {
  return items.reduce(
    (acc, item) => {
      const grams = item.serving_grams ?? 100;
      const mult = (grams / 100) * item.quantity;
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

  function handleLogMeal(meal: Meal) {
    Alert.alert(`Log "${meal.name}"`, 'Choose a meal slot', [
      ...MEAL_SLOTS.map((slot) => ({
        text: slot[0] + slot.slice(1).toLowerCase(),
        onPress: async () => {
          try {
            await logMeal(meal.id, todayDate, slot);
            await refreshTodayLog();
            Alert.alert('Logged!', `"${meal.name}" added to ${slot.toLowerCase()}.`);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (loading) return <ActivityIndicator style={styles.loader} color="#2D6A4F" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No saved meals yet.</Text>
        }
        renderItem={({ item }) => {
          const macros = calcMealMacros(item.items);
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
              <TouchableOpacity style={styles.logBtn} onPress={() => handleLogMeal(item)}>
                <Text style={styles.logBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
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
});
