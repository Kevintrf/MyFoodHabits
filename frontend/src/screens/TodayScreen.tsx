import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

// TODO: pull from user settings once auth exists
const TARGETS = { calories: 2000, protein_g: 150 };
const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export default function TodayScreen() {
  const { todayLog, todayDate, refreshTodayLog } = useApp();
  const navigation = useNavigation<any>();

  useEffect(() => {
    refreshTodayLog();
  }, []);

  const totals = todayLog?.totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const slots = todayLog?.slots ?? {};

  const dateLabel = new Date(todayDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>

      {/* Macro summary */}
      <View style={styles.macroRow}>
        <MacroCard
          label="Calories"
          value={Math.round(totals.calories)}
          target={TARGETS.calories}
          unit="kcal"
        />
        <MacroCard
          label="Protein"
          value={Math.round(totals.protein_g)}
          target={TARGETS.protein_g}
          unit="g"
        />
      </View>

      {/* Log items grouped by meal slot */}
      {MEAL_SLOTS.map((slot) => {
        const items = slots[slot];
        if (!items?.length) return null;
        return (
          <View key={slot} style={styles.section}>
            <Text style={styles.slotHeader}>{slot}</Text>
            {items.map((item) => {
              const portionLabel = item.serving_name
                ? `${item.quantity} × ${item.serving_name}`
                : `${item.quantity * item.serving_grams}${item.liquid ? 'ml' : 'g'}`;
              return (
                <View key={item.id} style={styles.logItem}>
                  <View style={styles.logItemLeft}>
                    <Text style={styles.logItemName}>{item.food_name}</Text>
                    <Text style={styles.logItemSub}>{portionLabel}</Text>
                  </View>
                  <View style={styles.logItemRight}>
                    <Text style={styles.logItemCal}>{item.macros.calories} kcal</Text>
                    <Text style={styles.logItemPro}>{item.macros.protein_g}g protein</Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {!todayLog && (
        <Text style={styles.emptyState}>Nothing logged today yet.</Text>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('SearchTab')}
      >
        <Text style={styles.addButtonText}>+ Add Food</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MacroCard({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(value / target, 1);
  const over = value > target;
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value} <Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <Text style={styles.macroTarget}>/ {target} {unit}</Text>
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct * 100}%` as any, backgroundColor: over ? '#e74c3c' : '#2D6A4F' },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { paddingBottom: 40 },
  dateLabel: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingTop: 56 },
  macroRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  macroCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  macroValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  macroUnit: { fontSize: 14, fontWeight: '400', color: '#666' },
  macroTarget: { fontSize: 12, color: '#999', marginBottom: 8 },
  progressBg: { height: 4, backgroundColor: '#E5E5E5', borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  section: { marginHorizontal: 16, marginTop: 20 },
  slotHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  logItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    alignItems: 'center',
  },
  logItemLeft: { flex: 1 },
  logItemName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  logItemSub: { fontSize: 13, color: '#999', marginTop: 2 },
  logItemRight: { alignItems: 'flex-end' },
  logItemCal: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  logItemPro: { fontSize: 12, color: '#2D6A4F', marginTop: 2 },
  emptyState: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
  addButton: {
    margin: 16,
    marginTop: 28,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
