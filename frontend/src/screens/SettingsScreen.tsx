import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { updateTargets } from '../db/settings';
import { showAlert } from '../utils/alert';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCalories(String(targets.target_calories ?? ''));
    setProtein(String(targets.target_protein_g ?? ''));
    setActivityLevel(targets.activity_level ?? 'SEDENTARY');
  }, [targets]);

  async function handleSave() {
    const cal = parseInt(calories);
    const pro = parseInt(protein);

    if (isNaN(cal) || cal <= 0 || isNaN(pro) || pro <= 0) {
      showAlert('Invalid values', 'Calorie and protein targets must be positive numbers.');
      return;
    }

    setSaving(true);
    try {
      await updateTargets({ target_calories: cal, target_protein_g: pro, activity_level: activityLevel });
      await refreshTargets();
      showAlert('Saved', 'Your targets have been updated.');
    } catch {
      showAlert('Error', 'Could not save targets. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Daily Targets</Text>

      <View style={styles.field}>
        <Text style={styles.label}>CALORIES (kcal)</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          placeholder="e.g. 2000"
          placeholderTextColor="#bbb"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>PROTEIN (g)</Text>
        <TextInput
          style={styles.input}
          value={protein}
          onChangeText={setProtein}
          keyboardType="number-pad"
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
            onPress={() => setActivityLevel(lvl.value)}
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 20, paddingTop: 56 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 28 },
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
  saveBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
});
