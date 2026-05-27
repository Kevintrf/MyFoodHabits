import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SearchStackParamList } from '../navigation/RootNavigator';
import { getAiSettings } from '../db/settings';
import { createFood } from '../db/foods';
import { estimateMeal } from '../services/aiEstimate';
import { AiEstimateResult } from '../services/api';

type NavProp = NativeStackNavigationProp<SearchStackParamList, 'AiEstimate'>;

const CONFIDENCE_COLOR = { high: '#2D6A4F', medium: '#2563EB', low: '#E67E22' };
const CONFIDENCE_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' };

export default function AiEstimateScreen() {
  const navigation = useNavigation<NavProp>();

  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [result, setResult] = useState<AiEstimateResult | null>(null);

  // Editable result fields
  const [editTitle, setEditTitle] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editLiquid, setEditLiquid] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAiSettings().then((s) => {
      if (s.country) setCountry(s.country);
      if (s.anthropic_api_key) setApiKey(s.anthropic_api_key);
    });
  }, []);

  async function handleEstimate() {
    if (!description.trim()) return;
    if (!apiKey.trim()) {
      Alert.alert('API key required', 'Add your Anthropic API key in Settings before using AI estimation.');
      return;
    }
    setEstimating(true);
    setResult(null);
    try {
      const res = await estimateMeal(description.trim(), country.trim() || null, apiKey.trim());
      setResult(res);
      if (!res.error) {
        setEditTitle(res.meal_title ?? '');
        setEditCalories(String(res.per_100g?.calories_kcal ?? ''));
        setEditProtein(String(res.per_100g?.protein_g ?? ''));
        setEditCarbs(String(res.per_100g?.carbs_g ?? ''));
        setEditFat(String(res.per_100g?.fat_g ?? ''));
        setEditWeight(String(res.total_meal?.weight_g ?? ''));
        setEditLiquid(res.liquid ?? false);
      }
    } catch (e) {
      Alert.alert('Estimation failed', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setEstimating(false);
    }
  }

  async function handleSave() {
    const cal = parseFloat(editCalories);
    const pro = parseFloat(editProtein);
    const carb = parseFloat(editCarbs);
    const fat = parseFloat(editFat);
    const weight = parseFloat(editWeight);
    if (!editTitle.trim()) return Alert.alert('Name required', 'Enter a name for this food.');
    if (isNaN(cal) || cal < 0) return Alert.alert('Invalid calories', 'Enter a valid calorie value per 100g.');
    if (isNaN(weight) || weight <= 0) return Alert.alert('Invalid weight', 'Enter the total meal weight.');

    setSaving(true);
    try {
      const food = await createFood({
        name: editTitle.trim(),
        calories_per_100g: cal,
        protein_per_100g: isNaN(pro) ? 0 : pro,
        carbs_per_100g: isNaN(carb) ? 0 : carb,
        fat_per_100g: isNaN(fat) ? 0 : fat,
        liquid: editLiquid,
        ai_estimated: true,
      });
      navigation.replace('Portion', { food, initialQuantity: weight });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save food.');
    } finally {
      setSaving(false);
    }
  }

  const hasResult = result && !result.error;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <Text style={styles.sectionLabel}>DESCRIBE YOUR MEAL</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Big Mac meal with large fries and Coke, or homemade pasta bolognese"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        autoFocus
      />

      <Text style={styles.sectionLabel}>COUNTRY (optional)</Text>
      <TextInput
        style={styles.input}
        value={country}
        onChangeText={setCountry}
        placeholder="e.g. Sweden"
        placeholderTextColor="#bbb"
        autoComplete="off"
        textContentType="none"
      />

      <TouchableOpacity
        style={[styles.estimateBtn, (!description.trim() || estimating) && styles.estimateBtnDisabled]}
        onPress={handleEstimate}
        disabled={!description.trim() || estimating}
      >
        {estimating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.estimateBtnText}>Estimate</Text>
          </>
        )}
      </TouchableOpacity>

      {result?.error && (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={18} color="#c0392b" />
          <Text style={styles.errorText}>{result.error}</Text>
        </View>
      )}

      {hasResult && (
        <>
          <View style={styles.divider} />

          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceBadge, { backgroundColor: CONFIDENCE_COLOR[result.confidence ?? 'low'] + '20' }]}>
              <Text style={[styles.confidenceText, { color: CONFIDENCE_COLOR[result.confidence ?? 'low'] }]}>
                {CONFIDENCE_LABEL[result.confidence ?? 'low']}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>FOOD NAME</Text>
          <TextInput
            style={styles.input}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholderTextColor="#bbb"
            placeholder="Meal name"
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Liquid</Text>
            <Switch value={editLiquid} onValueChange={setEditLiquid} trackColor={{ true: '#2D6A4F', false: '#D1D1D6' }} />
          </View>

          <Text style={styles.sectionLabel}>PER 100{editLiquid ? 'ML' : 'G'}</Text>
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>CALORIES (kcal)</Text>
              <TextInput
                style={styles.input}
                value={editCalories}
                onChangeText={setEditCalories}
                keyboardType="decimal-pad" autoComplete="off" textContentType="none"
                placeholderTextColor="#bbb" placeholder="0"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>PROTEIN (g)</Text>
              <TextInput
                style={styles.input}
                value={editProtein}
                onChangeText={setEditProtein}
                keyboardType="decimal-pad" autoComplete="off" textContentType="none"
                placeholderTextColor="#bbb" placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>CARBS (g)</Text>
              <TextInput
                style={styles.input}
                value={editCarbs}
                onChangeText={setEditCarbs}
                keyboardType="decimal-pad" autoComplete="off" textContentType="none"
                placeholderTextColor="#bbb" placeholder="0"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>FAT (g)</Text>
              <TextInput
                style={styles.input}
                value={editFat}
                onChangeText={setEditFat}
                keyboardType="decimal-pad" autoComplete="off" textContentType="none"
                placeholderTextColor="#bbb" placeholder="0"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>TOTAL PORTION ({editLiquid ? 'ML' : 'G'})</Text>
          <TextInput
            style={styles.input}
            value={editWeight}
            onChangeText={setEditWeight}
            keyboardType="decimal-pad" autoComplete="off" textContentType="none"
            placeholderTextColor="#bbb" placeholder="0"
          />

          <NutritionPreview
            calories={editCalories}
            protein={editProtein}
            carbs={editCarbs}
            fat={editFat}
            weight={editWeight}
            liquid={editLiquid}
          />

          {result.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>ASSUMPTIONS</Text>
              <Text style={styles.notesText}>{result.notes}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save & Log</Text>}
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function NutritionPreview({ calories, protein, carbs, fat, weight, liquid }: {
  calories: string; protein: string; carbs: string; fat: string; weight: string; liquid: boolean;
}) {
  const cal100 = parseFloat(calories) || 0;
  const pro100 = parseFloat(protein) || 0;
  const carb100 = parseFloat(carbs) || 0;
  const fat100 = parseFloat(fat) || 0;
  const w = parseFloat(weight) || 0;
  const m = w / 100;
  const unit = liquid ? 'ml' : 'g';

  return (
    <View style={styles.preview}>
      <View style={styles.previewRow}>
        <Text style={styles.previewHeading}>Per 100{unit}</Text>
        <Text style={styles.previewValues}>
          {fmt(cal100)} kcal · {fmt(pro100)}g P · {fmt(carb100)}g C · {fmt(fat100)}g F
        </Text>
      </View>
      {w > 0 && (
        <View style={[styles.previewRow, styles.previewRowTop]}>
          <Text style={styles.previewHeading}>Total ({fmt(w)}{unit})</Text>
          <Text style={[styles.previewValues, styles.previewTotal]}>
            {fmt(Math.round(cal100 * m))} kcal · {fmt(Math.round(pro100 * m * 10) / 10)}g P · {fmt(Math.round(carb100 * m * 10) / 10)}g C · {fmt(Math.round(fat100 * m * 10) / 10)}g F
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  inputMultiline: { minHeight: 80, paddingTop: 12 },
  estimateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  estimateBtnDisabled: { opacity: 0.5 },
  estimateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  errorText: { flex: 1, fontSize: 14, color: '#c0392b' },
  divider: { height: 1, backgroundColor: '#E5E5E5', marginVertical: 20 },
  confidenceRow: { marginBottom: 8 },
  confidenceBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  confidenceText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 4 },
  preview: {
    backgroundColor: '#F0FAF4',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  previewRowTop: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#C8E6D4' },
  previewHeading: { fontSize: 11, fontWeight: '700', color: '#2D6A4F', letterSpacing: 1 },
  previewValues: { fontSize: 13, color: '#2D6A4F' },
  previewTotal: { fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  toggleLabel: { fontSize: 15, color: '#1A1A1A' },
  notesCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 13, color: '#555', lineHeight: 18 },
  saveBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
