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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { updateTargets } from '../db/settings';
import { ActivityLevel } from '../services/api';
import { exportAllData, importAllData } from '../db/dataTransfer';

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
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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

  async function handleExport() {
    setExporting(true);
    try {
      await exportAllData();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    Alert.alert(
      'Import data',
      'This will overwrite all current data. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await importAllData();
              if (result.success) {
                await refreshTargets();
                Alert.alert('Import complete', 'Your data has been restored.');
              } else if (result.error) {
                Alert.alert('Import failed', result.error);
              }
            } finally {
              setImporting(false);
            }
          },
        },
      ],
    );
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

      <Text style={styles.sectionHeading}>DAILY TARGETS</Text>
      <View style={styles.card}>
        <Text style={styles.label}>CALORIES (kcal)</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={handleCaloriesChange}
          keyboardType="number-pad" autoComplete="off" textContentType="none"
          placeholder="e.g. 2000"
          placeholderTextColor="#bbb"
        />
        <View style={styles.cardDivider} />
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

      <Text style={styles.sectionHeading}>ACTIVITY LEVEL</Text>
      <View style={[styles.card, styles.cardNoPadding]}>
        {ACTIVITY_LEVELS.map((lvl, i) => (
          <TouchableOpacity
            key={lvl.value}
            style={[
              styles.activityOption,
              activityLevel === lvl.value && styles.activityOptionActive,
              i < ACTIVITY_LEVELS.length - 1 && styles.activityOptionBorder,
            ]}
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

      <Text style={styles.sectionHeading}>TRACKING</Text>
      <View style={[styles.card, styles.cardNoPadding]}>
        <TouchableOpacity style={styles.toggleRow} onPress={handleVitaminsToggle}>
          <Ionicons
            name={showVitamins ? 'checkbox' : 'square-outline'}
            size={24}
            color={showVitamins ? '#2D6A4F' : '#ccc'}
          />
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>Vitamins</Text>
            <Text style={styles.toggleDesc}>Show a daily vitamins checkbox</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeading}>DATA</Text>
      <View style={[styles.card, styles.cardNoPadding]}>
        <TouchableOpacity style={styles.dataRow} onPress={handleExport} disabled={exporting}>
          <Ionicons name="share-outline" size={22} color="#2D6A4F" />
          <View style={styles.dataText}>
            <Text style={styles.dataLabel}>Export data</Text>
            <Text style={styles.dataDesc}>Save a backup of all your foods, logs, and settings</Text>
          </View>
          {exporting ? <ActivityIndicator size="small" color="#2D6A4F" /> : <Ionicons name="chevron-forward" size={18} color="#ccc" />}
        </TouchableOpacity>
        <View style={styles.activityOptionBorder} />
        <TouchableOpacity style={styles.dataRow} onPress={handleImport} disabled={importing}>
          <Ionicons name="download-outline" size={22} color="#2D6A4F" />
          <View style={styles.dataText}>
            <Text style={styles.dataLabel}>Import data</Text>
            <Text style={styles.dataDesc}>Restore from a previously exported backup file</Text>
          </View>
          {importing ? <ActivityIndicator size="small" color="#2D6A4F" /> : <Ionicons name="chevron-forward" size={18} color="#ccc" />}
        </TouchableOpacity>
      </View>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 20, paddingBottom: 40 },
  sectionHeading: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardNoPadding: { padding: 0 },
  cardDivider: { height: 1, backgroundColor: '#E5E5E5', marginVertical: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  activityOption: { padding: 14 },
  activityOptionActive: { backgroundColor: '#F0FAF4' },
  activityOptionBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  activityLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  activityLabelActive: { color: '#2D6A4F', fontWeight: '600' },
  activityDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  activityDescActive: { color: '#2D6A4F' },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  dataText: { flex: 1 },
  dataLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  dataDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  toggleDesc: { fontSize: 12, color: '#999', marginTop: 2 },
});
