import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SearchStackParamList } from '../navigation/RootNavigator';
import { getFoodById, addLogItem, FoodServing, FoodWithServings } from '../services/api';
import { useApp } from '../context/AppContext';
import { fmtNum } from '../utils/format';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

type PortionRoute = RouteProp<SearchStackParamList, 'Portion'>;

export default function PortionScreen() {
  const route = useRoute<PortionRoute>();
  const navigation = useNavigation<any>();
  const { todayDate, refreshTodayLog } = useApp();
  const { food } = route.params;

  const [foodDetail, setFoodDetail] = useState<FoodWithServings | null>(null);
  const [selectedServing, setSelectedServing] = useState<FoodServing | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [mealSlot, setMealSlot] = useState('BREAKFAST');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    getFoodById(food.id)
      .then((f) => {
        setFoodDetail(f);
        const def = f.servings.find((s) => s.is_default) ?? f.servings[0] ?? null;
        setSelectedServing(def);
      })
      .finally(() => setLoading(false));
  }, [food.id]);

  const servingGrams = selectedServing?.grams ?? 100;
  const qty = parseFloat(quantity);
  const multiplier = (servingGrams / 100) * (qty || 0);
  const preview = {
    calories: Math.round(parseFloat(String(food.calories_per_100g)) * multiplier),
    protein_g: Math.round(parseFloat(String(food.protein_per_100g)) * multiplier * 10) / 10,
    carbs_g: Math.round(parseFloat(String(food.carbs_per_100g)) * multiplier * 10) / 10,
    fat_g: Math.round(parseFloat(String(food.fat_per_100g)) * multiplier * 10) / 10,
  };

  async function doLog() {
    setLogging(true);
    try {
      await addLogItem({
        date: todayDate,
        meal_slot: mealSlot,
        food_id: food.id,
        serving_id: selectedServing?.id,
        quantity: qty,
      });
      await refreshTodayLog();
      navigation.navigate('Today');
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLogging(false);
    }
  }

  async function handleLog() {
    if (isNaN(qty)) return showAlert('Enter a valid quantity');
    if (qty === 0) {
      showAlert(
        'Log 0 quantity?',
        'This will add the item with 0 calories and macros.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log anyway', onPress: doLog },
        ],
      );
      return;
    }
    doLog();
  }

  const unitLabel = food.liquid ? 'ml' : 'g';

  if (loading) return <ActivityIndicator style={styles.loader} color="#2D6A4F" />;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Food header */}
      <View style={styles.foodHeader}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodSub}>
          {fmtNum(food.calories_per_100g)} kcal · {fmtNum(food.protein_per_100g)}g Protein · {fmtNum(food.carbs_per_100g)}g Carbs · {fmtNum(food.fat_per_100g)}g Fat per 100{unitLabel}
        </Text>
        {food.created_by_user_id === 1 && (
          <TouchableOpacity onPress={() => navigation.navigate('EditFood', { food })}>
            <Text style={styles.editLink}>Edit food</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Serving picker */}
      {foodDetail && foodDetail.servings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVING SIZE</Text>
          <TouchableOpacity
            style={[styles.servingOption, !selectedServing && styles.servingSelected]}
            onPress={() => setSelectedServing(null)}
          >
            <Text style={styles.servingText}>100{unitLabel}</Text>
          </TouchableOpacity>
          {foodDetail.servings.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.servingOption, selectedServing?.id === s.id && styles.servingSelected]}
              onPress={() => setSelectedServing(s)}
            >
              <Text style={styles.servingText}>
                {s.name} ({s.grams}{unitLabel})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUANTITY</Text>
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
      </View>

      {/* Meal slot */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MEAL</Text>
        <View style={styles.slotRow}>
          {MEAL_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotOption, mealSlot === slot && styles.slotSelected]}
              onPress={() => setMealSlot(slot)}
            >
              <Text style={[styles.slotText, mealSlot === slot && styles.slotTextSelected]}>
                {slot[0] + slot.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Live preview */}
      <View style={styles.preview}>
        <Text style={styles.previewText}>
          {fmtNum(preview.calories)} kcal · {fmtNum(preview.protein_g)}g Protein · {fmtNum(preview.carbs_g)}g Carbs · {fmtNum(preview.fat_g)}g Fat
        </Text>
      </View>

      {/* Log button */}
      <TouchableOpacity style={styles.logButton} onPress={handleLog} disabled={logging}>
        {logging ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logButtonText}>Log Food</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, marginTop: 100 },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  foodHeader: {
    padding: 20,
    paddingTop: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  foodName: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  foodSub: { fontSize: 14, color: '#666', marginTop: 4 },
  editLink: { fontSize: 13, color: '#2D6A4F', marginTop: 8 },
  section: { margin: 16, marginBottom: 0 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  servingOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 6,
  },
  servingSelected: { borderColor: '#2D6A4F', backgroundColor: '#F0FAF4' },
  servingText: { fontSize: 15, color: '#1A1A1A' },
  quantityInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 14,
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  slotSelected: { borderColor: '#2D6A4F', backgroundColor: '#2D6A4F' },
  slotText: { fontSize: 14, color: '#1A1A1A' },
  slotTextSelected: { color: '#fff', fontWeight: '600' },
  preview: {
    margin: 16,
    padding: 14,
    backgroundColor: '#F0FAF4',
    borderRadius: 10,
    alignItems: 'center',
  },
  previewText: { fontSize: 16, fontWeight: '600', color: '#2D6A4F' },
  logButton: {
    margin: 16,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
