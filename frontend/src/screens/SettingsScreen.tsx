import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { updateTargets } from '../db/settings';
import { ActivityLevel } from '../services/api';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'SEDENTARY',          label: 'Sedentary',          description: 'Desk job, little or no exercise' },
  { value: 'LIGHTLY_ACTIVE',     label: 'Lightly active',     description: 'Light exercise 1–3 days/week' },
  { value: 'MODERATELY_ACTIVE',  label: 'Moderately active',  description: 'Moderate exercise 3–5 days/week' },
  { value: 'VERY_ACTIVE',        label: 'Very active',        description: 'Hard exercise 6–7 days/week' },
  { value: 'EXTREMELY_ACTIVE',   label: 'Extremely active',   description: 'Very hard exercise or physical job' },
];

export default function SettingsScreen() {
  const { targets, refreshTargets } = useApp();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('SEDENTARY');
  const [showVitamins, setShowVitamins] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    setCalories(String(targets.target_calories ?? ''));
    setProtein(String(targets.target_protein_g ?? ''));
    setActivityLevel(targets.activity_level ?? 'SEDENTARY');
    setShowVitamins(targets.show_vitamins ?? false);
    initialised.current = true;
  }, [targets]);

  const save = useCallback(async (cal: string, pro: string, activity: ActivityLevel, vitamins: boolean) => {
    const calNum = parseInt(cal);
    const proNum = parseInt(pro);
    if (isNaN(calNum) || calNum <= 0 || isNaN(proNum) || proNum <= 0) return;
    await updateTargets({ target_calories: calNum, target_protein_g: proNum, activity_level: activity, show_vitamins: vitamins });
    await refreshTargets();
  }, [refreshTargets]);

  function scheduleTextSave(cal: string, pro: string, activity: ActivityLevel, vitamins: boolean) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(cal, pro, activity, vitamins), 600);
  }

  function handleCaloriesChange(val: string) {
    setCalories(val);
    scheduleTextSave(val, protein, activityLevel, showVitamins);
  }

  function handleProteinChange(val: string) {
    setProtein(val);
    scheduleTextSave(calories, val, activityLevel, showVitamins);
  }

  async function handleActivityChange(level: ActivityLevel) {
    setActivityLevel(level);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await save(calories, protein, level, showVitamins);
  }

  async function handleVitaminsToggle() {
    const next = !showVitamins;
    setShowVitamins(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await save(calories, protein, activityLevel, next);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>CALORIES (kcal)</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={handleCaloriesChange}
          keyboardType="number-pad" autoComplete="off" textContentType="none"
          placeholder="e.g. 2000"
          placeholderTextColor="#bbb"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>PROTEIN (g)</Text>
        <TextInput
          style={styles.input}
          value={protein}
          onChangeText={handleProteinChange}
          keyboardType="number-pad" autoComplete="off" textContentType="none"
          placeholder="e.g. 150"
          placeholderTextColor="#bbb"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>ACTIVITY LEVEL</Text>
        {ACTIVITY_LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.value}
            style={[styles.activityOption, activityLevel === lvl.value && styles.activityOptionActive]}
            onPress={() => handleActivityChange(lvl.value)}
          >
            <Text style={[styles.activityLabel, activityLevel === lvl.value && styles.activityLabelActive]}>
              {lvl.label}
            </Text>
            <Text style={[styles.activityDesc, activityLevel === lvl.value && styles.activityDescActive]}>
              {lvl.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>TRACKING</Text>
        <TouchableOpacity style={styles.toggleRow} onPress={handleVitaminsToggle}>
          <View>
            <Text style={styles.toggleLabel}>Vitamins</Text>
            <Text style={styles.toggleDesc}>Show a daily vitamins checkbox on the Today screen</Text>
          </View>
          <Ionicons
            name={showVitamins ? 'checkbox' : 'square-outline'}
            size={24}
            color={showVitamins ? '#2D6A4F' : '#ccc'}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  activityOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  activityOptionActive: { borderColor: '#2D6A4F', backgroundColor: '#F0FAF4' },
  activityLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  activityLabelActive: { color: '#2D6A4F', fontWeight: '600' },
  activityDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  activityDescActive: { color: '#2D6A4F' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 12,
  },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  toggleDesc: { fontSize: 12, color: '#999', marginTop: 2 },
});
