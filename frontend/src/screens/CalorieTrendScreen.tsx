import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyNutritionHistory } from '../db/log';
import { getTargets } from '../db/settings';
import { UserTargets } from '../services/api';
import { fmtNum } from '../utils/format';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const CHART_HEIGHT = 200;
const CHART_PAD_LEFT = 48;
const CHART_PAD_RIGHT = 12;
const CHART_PAD_TOP = 12;
const CHART_PAD_BOTTOM = 28;

const GREEN = '#2D6A4F';
const RED   = '#e74c3c';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Range = 7 | 30 | 90;
interface DayData { date: string; calories: number; protein_g: number }
interface Pt { date: string; value: number }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date {
  return new Date(iso.slice(0, 10) + 'T00:00:00');
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d); c.setDate(c.getDate() + n); return c;
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function shortDateLabel(iso: string): string {
  const d = isoToDate(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
function movingAvg(pts: Pt[], window = 7): Pt[] {
  return pts.map((p, i) => {
    const half = Math.floor(window / 2);
    const slice = pts.slice(Math.max(0, i - half), Math.min(pts.length, i + half + 1));
    return { date: p.date, value: Math.round(slice.reduce((s, x) => s + x.value, 0) / slice.length) };
  });
}

// ─────────────────────────────────────────────────────────────
// Chart component
// ─────────────────────────────────────────────────────────────

function NutrientChart({
  pts, avgPts, goalValue, color, avgColor, showAvg, width, unit, lowerIsBetter,
}: {
  pts: Pt[];
  avgPts: Pt[];
  goalValue: number;
  color: string;
  avgColor: string;
  showAvg: boolean;
  width: number;
  unit: string;
  lowerIsBetter: boolean;
}) {
  if (pts.length === 0) return null;

  const allDates = pts.map((p) => p.date).sort();
  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];
  const totalDays = Math.max(1, daysBetween(isoToDate(minDate), isoToDate(maxDate)));

  const allValues = [...pts.map((p) => p.value), goalValue];
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const span = Math.max(rawMax - rawMin, 1);
  const pad = span * 0.2;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;

  const drawW = width - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const drawH = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  function xFor(iso: string) {
    return CHART_PAD_LEFT + (daysBetween(isoToDate(minDate), isoToDate(iso)) / totalDays) * drawW;
  }
  function yFor(v: number) {
    return CHART_PAD_TOP + drawH - ((v - yMin) / (yMax - yMin)) * drawH;
  }
  function toPath(points: Pt[]): string {
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${xFor(p.date).toFixed(1)},${yFor(p.value).toFixed(1)}`
    ).join(' ');
  }
  function dotColor(value: number): string {
    const atOrUnder = value <= goalValue;
    return (lowerIsBetter ? atOrUnder : !atOrUnder) ? GREEN : RED;
  }

  const gridCount = 4;
  const yGridLines: number[] = Array.from({ length: gridCount + 1 }, (_, i) =>
    yMin + (i / gridCount) * (yMax - yMin)
  );

  const sorted = [...pts].sort((a, b) => a.date.localeCompare(b.date));
  const step = Math.max(1, Math.floor((sorted.length - 1) / 4));
  const xLabels: Pt[] = [];
  for (let i = 0; i < sorted.length; i += step) xLabels.push(sorted[i]);
  if (xLabels[xLabels.length - 1]?.date !== sorted[sorted.length - 1]?.date) {
    xLabels.push(sorted[sorted.length - 1]);
  }

  const mainPath = toPath(sorted);
  const filledPath = `${mainPath} L${xFor(sorted[sorted.length - 1].date).toFixed(1)},${(CHART_PAD_TOP + drawH).toFixed(1)} L${xFor(sorted[0].date).toFixed(1)},${(CHART_PAD_TOP + drawH).toFixed(1)} Z`;
  const goalY = yFor(goalValue).toFixed(1);

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id={`grad_${unit}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.12" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Grid */}
      {yGridLines.map((v, i) => {
        const y = yFor(v).toFixed(1);
        return (
          <React.Fragment key={i}>
            <Line x1={CHART_PAD_LEFT} y1={y} x2={width - CHART_PAD_RIGHT} y2={y} stroke="#E5E5E5" strokeWidth="1" />
            <SvgText x={CHART_PAD_LEFT - 4} y={parseFloat(y) + 4} fontSize="9" fill="#999" textAnchor="end">
              {Math.round(v)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X labels */}
      {xLabels.map(({ date }) => (
        <SvgText key={date} x={xFor(date).toFixed(1)} y={CHART_HEIGHT - 6} fontSize="9" fill="#999" textAnchor="middle">
          {shortDateLabel(date)}
        </SvgText>
      ))}

      {/* Goal line */}
      <Line x1={CHART_PAD_LEFT} y1={goalY} x2={width - CHART_PAD_RIGHT} y2={goalY}
        stroke="#E67E22" strokeWidth="1.5" strokeDasharray="6,4" />
      <SvgText x={width - CHART_PAD_RIGHT - 2} y={parseFloat(goalY) - 4} fontSize="9" fill="#E67E22" textAnchor="end">
        Goal
      </SvgText>

      {/* Fill + line */}
      <Path d={filledPath} fill={`url(#grad_${unit})`} />
      <Path d={mainPath} stroke={color} strokeWidth="2" fill="none" />

      {/* Coloured dots */}
      {sorted.length <= 30 && sorted.map((p, i) => (
        <Circle key={i}
          cx={xFor(p.date).toFixed(1)} cy={yFor(p.value).toFixed(1)}
          r="3.5" fill="#fff" stroke={dotColor(p.value)} strokeWidth="2"
        />
      ))}

      {/* 7d avg overlay */}
      {showAvg && avgPts.length > 1 && (
        <Path d={toPath(avgPts)} stroke={avgColor} strokeWidth="2" fill="none" strokeDasharray="4,3" />
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Summary card
// ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, avg, target, unit, daysLogged, totalDays, daysAtGoal, atGoalLabel, lowerIsBetter,
}: {
  label: string;
  avg: number;
  target: number;
  unit: string;
  daysLogged: number;
  totalDays: number;
  daysAtGoal: number;
  atGoalLabel: string;
  lowerIsBetter: boolean;
}) {
  const pct = target > 0 ? avg / target : 0;
  const barPct = Math.min(pct, 1.5) / 1.5;

  // For calories (lowerIsBetter): green = under, red = over
  // For protein (!lowerIsBetter): green = over, red = under
  let valueColor: string;
  if (lowerIsBetter) {
    valueColor = pct <= 1.0 ? GREEN : RED;
  } else {
    valueColor = pct >= 1.0 ? GREEN : RED;
  }

  return (
    <View style={summaryStyles.card}>
      <Text style={summaryStyles.cardLabel}>{label}</Text>
      <View style={summaryStyles.mainRow}>
        <Text style={[summaryStyles.avgValue, { color: valueColor }]}>
          {fmtNum(Math.round(avg))}
        </Text>
        <Text style={summaryStyles.targetText}> / {fmtNum(target)} {unit}</Text>
      </View>
      <View style={summaryStyles.barTrack}>
        <View style={[summaryStyles.barFill, { width: `${Math.min(barPct * 100, 100)}%` as any, backgroundColor: valueColor }]} />
        <View style={[summaryStyles.barGoalMark, { left: `${(1 / 1.5) * 100}%` as any }]} />
      </View>
      <View style={summaryStyles.statsRow}>
        <Text style={summaryStyles.stat}>{daysLogged}/{totalDays} days logged</Text>
        <Text style={summaryStyles.stat}>{daysAtGoal} {atGoalLabel}</Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 8 },
  mainRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  avgValue: { fontSize: 28, fontWeight: '700' },
  targetText: { fontSize: 15, color: '#999' },
  barTrack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10, position: 'relative', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, position: 'absolute', left: 0, top: 0 },
  barGoalMark: { position: 'absolute', top: -2, width: 2, height: 10, backgroundColor: '#E67E22', borderRadius: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { fontSize: 12, color: '#666' },
});

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function CalorieTrendScreen() {
  const chartWidth = Dimensions.get('window').width - 32;

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(30);
  const [showAvg, setShowAvg] = useState(false);

  const [allData, setAllData] = useState<DayData[]>([]);
  const [targets, setTargets] = useState<UserTargets>({
    target_calories: 2000, target_protein_g: 150, activity_level: 'SEDENTARY', show_vitamins: false,
  });

  const load = useCallback(async () => {
    const [data, t] = await Promise.all([getDailyNutritionHistory(90), getTargets()]);
    setAllData(data);
    setTargets(t);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} color="#2D6A4F" />;

  const today = new Date();
  const data = allData.filter((d) => isoToDate(d.date) >= addDays(today, -range));

  const calPts: Pt[] = data.map((d) => ({ date: d.date, value: d.calories }));
  const proPts: Pt[] = data.map((d) => ({ date: d.date, value: d.protein_g }));
  const calAvgPts = movingAvg(calPts);
  const proAvgPts = movingAvg(proPts);

  const daysLogged = data.length;
  const calTarget = targets.target_calories ?? 2000;
  const proTarget = targets.target_protein_g ?? 150;
  const avgCal = daysLogged > 0 ? data.reduce((s, d) => s + d.calories, 0) / daysLogged : 0;
  const avgPro = daysLogged > 0 ? data.reduce((s, d) => s + d.protein_g, 0) / daysLogged : 0;
  // Calories: on target = within ±10%; protein: on target = at or above
  const daysCalAtGoal = data.filter((d) => d.calories >= calTarget * 0.9 && d.calories <= calTarget * 1.1).length;
  const daysProAtGoal = data.filter((d) => d.protein_g >= proTarget).length;

  const emptyChart = (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyText}>Log food on at least 2 days to see the chart.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.toggleGroup}>
          {([7, 30, 90] as Range[]).map((r) => (
            <TouchableOpacity key={r}
              style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>{r}d</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, showAvg && styles.toggleBtnActive]}
          onPress={() => setShowAvg((v) => !v)}
        >
          <Text style={[styles.toggleText, showAvg && styles.toggleTextActive]}>7d avg</Text>
        </TouchableOpacity>
      </View>

      {/* Calories chart */}
      <Text style={styles.chartLabel}>CALORIES</Text>
      {calPts.length < 2 ? emptyChart : (
        <View style={styles.chartCard}>
          <NutrientChart pts={calPts} avgPts={calAvgPts} goalValue={calTarget}
            color="#2D6A4F" avgColor="#74B49B" showAvg={showAvg}
            width={chartWidth} unit="kcal" lowerIsBetter={true} />
        </View>
      )}

      {/* Protein chart */}
      <Text style={styles.chartLabel}>PROTEIN</Text>
      {proPts.length < 2 ? emptyChart : (
        <View style={styles.chartCard}>
          <NutrientChart pts={proPts} avgPts={proAvgPts} goalValue={proTarget}
            color="#2980B9" avgColor="#85C1E9" showAvg={showAvg}
            width={chartWidth} unit="g" lowerIsBetter={false} />
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#2D6A4F' }]} />
          <Text style={styles.legendText}>Calories</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#2980B9' }]} />
          <Text style={styles.legendText}>Protein</Text>
        </View>
        {showAvg && (
          <View style={styles.legendItem}>
            <View style={styles.legendDashed} />
            <Text style={styles.legendText}>7d avg</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDashed, { borderColor: '#E67E22' }]} />
          <Text style={styles.legendText}>Goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: GREEN }]} />
          <Text style={styles.legendText}>At/under</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: RED }]} />
          <Text style={styles.legendText}>Over</Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.sectionHeader}>{`LAST ${range} DAYS`}</Text>

      {daysLogged === 0 ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No food logged in this period.</Text>
        </View>
      ) : (
        <>
          <SummaryCard label="CALORIES" avg={avgCal} target={calTarget} unit="kcal"
            daysLogged={daysLogged} totalDays={range}
            daysAtGoal={daysCalAtGoal} atGoalLabel="days on target (±10%)"
            lowerIsBetter={true} />
          <SummaryCard label="PROTEIN" avg={avgPro} target={proTarget} unit="g"
            daysLogged={daysLogged} totalDays={range}
            daysAtGoal={daysProAtGoal} atGoalLabel="days at goal"
            lowerIsBetter={false} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16, paddingBottom: 40 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toggleGroup: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#fff',
  },
  toggleBtnActive: { borderColor: '#2D6A4F', backgroundColor: '#2D6A4F' },
  toggleText: { fontSize: 13, fontWeight: '500', color: '#666' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  chartLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 6 },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 8, marginBottom: 12 },
  emptyChart: { backgroundColor: '#fff', borderRadius: 12, padding: 32, marginBottom: 12, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine: { width: 18, height: 2, borderRadius: 1 },
  legendDashed: { width: 18, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#999' },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', borderWidth: 2 },
  legendText: { fontSize: 11, color: '#555' },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 10 },
});
