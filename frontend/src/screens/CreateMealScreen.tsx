import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Food, FoodServing } from '../services/api';
import { searchFoods, getFoodById, getFoodByBarcode } from '../db/foods';
import { createMeal } from '../db/meals';
import { MealsStackParamList } from '../navigation/RootNavigator';
import { fmtNum } from '../utils/format';
import { KeyboardAvoidingView, Platform } from 'react-native';

type NavProp = NativeStackNavigationProp<MealsStackParamList, 'CreateMeal'>;

interface DraftItem {
  draftId: number;
  food: Food;
  quantity: number;
  quantityText: string;
  servings: FoodServing[];
  selectedServing: FoodServing | null;
}

function calcItemMacros(item: DraftItem) {
  const grams = item.selectedServing ? item.selectedServing.grams : 1;
  const mult = (grams / 100) * item.quantity;
  return {
    calories: Math.round(parseFloat(String(item.food.calories_per_100g)) * mult),
    protein: Math.round(parseFloat(String(item.food.protein_per_100g)) * mult * 10) / 10,
    carbs: Math.round(parseFloat(String(item.food.carbs_per_100g)) * mult * 10) / 10,
    fat: Math.round(parseFloat(String(item.food.fat_per_100g)) * mult * 10) / 10,
  };
}

export default function CreateMealScreen() {
  const navigation = useNavigation<NavProp>();
  const [mealName, setMealName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextDraftId = useRef(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const totalMacros = draftItems.reduce(
    (acc, item) => {
      const m = calcItemMacros(item);
      return {
        calories: acc.calories + m.calories,
        protein: Math.round((acc.protein + m.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + m.carbs) * 10) / 10,
        fat: Math.round((acc.fat + m.fat) * 10) / 10,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showAlert('Camera access needed', 'Enable camera permission in settings to scan barcodes.');
        return;
      }
    }
    setScannerBusy(false);
    setScannerOpen(true);
  }

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scannerBusy) return;
    setScannerBusy(true);
    setScannerOpen(false);

    try {
      const food = await getFoodByBarcode(data);
      addFood(food);
    } catch {
      showAlert(
        'Not found',
        "This barcode isn't in the database yet.",
        [
          { text: 'Try again', onPress: () => { setScannerBusy(false); setScannerOpen(true); } },
          { text: 'Cancel', style: 'cancel', onPress: () => setScannerBusy(false) },
        ],
      );
    }
  }

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

  async function addFood(food: Food) {
    setSearchQuery('');
    setSearchResults([]);
    const draftId = nextDraftId.current++;
    setDraftItems((prev) => [...prev, { draftId, food, quantity: 100, quantityText: '100', servings: [], selectedServing: null }]);
    try {
      const detail = await getFoodById(food.id);
      const defaultServing = detail.servings.find((s) => s.is_default) ?? null;
      const defaultQty = defaultServing ? 1 : 100;
      setDraftItems((prev) =>
        prev.map((i) =>
          i.draftId === draftId
            ? { ...i, servings: detail.servings, selectedServing: defaultServing, quantity: defaultQty, quantityText: String(defaultQty) }
            : i,
        ),
      );
    } catch {
      // servings stay empty — food can still be added with 100g base
    }
  }

  function adjustQty(draftId: number, delta: number) {
    setDraftItems((prev) =>
      prev.map((i) => {
        if (i.draftId !== draftId) return i;
        const next = Math.max(0, Math.round((i.quantity + delta) * 10) / 10);
        return { ...i, quantity: next, quantityText: String(next) };
      }),
    );
  }

  function setQtyText(draftId: number, text: string) {
    setDraftItems((prev) =>
      prev.map((i) => {
        if (i.draftId !== draftId) return i;
        const num = parseFloat(text);
        return { ...i, quantityText: text, quantity: isNaN(num) || num < 0 ? i.quantity : num };
      }),
    );
  }

  function removeItem(draftId: number) {
    setDraftItems((prev) => prev.filter((i) => i.draftId !== draftId));
  }

  function selectServing(draftId: number, serving: FoodServing | null) {
    setDraftItems((prev) =>
      prev.map((i) => (i.draftId === draftId ? { ...i, selectedServing: serving } : i)),
    );
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
        items: draftItems.map((i) => ({
          food_id: i.food.id,
          quantity: i.quantity,
          serving_id: i.selectedServing?.id,
        })),
      });
      navigation.goBack();
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <FlatList
      style={{ flex: 1 }}
      data={draftItems}
      keyExtractor={(item) => String(item.draftId)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <TextInput
            style={styles.nameInput}
            placeholder="Meal name (e.g. Usual Breakfast)"
            placeholderTextColor="#bbb"
            value={mealName}
            onChangeText={setMealName}
            returnKeyType="next"
          />
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods to add..."
              placeholderTextColor="#bbb"
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.cameraBtn} onPress={openScanner}>
              <Ionicons name="barcode-outline" size={24} color="#2D6A4F" />
            </TouchableOpacity>
          </View>
          {searching && <ActivityIndicator style={styles.spinner} color="#2D6A4F" />}
          {searchResults.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.searchResult}
              onPress={() => addFood(food)}
            >
              <View style={styles.resultLeft}>
                <Text style={styles.resultName}>{food.name}</Text>
                <Text style={styles.resultSub}>
                  {fmtNum(food.calories_per_100g)} kcal per 100{food.liquid ? 'ml' : 'g'}
                </Text>
                <Text style={styles.resultSub}>
                  {fmtNum(food.protein_per_100g)}g Protein · {fmtNum(food.carbs_per_100g)}g Carbs · {fmtNum(food.fat_per_100g)}g Fat
                </Text>
              </View>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ))}
          {draftItems.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalMacros}>
                {fmtNum(totalMacros.calories)} kcal · {fmtNum(totalMacros.protein)}g Protein · {fmtNum(totalMacros.carbs)}g Carbs · {fmtNum(totalMacros.fat)}g Fat
              </Text>
            </View>
          )}
          {draftItems.length > 0 && <Text style={styles.sectionLabel}>Added foods</Text>}
        </View>
      }
      renderItem={({ item }) => {
        const macros = calcItemMacros(item);
        return (
          <View style={styles.draftItem}>
            <View style={styles.draftTop}>
              <View style={styles.draftLeft}>
                <Text style={styles.draftName}>{item.food.name}</Text>
                <Text style={styles.draftSub}>
                  {fmtNum(item.food.calories_per_100g)} kcal · {fmtNum(item.food.protein_per_100g)}g Protein · {fmtNum(item.food.carbs_per_100g)}g Carbs · {fmtNum(item.food.fat_per_100g)}g Fat per 100{item.food.liquid ? 'ml' : 'g'}
                </Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => adjustQty(item.draftId, -1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={item.quantityText}
                  onChangeText={(t) => setQtyText(item.draftId, t)}
                  keyboardType="decimal-pad" autoComplete="off" textContentType="none"
                  selectTextOnFocus
                />
                <TouchableOpacity onPress={() => adjustQty(item.draftId, 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.draftId)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            {item.servings.length > 0 && (
              <View style={styles.servingChips}>
                <TouchableOpacity
                  style={[styles.chip, !item.selectedServing && styles.chipActive]}
                  onPress={() => selectServing(item.draftId, null)}
                >
                  <Text style={[styles.chipText, !item.selectedServing && styles.chipTextActive]}>
                    {item.food.liquid ? 'Milliliters' : 'Grams'}
                  </Text>
                </TouchableOpacity>
                {[...item.servings].sort((a, b) => b.grams - a.grams).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, item.selectedServing?.id === s.id && styles.chipActive]}
                    onPress={() => selectServing(item.draftId, s)}
                  >
                    <Text style={[styles.chipText, item.selectedServing?.id === s.id && styles.chipTextActive]}>
                      {s.name} ({s.grams}{item.food.liquid ? 'ml' : 'g'})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.itemMacros}>
              {fmtNum(macros.calories)} kcal · {fmtNum(macros.protein)}g Protein · {fmtNum(macros.carbs)}g Carbs · {fmtNum(macros.fat)}g Fat
            </Text>
          </View>
        );
      }}
      ListEmptyComponent={
        searchQuery.trim() === '' ? (
          <Text style={styles.emptyHint}>Search for foods above to build your meal.</Text>
        ) : null
      }
      ListFooterComponent={
        <View>
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
        </View>
      }
    />

      {/* Barcode scanner modal */}
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScan}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerHint}>Point at a barcode</Text>
          </View>
          <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
  </KeyboardAvoidingView>
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
  searchSection: { marginHorizontal: 16, marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cameraBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 10,
  },
  spinner: { marginTop: 4, marginHorizontal: 16 },
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
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
  },
  draftTop: { flexDirection: 'row', alignItems: 'center' },
  draftLeft: { flex: 1 },
  draftName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  draftSub: { fontSize: 12, color: '#999', marginTop: 2 },
  servingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9F9F9',
  },
  chipActive: { borderColor: '#2D6A4F', backgroundColor: '#F0FAF4' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#2D6A4F', fontWeight: '600' },
  itemMacros: { fontSize: 12, color: '#2D6A4F', marginTop: 6 },
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
  qtyInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    width: 54,
    textAlign: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 6,
    paddingVertical: 4,
  },
  removeBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 14, color: '#999' },
  emptyHint: { textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 14 },
  totalRow: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  totalLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalMacros: { fontSize: 14, fontWeight: '600', color: '#2D6A4F' },
  saveBtn: {
    margin: 16,
    marginTop: 12,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#A8C5B5' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  scannerHint: { color: '#fff', marginTop: 16, fontSize: 15 },
  scannerClose: { position: 'absolute', top: 56, right: 20 },
});
