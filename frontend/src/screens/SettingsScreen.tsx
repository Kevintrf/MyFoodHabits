import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { updateTargets } from '../services/api';
import { showAlert } from '../utils/alert';

export default function SettingsScreen() {
  const { targets, refreshTargets } = useApp();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCalories(String(targets.target_calories ?? ''));
    setProtein(String(targets.target_protein_g ?? ''));
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
      await updateTargets({ target_calories: cal, target_protein_g: pro });
      await refreshTargets();
      showAlert('Saved', 'Your targets have been updated.');
    } catch {
      showAlert('Error', 'Could not save targets. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
});
