import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DaySummary } from '../services/api';
import { getMonthSummary } from '../db/log';
import { useApp } from '../context/AppContext';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { todayDate, viewingDate, setViewingDate, targets } = useApp();

  const today = new Date(todayDate + 'T00:00:00');
  const [displayYear, setDisplayYear] = useState(() => {
    const d = new Date(viewingDate + 'T00:00:00');
    return d.getFullYear();
  });
  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = new Date(viewingDate + 'T00:00:00');
    return d.getMonth() + 1; // 1–12
  });
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMonthSummary(displayYear, displayMonth)
      .then(setSummaries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [displayYear, displayMonth]);

  const summaryMap: Record<string, number> = {};
  for (const s of summaries) {
    summaryMap[s.date] = Number(s.calories);
  }

  const targetCal = targets.target_calories ?? 2000;

  function prevMonth() {
    if (displayMonth === 1) {
      setDisplayMonth(12);
      setDisplayYear((y) => y - 1);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const nextYear = displayMonth === 12 ? displayYear + 1 : displayYear;
    const nextMon = displayMonth === 12 ? 1 : displayMonth + 1;
    if (nextYear > today.getFullYear() || (nextYear === today.getFullYear() && nextMon > today.getMonth() + 1)) return;
    setDisplayYear(nextYear);
    setDisplayMonth(nextMon);
  }

  const isNextDisabled =
    displayYear === today.getFullYear() && displayMonth === today.getMonth() + 1;

  // Build calendar grid (Monday-first)
  const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();
  const firstDayOfWeek = (new Date(displayYear, displayMonth - 1, 1).getDay() + 6) % 7; // 0=Mon

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthName = new Date(displayYear, displayMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function dateStr(day: number): string {
    return `${displayYear}-${String(displayMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function isFuture(day: number) {
    return dateStr(day) > todayDate;
  }

  function isToday(day: number) {
    return dateStr(day) === todayDate;
  }

  function isSelected(day: number) {
    return dateStr(day) === viewingDate;
  }

  function dotColor(day: number): string | null {
    const cal = summaryMap[dateStr(day)];
    if (cal === undefined) return null;
    return cal <= targetCal ? '#2D6A4F' : '#e74c3c';
  }

  function handleDayPress(day: number) {
    setViewingDate(dateStr(day));
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.navBtn}
          disabled={isNextDisabled}
        >
          <Text style={[styles.navArrow, isNextDisabled && styles.navArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={styles.weekDayLabel}>{d}</Text>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2D6A4F" />
      ) : (
        weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (!day) {
                return <View key={di} style={styles.dayCell} />;
              }

              const future = isFuture(day);
              const color = dotColor(day);
              const todayDay = isToday(day);
              const selected = isSelected(day);

              return (
                <TouchableOpacity
                  key={di}
                  style={styles.dayCell}
                  onPress={() => !future && handleDayPress(day)}
                  disabled={future}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayCircle,
                    color ? { backgroundColor: color } : null,
                    todayDay && !color ? styles.dayCircleToday : null,
                    selected ? styles.dayCircleSelected : null,
                  ]}>
                    <Text style={[
                      styles.dayNum,
                      color ? styles.dayNumOnColor : null,
                      todayDay && !color ? styles.dayNumToday : null,
                      future ? styles.dayNumFuture : null,
                    ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2D6A4F' }]} />
          <Text style={styles.legendText}>Within goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>Over goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E5E5E5' }]} />
          <Text style={styles.legendText}>Nothing logged</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16, paddingBottom: 40 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, color: '#2D6A4F', fontWeight: '300' },
  navArrowDisabled: { color: '#ccc' },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingBottom: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  dayCircleSelected: {
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  dayNum: { fontSize: 14, color: '#1A1A1A', fontWeight: '400' },
  dayNumOnColor: { color: '#fff', fontWeight: '600' },
  dayNumToday: { color: '#2D6A4F', fontWeight: '700' },
  dayNumFuture: { color: '#ccc' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666' },
});
