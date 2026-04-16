import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { WeightEntry } from '../services/api';
import { getWeights, logWeight } from '../db/weight';
import { useApp } from '../context/AppContext';

export default function WeightScreen() {
  const { refreshWeightToday } = useApp();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWeights = useCallback(async () => {
    const data = await getWeights();
    setEntries(data);
  }, []);

  useEffect(() => {
    fetchWeights().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchWeights().finally(() => setRefreshing(false));
  }

  async function handleLog() {
    const kg = parseFloat(input);
    if (!kg || kg <= 0 || kg > 500) return showAlert('Enter a valid weight in kg');
    setSaving(true);
    try {
      const entry = await logWeight(kg);
      setEntries((prev) => [entry, ...prev]);
      setInput('');
      await refreshWeightToday();
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={styles.loader} color="#2D6A4F" />;

  const latest = entries[0];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.header}>Weight</Text>

      {latest && (
        <View style={styles.latestCard}>
          <Text style={styles.latestLabel}>Latest</Text>
          <Text style={styles.latestValue}>{latest.weight_kg} <Text style={styles.latestUnit}>kg</Text></Text>
          <Text style={styles.latestDate}>
            {new Date(latest.logged_at).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })}
          </Text>
        </View>
      )}

      {/* Log new weight */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Weight in kg"
          value={input}
          onChangeText={setInput}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <TouchableOpacity style={styles.logBtn} onPress={handleLog} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.logBtnText}>Log</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.historyLabel}>History</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryDate}>
              {new Date(item.logged_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </Text>
            <Text style={styles.entryWeight}>{item.weight_kg} kg</Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, marginTop: 100 },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingTop: 56 },
  latestCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  latestLabel: { fontSize: 12, color: '#999', letterSpacing: 1, marginBottom: 4 },
  latestValue: { fontSize: 40, fontWeight: '700', color: '#1A1A1A' },
  latestUnit: { fontSize: 20, fontWeight: '400', color: '#666' },
  latestDate: { fontSize: 13, color: '#999', marginTop: 4 },
  inputRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  logBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  historyLabel: { fontSize: 13, fontWeight: '700', color: '#999', letterSpacing: 1, marginHorizontal: 16, marginBottom: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 8,
    padding: 12,
  },
  entryDate: { fontSize: 14, color: '#666' },
  entryWeight: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
});
