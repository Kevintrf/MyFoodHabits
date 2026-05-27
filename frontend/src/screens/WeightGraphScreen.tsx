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
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { getWeights } from '../db/weight';
import { getCalorieHistory } from '../db/log';
import { getTargets } from '../db/settings';
import { WeightEntry, UserTargets, ActivityLevel } from '../services/api';
import { calculateTDEE, calibrateTDEE } from '../utils/tdee';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const KCAL_PER_KG = 7700;

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY:         1.2,
  LIGHTLY_ACTIVE:    1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE:       1.725,
  EXTREMELY_ACTIVE:  1.9,
};

const CHART_HEIGHT = 220;
const CHART_PADDING_LEFT  = 48;
const CHART_PADDING_RIGHT = 12;
const CHART_PADDING_TOP   = 12;
const CHART_PADDING_BOTTOM = 28;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChartPoint { date: string; weight: number; predicted?: boolean }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date {
  return new Date(iso.slice(0, 10) + 'T00:00:00');
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function shortDateLabel(iso: string): string {
  const d = isoToDate(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// 7-day moving average (centred or trailing)
function movingAvg(points: ChartPoint[], window = 7): ChartPoint[] {
  return points.map((p, i) => {
    const half = Math.floor(window / 2);
    const slice = points.slice(Math.max(0, i - half), Math.min(points.length, i + half + 1));
    const avg = slice.reduce((s, x) => s + x.weight, 0) / slice.length;
    return { ...p, weight: Math.round(avg * 100) / 100 };
  });
}

// Build prediction points starting from startWeight, for forecastDays days forward
function buildPrediction(
  startDate: Date,
  startWeight: number,
  dailyNetCalories: number,
  forecastDays: number,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const dailyWeightChange = dailyNetCalories / KCAL_PER_KG;
  for (let i = 1; i <= forecastDays; i++) {
    points.push({
      date: dateToISO(addDays(startDate, i)),
      weight: Math.round((startWeight + dailyWeightChange * i) * 100) / 100,
      predicted: true,
    });
  }
  return points;
}

// ─────────────────────────────────────────────────────────────
// SVG Chart
// ─────────────────────────────────────────────────────────────

interface ChartSeries {
  points: ChartPoint[];
  color: string;
  dashed?: boolean;
  dotted?: boolean;
  filled?: boolean;
  showDots?: boolean;
}

function WeightChart({
  series,
  width,
  xLabels,
}: {
  series: ChartSeries[];
  width: number;
  xLabels: { date: string; label: string }[];
}) {
  const allWeights = series.flatMap((s) => s.points.map((p) => p.weight));
  if (allWeights.length === 0) return null;

  const allDates = series.flatMap((s) => s.points.map((p) => p.date)).sort();
  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];
  const totalDays = Math.max(1, daysBetween(isoToDate(minDate), isoToDate(maxDate)));

  const minW = Math.min(...allWeights);
  const maxW = Math.max(...allWeights);
  const range = Math.max(maxW - minW, 1);
  const padW = range * 0.2;
  const yMin = minW - padW;
  const yMax = maxW + padW;

  const drawW = width - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const drawH = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  function xForDate(iso: string) {
    const d = daysBetween(isoToDate(minDate), isoToDate(iso));
    return CHART_PADDING_LEFT + (d / totalDays) * drawW;
  }

  function yForWeight(w: number) {
    return CHART_PADDING_TOP + drawH - ((w - yMin) / (yMax - yMin)) * drawH;
  }

  // Build SVG path string for a series
  function toPath(points: ChartPoint[]): string {
    if (points.length === 0) return '';
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    return sorted
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xForDate(p.date).toFixed(1)},${yForWeight(p.weight).toFixed(1)}`)
      .join(' ');
  }

  // Y grid lines
  const gridCount = 4;
  const yGridLines: number[] = [];
  for (let i = 0; i <= gridCount; i++) {
    yGridLines.push(yMin + (i / gridCount) * (yMax - yMin));
  }

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2D6A4F" stopOpacity="0.15" />
          <Stop offset="1" stopColor="#2D6A4F" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {yGridLines.map((w, i) => {
        const y = yForWeight(w).toFixed(1);
        return (
          <React.Fragment key={i}>
            <Line
              x1={CHART_PADDING_LEFT}
              y1={y}
              x2={width - CHART_PADDING_RIGHT}
              y2={y}
              stroke="#E5E5E5"
              strokeWidth="1"
            />
            <SvgText
              x={CHART_PADDING_LEFT - 4}
              y={parseFloat(y) + 4}
              fontSize="9"
              fill="#999"
              textAnchor="end"
            >
              {w.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X axis labels */}
      {xLabels.map(({ date, label }) => (
        <SvgText
          key={date}
          x={xForDate(date).toFixed(1)}
          y={CHART_HEIGHT - 6}
          fontSize="9"
          fill="#999"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      {/* Series: filled area first, then lines, then dots */}
      {series.map((s, si) => {
        if (s.points.length === 0) return null;
        const sorted = [...s.points].sort((a, b) => a.date.localeCompare(b.date));
        const pathD = toPath(sorted);

        // Fill area under line
        const fillD = s.filled
          ? `${pathD} L${xForDate(sorted[sorted.length - 1].date).toFixed(1)},${(CHART_PADDING_TOP + drawH).toFixed(1)} L${xForDate(sorted[0].date).toFixed(1)},${(CHART_PADDING_TOP + drawH).toFixed(1)} Z`
          : undefined;

        return (
          <React.Fragment key={si}>
            {fillD && <Path d={fillD} fill="url(#fillGrad)" />}
            <Path
              d={pathD}
              stroke={s.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray={s.dashed ? '6,4' : s.dotted ? '2,4' : undefined}
            />
            {s.showDots &&
              sorted.map((p, pi) => (
                <Circle
                  key={pi}
                  cx={xForDate(p.date).toFixed(1)}
                  cy={yForWeight(p.weight).toFixed(1)}
                  r="3.5"
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth="2"
                />
              ))}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Legend item
// ─────────────────────────────────────────────────────────────

function LegendItem({ color, dashed, dotted, label }: { color: string; dashed?: boolean; dotted?: boolean; label: string }) {
  return (
    <View style={legendStyles.row}>
      <View style={legendStyles.lineContainer}>
        {dashed || dotted ? (
          <View style={[legendStyles.dashedLine, { borderColor: color }]} />
        ) : (
          <View style={[legendStyles.solidLine, { backgroundColor: color }]} />
        )}
      </View>
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}
const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 },
  lineContainer: { width: 20, marginRight: 6 },
  solidLine: { height: 2, borderRadius: 1 },
  dashedLine: { height: 0, borderTopWidth: 2, borderStyle: 'dashed' },
  label: { fontSize: 12, color: '#555' },
});

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

type Range = 30 | 90;
type View_ = 'daily' | 'weekly';

export default function WeightGraphScreen() {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(30);
  const [view, setView] = useState<View_>('daily');

  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [calorieHistory, setCalorieHistory] = useState<{ date: string; calories: number }[]>([]);
  const [targets, setTargets] = useState<UserTargets>({ target_calories: 2000, target_protein_g: 150, activity_level: 'SEDENTARY', show_vitamins: false, gender: null, height_cm: null, birth_year: null });

  const load = useCallback(async () => {
    const [w, c, t] = await Promise.all([
      getWeights(),
      getCalorieHistory(90),
      getTargets(),
    ]);
    setWeights(w);
    setCalorieHistory(c);
    setTargets(t);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} color="#2D6A4F" />;

  // ── Actual weight series ──────────────────────────────────

  const today = new Date();
  const cutoff = addDays(today, -range);
  const recentWeights = weights
    .filter((e) => isoToDate(e.logged_at) >= cutoff)
    .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

  let actualPoints: ChartPoint[] = recentWeights.map((e) => ({
    date: dateToISO(isoToDate(e.logged_at)),
    weight: e.weight_kg,
  }));

  if (view === 'weekly' && actualPoints.length > 1) {
    actualPoints = movingAvg(actualPoints, 7);
  }

  const lastActual = actualPoints.length > 0 ? actualPoints[actualPoints.length - 1] : null;
  const currentWeight = lastActual?.weight ?? null;
  const currentDate = lastActual ? isoToDate(lastActual.date) : today;

  // ── Predictions ──────────────────────────────────────────

  const FORECAST_DAYS = 30;

  // Plan prediction uses Mifflin-St Jeor when profile is complete, rough estimate otherwise.
  const hasProfile = !!(targets.gender && targets.height_cm && targets.birth_year && currentWeight);
  const estimatedTDEE = hasProfile
    ? calculateTDEE({
        weight_kg: currentWeight!,
        height_cm: targets.height_cm!,
        birth_year: targets.birth_year!,
        gender: targets.gender!,
        activity_level: targets.activity_level ?? 'SEDENTARY',
      })
    : Math.round((currentWeight ?? 75) * 22 * ACTIVITY_MULTIPLIER[targets.activity_level ?? 'SEDENTARY']);
  // Trend prediction uses calibrated TDEE when enough data exists; falls back to estimate.
  const calibratedTDEE = calibrateTDEE(weights, calorieHistory);
  const trendTDEE = calibratedTDEE ?? estimatedTDEE;

  const planNetCalories = (targets.target_calories ?? 2000) - estimatedTDEE;

  let planPrediction: ChartPoint[] = [];
  let trendPrediction: ChartPoint[] = [];

  if (currentWeight !== null) {
    planPrediction = buildPrediction(currentDate, currentWeight, planNetCalories, FORECAST_DAYS);

    // Historical trend: use actual avg calories from recent cal history
    const recentCals = calorieHistory.filter(
      (d) => isoToDate(d.date) >= addDays(today, -30),
    );
    if (recentCals.length >= 5) {
      const avgCals = recentCals.reduce((s, d) => s + d.calories, 0) / recentCals.length;
      const histNetCalories = avgCals - trendTDEE;
      trendPrediction = buildPrediction(currentDate, currentWeight, histNetCalories, FORECAST_DAYS);
    }
  }

  // ── Chart series ─────────────────────────────────────────

  const series: ChartSeries[] = [
    {
      points: actualPoints,
      color: '#2D6A4F',
      filled: true,
      showDots: actualPoints.length <= 30,
    },
    {
      points: planPrediction,
      color: '#E67E22',
      dashed: true,
    },
    ...(trendPrediction.length > 0
      ? [{ points: trendPrediction, color: '#2980B9', dotted: true }]
      : []),
  ];

  // ── X-axis labels (evenly spaced) ────────────────────────

  const allPoints = [...actualPoints, ...planPrediction, ...trendPrediction].sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  const labelCount = 5;
  const xLabels: { date: string; label: string }[] = [];
  if (allPoints.length > 0) {
    const step = Math.max(1, Math.floor((allPoints.length - 1) / (labelCount - 1)));
    for (let i = 0; i < allPoints.length; i += step) {
      xLabels.push({ date: allPoints[i].date, label: shortDateLabel(allPoints[i].date) });
    }
    const last = allPoints[allPoints.length - 1];
    if (xLabels[xLabels.length - 1]?.date !== last.date) {
      xLabels.push({ date: last.date, label: shortDateLabel(last.date) });
    }
  }

  // ── Prediction summary text ───────────────────────────────

  const planEndWeight = planPrediction[planPrediction.length - 1]?.weight;
  const trendEndWeight = trendPrediction[trendPrediction.length - 1]?.weight;
  const planDelta = planEndWeight != null && currentWeight != null
    ? Math.round((planEndWeight - currentWeight) * 10) / 10
    : null;
  const trendDelta = trendEndWeight != null && currentWeight != null
    ? Math.round((trendEndWeight - currentWeight) * 10) / 10
    : null;

  function deltaLabel(delta: number) {
    return delta > 0 ? `+${delta} kg` : `${delta} kg`;
  }

  const calibrated = calibratedTDEE !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Toggles */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          {([30, 90] as Range[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>{r}d</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.toggleGroup}>
          {(['daily', 'weekly'] as View_[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
              onPress={() => setView(v)}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                {v === 'daily' ? 'Daily' : '7d avg'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      {actualPoints.length < 2 ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>Log at least 2 weight entries to see the chart.</Text>
        </View>
      ) : (
        <View style={styles.chartCard}>
          <WeightChart series={series} width={chartWidth} xLabels={xLabels} />
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendRow}>
        <LegendItem color="#2D6A4F" label="Actual weight" />
        <LegendItem color="#E67E22" dashed label="Plan prediction" />
        {trendPrediction.length > 0 && (
          <LegendItem color="#2980B9" dotted label="Trend prediction" />
        )}
      </View>

      {/* Prediction summary */}
      {currentWeight !== null && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>30-day forecast</Text>
          <Text style={styles.summaryNote}>
            Plan TDEE: ~{estimatedTDEE} kcal/day ({hasProfile ? 'from your profile' : 'estimated from activity level'})
          </Text>
          {calibrated && (
            <Text style={styles.summaryNote}>
              Trend TDEE: ~{trendTDEE} kcal/day (calibrated from your data)
            </Text>
          )}

          {planDelta !== null && (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryDot, { backgroundColor: '#E67E22' }]} />
              <View>
                <Text style={styles.summaryLabel}>At your calorie target ({targets.target_calories} kcal)</Text>
                <Text style={styles.summaryValue}>
                  {deltaLabel(planDelta)} → {planEndWeight?.toFixed(1)} kg
                </Text>
              </View>
            </View>
          )}

          {trendDelta !== null && trendEndWeight !== null && (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryDot, { backgroundColor: '#2980B9' }]} />
              <View>
                <Text style={styles.summaryLabel}>At your recent average intake</Text>
                <Text style={styles.summaryValue}>
                  {deltaLabel(trendDelta)} → {trendEndWeight.toFixed(1)} kg
                </Text>
              </View>
            </View>
          )}

          {trendPrediction.length === 0 && (
            <Text style={styles.summaryNote}>
              Log calories for at least 5 days to see a trend-based prediction.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16, paddingBottom: 40 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  toggleGroup: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  toggleBtnActive: { borderColor: '#2D6A4F', backgroundColor: '#2D6A4F' },
  toggleText: { fontSize: 13, fontWeight: '500', color: '#666' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, paddingHorizontal: 4 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  summaryNote: { fontSize: 12, color: '#999', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  summaryDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  summaryLabel: { fontSize: 13, color: '#666' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginTop: 2 },
});
