import React, { createContext, useContext, useState, useCallback } from 'react';
import { getLog, DayLog, getTargets, UserTargets, getWeights } from '../services/api';

// TODO: replace with real user from auth
export const USER_ID = 1;

const DEFAULT_TARGETS: UserTargets = { target_calories: 2000, target_protein_g: 150 };

interface AppContextType {
  userId: number;
  todayDate: string;
  todayLog: DayLog | null;
  refreshTodayLog: () => Promise<void>;
  targets: UserTargets;
  refreshTargets: () => Promise<void>;
  loggedWeightToday: boolean;
  refreshWeightToday: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const todayDate = getTodayDate();
  const [todayLog, setTodayLog] = useState<DayLog | null>(null);
  const [targets, setTargets] = useState<UserTargets>(DEFAULT_TARGETS);
  const [loggedWeightToday, setLoggedWeightToday] = useState(false);

  const refreshTodayLog = useCallback(async () => {
    const log = await getLog(todayDate);
    setTodayLog(log);
  }, [todayDate]);

  const refreshTargets = useCallback(async () => {
    const t = await getTargets();
    setTargets({
      target_calories: t.target_calories ?? DEFAULT_TARGETS.target_calories,
      target_protein_g: t.target_protein_g ?? DEFAULT_TARGETS.target_protein_g,
    });
  }, []);

  const refreshWeightToday = useCallback(async () => {
    const weights = await getWeights();
    const latest = weights[0];
    const logged = !!latest && latest.logged_at.startsWith(todayDate);
    setLoggedWeightToday(logged);
  }, [todayDate]);

  return (
    <AppContext.Provider value={{ userId: USER_ID, todayDate, todayLog, refreshTodayLog, targets, refreshTargets, loggedWeightToday, refreshWeightToday }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
