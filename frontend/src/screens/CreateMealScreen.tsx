import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchFoods, createMeal, Food } from '../services/api';
import { MealsStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<MealsStackParamList, 'CreateMeal'>;

interface DraftItem {
  food: Food;
  quantity: number;
}

export default function CreateMealScreen() {
  const navigation = useNavigation<NavProp>();
  const [mealName, setMealName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const foods = await searchFoods(text.trim());
        setSearchResults(foods);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  function addFood(food: Food) {
    setDraftItems((prev) => {
      const existing = prev.find((i) => i.food.id === food.id);
      if (existing) {
        return prev.map((i) => (i.food.id === food.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { food, quantity: 1 }];
    });
    setSearchQuery('');
    setSearchResults([]);
  }

  function adjustQty(foodId: number, delta: number) {
    setDraftItems((prev) =>
      prev.map((i) =>
        i.food.id === foodId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i,
      ),
    );
  }

  function removeItem(foodId: number) {
    setDraftItems((prev) => prev.filter((i) => i.food.id !== foodId));
  }

  async function handleSave() {
    if (!mealName.trim()) {
      showAlert('Name required', 'Please give your meal a name.');
      return;
    }
    if (draftItems.length === 0) {
      showAlert('No foods added', 'Add at least one food to the meal.');
      return;
    }
    setSaving(true);
    try {
      await createMeal({
        name: mealName.trim(),
        items: draftItems.map((i) => ({ food_id: i.food.id, quantity: i.quantity })),
      });
      navigation.goBack();
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FlatList
      style={styles.container}
      data={draftItems}
      keyExtractor={(item) => String(item.food.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <TextInput
            style={styles.nameInput}
            placeholder="Meal name (e.g. Usual Breakfast)"
            value={mealName}
            onChangeText={setMealName}
            returnKeyType="next"
          />
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods to add..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator style={styles.spinner} color="#2D6A4F" />}
          </View>
          {searchResults.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.searchResult}
              onPress={() => addFood(food)}
            >
              <View style={styles.resultLeft}>
                <Text style={styles.resultName}>{food.name}</Text>
                <Text style={styles.resultSub}>
                  {food.calories_per_100g} kcal · {food.protein_per_100g}g protein per 100
                  {food.liquid ? 'ml' : 'g'}
                </Text>
              </View>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ))}
          {draftItems.length > 0 && <Text style={styles.sectionLabel}>Added foods</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.draftItem}>
          <View style={styles.draftLeft}>
            <Text style={styles.draftName}>{item.food.name}</Text>
            <Text style={styles.draftSub}>
              ×{item.quantity} · {item.food.calories_per_100g} kcal per 100
              {item.food.liquid ? 'ml' : 'g'}
            </Text>
          </View>
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={() => adjustQty(item.food.id, -1)} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => adjustQty(item.food.id, 1)} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeItem(item.food.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        searchQuery.trim() === '' ? (
          <Text style={styles.emptyHint}>Search for foods above to build your meal.</Text>
        ) : null
      }
      ListFooterComponent={
        <TouchableOpacity
          style={[styles.saveBtn, draftItems.length === 0 && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || draftItems.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Meal</Text>
          )}
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  nameInput: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchSection: { marginHorizontal: 16, marginBottom: 4 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  spinner: { marginTop: 8 },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  resultLeft: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  resultSub: { fontSize: 12, color: '#999', marginTop: 2 },
  addBtnText: { color: '#2D6A4F', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
  },
  draftLeft: { flex: 1 },
  draftName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  draftSub: { fontSize: 12, color: '#999', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: '#333' },
  qtyValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', minWidth: 24, textAlign: 'center' },
  removeBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 14, color: '#999' },
  emptyHint: { textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 14 },
  saveBtn: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#A8C5B5' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
