import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { DayLog, UserTargets } from '../services/api';
import { getLog } from '../db/log';
import { getTargets } from '../db/settings';
import { getWeights } from '../db/weight';
import { calculateTDEE } from '../utils/tdee';

// TODO: replace with real user from auth
export const USER_ID = 1;

const DEFAULT_TARGETS: UserTargets = { target_calories: 2000, target_protein_g: 150, activity_level: 'SEDENTARY', show_vitamins: false, gender: null, height_cm: null, birth_year: null };

interface AppContextType {
  userId: number;
  todayDate: string;
  viewingDate: string;
  setViewingDate: (date: string) => void;
  viewingLog: DayLog | null;
  refreshViewingLog: () => Promise<void>;
  targets: UserTargets;
  refreshTargets: () => Promise<void>;
  loggedWeightToday: boolean;
  latestWeightKg: number | null;
  refreshWeightToday: () => Promise<void>;
  tdee: number | null;
}

const AppContext = createContext<AppContextType | null>(null);

function localDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDate(): string {
  return localDateString(new Date());
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const todayDate = getTodayDate();
  const [viewingDate, setViewingDate] = useState(todayDate);
  const [viewingLog, setViewingLog] = useState<DayLog | null>(null);
  const [targets, setTargets] = useState<UserTargets>(DEFAULT_TARGETS);
  const [loggedWeightToday, setLoggedWeightToday] = useState(false);
  const [latestWeightKg, setLatestWeightKg] = useState<number | null>(null);

  const refreshViewingLog = useCallback(async () => {
    const log = await getLog(viewingDate);
    setViewingLog(log);
  }, [viewingDate]);

  useEffect(() => {
    refreshViewingLog();
  }, [refreshViewingLog]);

  const refreshTargets = useCallback(async () => {
    const t = await getTargets();
    setTargets({
      target_calories: t.target_calories ?? DEFAULT_TARGETS.target_calories,
      target_protein_g: t.target_protein_g ?? DEFAULT_TARGETS.target_protein_g,
      activity_level: t.activity_level ?? DEFAULT_TARGETS.activity_level,
      show_vitamins: t.show_vitamins ?? DEFAULT_TARGETS.show_vitamins,
      gender: t.gender ?? null,
      height_cm: t.height_cm ?? null,
      birth_year: t.birth_year ?? null,
    });
  }, []);

  const refreshWeightToday = useCallback(async () => {
    const weights = await getWeights();
    const latest = weights[0];
    const logged = !!latest && localDateString(new Date(latest.logged_at)) === todayDate;
    setLoggedWeightToday(logged);
    setLatestWeightKg(latest?.weight_kg ?? null);
  }, [todayDate]);

  const tdee = useMemo(() => {
    if (!targets.gender || !targets.height_cm || !targets.birth_year || !latestWeightKg) return null;
    return calculateTDEE({
      weight_kg: latestWeightKg,
      height_cm: targets.height_cm,
      birth_year: targets.birth_year,
      gender: targets.gender,
      activity_level: targets.activity_level,
    });
  }, [targets, latestWeightKg]);

  // Pre-fetch everything on app open so screens have data immediately
  useEffect(() => {
    refreshTargets();
    refreshWeightToday();
  }, []);

  return (
    <AppContext.Provider value={{
      userId: USER_ID,
      todayDate,
      viewingDate,
      setViewingDate,
      viewingLog,
      refreshViewingLog,
      targets,
      refreshTargets,
      loggedWeightToday,
      latestWeightKg,
      refreshWeightToday,
      tdee,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
