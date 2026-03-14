import React, { createContext, useContext, useState, useCallback } from 'react';
import { getLog, DayLog } from '../services/api';

// TODO: replace with real user from auth
export const USER_ID = 1;

interface AppContextType {
  userId: number;
  todayDate: string;
  todayLog: DayLog | null;
  refreshTodayLog: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const todayDate = getTodayDate();
  const [todayLog, setTodayLog] = useState<DayLog | null>(null);

  const refreshTodayLog = useCallback(async () => {
    const log = await getLog(todayDate);
    setTodayLog(log);
  }, [todayDate]);

  return (
    <AppContext.Provider value={{ userId: USER_ID, todayDate, todayLog, refreshTodayLog }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
