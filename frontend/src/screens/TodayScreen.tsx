import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showAlert } from '../utils/alert';
import { useApp } from '../context/AppContext';
import { LogItem, deleteLogItem, updateLogItem } from '../services/api';
import { fmtNum } from '../utils/format';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export default function TodayScreen() {
  const { todayLog, todayDate, refreshTodayLog, targets, refreshTargets } = useApp();
  const navigation = useNavigation<any>();
  const [editTarget, setEditTarget] = useState<{ item: LogItem; slot: string } | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshTodayLog();
    refreshTargets();
  }, []);

  function openEdit(item: LogItem, slot: string) {
    setEditTarget({ item, slot });
    setEditQty(String(item.quantity));
    setEditSlot(slot);
  }

  async function handleSave() {
    if (!editTarget) return;
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty <= 0) return;
    setSaving(true);
    try {
      await updateLogItem(editTarget.item.id, { quantity: qty, meal_slot: editSlot });
      await refreshTodayLog();
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!editTarget) return;
    showAlert(
      'Delete item',
      `Remove ${editTarget.item.food_name} from your log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLogItem(editTarget.item.id);
            await refreshTodayLog();
            setEditTarget(null);
          },
        },
      ],
    );
  }

  const totals = todayLog?.totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const slots = todayLog?.slots ?? {};

  const dateLabel = new Date(todayDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>

        {/* Macro summary */}
        <View style={styles.macroRow}>
          <MacroCard
            label="Calories"
            value={Math.round(totals.calories)}
            target={targets.target_calories ?? 2000}
            unit="kcal"
          />
          <MacroCard
            label="Protein"
            value={Math.round(totals.protein_g)}
            target={targets.target_protein_g ?? 150}
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
                const unit = item.liquid ? 'ml' : 'g';
                const totalGrams = item.quantity * item.serving_grams;
                const portionLabel = item.serving_name
                  ? `${item.quantity} × ${item.serving_name} (${totalGrams}${unit})`
                  : `${totalGrams}${unit}`;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.logItem}
                    onPress={() => openEdit(item, slot)}
                  >
                    <View style={styles.logItemLeft}>
                      <Text style={styles.logItemName}>{item.food_name}</Text>
                      <Text style={styles.logItemSub}>{portionLabel}</Text>
                    </View>
                    <View style={styles.logItemRight}>
                      <Text style={styles.logItemCal}>{fmtNum(item.macros.calories)} kcal</Text>
                      <Text style={styles.logItemPro}>{fmtNum(item.macros.protein_g)}g Protein · {fmtNum(item.macros.carbs_g)}g Carbs · {fmtNum(item.macros.fat_g)}g Fat</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {Object.keys(slots).length === 0 && (
          <Text style={styles.emptyState}>Nothing logged today yet.</Text>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('SearchTab', { screen: 'Search' })}
        >
          <Text style={styles.addButtonText}>+ Add Food</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit / delete modal */}
      <Modal
        visible={!!editTarget}
        animationType="none"
        transparent
        onRequestClose={() => setEditTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditTarget(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editTarget?.item.food_name}</Text>

            <Text style={styles.modalLabel}>QUANTITY</Text>
            <TextInput
              style={styles.modalInput}
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={styles.modalLabel}>MEAL</Text>
            <View style={styles.slotRow}>
              {MEAL_SLOTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.slotBtn, editSlot === s && styles.slotBtnActive]}
                  onPress={() => setEditSlot(s)}
                >
                  <Text style={[styles.slotBtnText, editSlot === s && styles.slotBtnTextActive]}>
                    {s[0] + s.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete from log</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditTarget(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  slotRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  slotBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  slotBtnActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  slotBtnText: { fontSize: 11, fontWeight: '600', color: '#666' },
  slotBtnTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: { padding: 14, alignItems: 'center', marginBottom: 4 },
  deleteBtnText: { color: '#e74c3c', fontSize: 16, fontWeight: '500' },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#999', fontSize: 15 },
});
