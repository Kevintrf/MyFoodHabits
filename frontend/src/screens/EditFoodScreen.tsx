import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { editFood, getFoodById, ServingDraft } from '../services/api';
import { showAlert } from '../utils/alert';
import { SearchStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<SearchStackParamList, 'EditFood'>;
type RoutePropType = RouteProp<SearchStackParamList, 'EditFood'>;

export default function EditFoodScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { food } = route.params;

  const [name, setName] = useState(food.name);
  const [calories, setCalories] = useState(String(food.calories_per_100g));
  const [protein, setProtein] = useState(String(food.protein_per_100g));
  const [carbs, setCarbs] = useState(String(food.carbs_per_100g));
  const [fat, setFat] = useState(String(food.fat_per_100g));
  const [liquid, setLiquid] = useState(food.liquid);
  const [servings, setServings] = useState<ServingDraft[]>([]);
  const [servingName, setServingName] = useState('');
  const [servingGrams, setServingGrams] = useState('');
  const [loadingServings, setLoadingServings] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFoodById(food.id)
      .then((f) => {
        setServings(f.servings.map((s) => ({ name: s.name, grams: s.grams, is_default: s.is_default })));
      })
      .finally(() => setLoadingServings(false));
  }, [food.id]);

  function addServing() {
    const grams = parseFloat(servingGrams);
    if (!servingName.trim()) {
      showAlert('Name required', 'Enter a name for this serving (e.g. slice, cup).');
      return;
    }
    if (isNaN(grams) || grams <= 0) {
      showAlert('Invalid grams', 'Enter how many grams this serving equals.');
      return;
    }
    setServings((prev) => [
      ...prev,
      { name: servingName.trim(), grams, is_default: prev.length === 0 },
    ]);
    setServingName('');
    setServingGrams('');
  }

  function removeServing(index: number) {
    setServings((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0) next[0] = { ...next[0], is_default: true };
      return next;
    });
  }

  async function handleSave() {
    const cal = parseFloat(calories);
    if (!name.trim()) {
      showAlert('Name required', 'Please enter a name for this food.');
      return;
    }
    if (isNaN(cal)) {
      showAlert('Invalid calories', 'Calories per 100g must be a valid number.');
      return;
    }
    const pro = parseFloat(protein) || 0;
    const carb = parseFloat(carbs) || 0;
    const fat_ = parseFloat(fat) || 0;
    if (cal < 0 || pro < 0 || carb < 0 || fat_ < 0) {
      showAlert(
        'Negative values?',
        'One or more values are negative. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save anyway', onPress: doSave },
        ],
      );
      return;
    }
    doSave();
  }

  async function doSave() {
    const cal = parseFloat(calories);
    setSaving(true);
    try {
      const updated = await editFood(food.id, {
        name: name.trim(),
        calories_per_100g: cal,
        protein_per_100g: parseFloat(protein) || 0,
        carbs_per_100g: parseFloat(carbs) || 0,
        fat_per_100g: parseFloat(fat) || 0,
        liquid,
        servings,
      });
      navigation.replace('Portion', { food: updated });
    } catch {
      showAlert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#bbb"
          autoFocus
        />
      </View>

      <Text style={styles.sectionNote}>Per 100{liquid ? 'ml' : 'g'}</Text>

      <View style={styles.row}>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>CALORIES (kcal) *</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>PROTEIN (g)</Text>
          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>CARBS (g)</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>FAT (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Liquid (store per 100ml)</Text>
        <Switch value={liquid} onValueChange={setLiquid} trackColor={{ true: '#2D6A4F' }} />
      </View>

      {/* Servings */}
      <Text style={styles.label}>SERVINGS (optional)</Text>
      {loadingServings ? (
        <ActivityIndicator color="#2D6A4F" style={{ marginBottom: 12 }} />
      ) : (
        <>
          {servings.map((s, i) => (
            <View key={i} style={styles.servingRow}>
              <Text style={styles.servingText}>
                {s.name} — {s.grams}{liquid ? 'ml' : 'g'}{s.is_default ? ' (default)' : ''}
              </Text>
              <TouchableOpacity onPress={() => removeServing(i)}>
                <Text style={styles.removeBtn}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.fieldHalf]}
              value={servingName}
              onChangeText={setServingName}
              placeholder="e.g. slice"
              placeholderTextColor="#bbb"
            />
            <TextInput
              style={[styles.input, styles.fieldHalf]}
              value={servingGrams}
              onChangeText={setServingGrams}
              placeholder={liquid ? 'ml' : 'grams'}
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity style={styles.addServingBtn} onPress={addServing}>
            <Text style={styles.addServingBtnText}>+ Add serving</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16, paddingBottom: 40 },
  sectionNote: { fontSize: 12, color: '#999', marginBottom: 12, marginTop: 4 },
  field: { marginBottom: 16 },
  fieldHalf: { flex: 1 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  toggleLabel: { fontSize: 15, color: '#1A1A1A' },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  servingText: { fontSize: 14, color: '#1A1A1A' },
  removeBtn: { fontSize: 13, color: '#e74c3c' },
  addServingBtn: {
    borderWidth: 1,
    borderColor: '#2D6A4F',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addServingBtnText: { color: '#2D6A4F', fontSize: 15, fontWeight: '600' },
  saveBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
