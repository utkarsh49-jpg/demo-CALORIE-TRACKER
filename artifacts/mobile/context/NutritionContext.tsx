import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEYS = {
  DAILY_LOGS: "nl_daily_logs_v2",
  GOALS: "nl_goals_v2",
  STREAK: "nl_streak_v2",
  LAST_LOG_DATE: "nl_last_log_date_v2",
};

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  imageUri?: string;
  isBarcode?: boolean;
  servingSize?: string;
  description?: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionContextType {
  dailyLogs: Record<string, FoodEntry[]>;
  goals: DailyGoals;
  streak: number;
  isLoaded: boolean;
  addEntry: (
    date: string,
    entry: Omit<FoodEntry, "id" | "timestamp">
  ) => void;
  removeEntry: (date: string, id: string) => void;
  updateGoals: (goals: DailyGoals) => void;
  getDayTotals: (date: string) => MacroTotals;
  getDateString: (date: Date) => string;
  getWeekData: () => { date: string; day: string; calories: number }[];
}

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

const NutritionContext = createContext<NutritionContextType | null>(null);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [dailyLogs, setDailyLogs] = useState<Record<string, FoodEntry[]>>({});
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [streak, setStreak] = useState(0);
  const [lastLogDate, setLastLogDate] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getDateString = useCallback((date: Date) => {
    return date.toISOString().split("T")[0] ?? "";
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [logsJson, goalsJson, streakStr, lastDate] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.STREAK),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_LOG_DATE),
        ]);
        if (logsJson) setDailyLogs(JSON.parse(logsJson));
        if (goalsJson) setGoals(JSON.parse(goalsJson));
        if (streakStr) setStreak(parseInt(streakStr, 10));
        if (lastDate) setLastLogDate(lastDate);
      } catch {
        // silently fall back to defaults
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  const updateStreak = useCallback(
    (date: string) => {
      const yesterday = new Date(new Date(date).getTime() - 86400000)
        .toISOString()
        .split("T")[0];

      if (lastLogDate === date) return;

      let newStreak: number;
      if (lastLogDate === yesterday) {
        newStreak = streak + 1;
      } else if (!lastLogDate) {
        newStreak = 1;
      } else {
        newStreak = 1;
      }

      setStreak(newStreak);
      setLastLogDate(date);
      AsyncStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());
      AsyncStorage.setItem(STORAGE_KEYS.LAST_LOG_DATE, date);
    },
    [lastLogDate, streak]
  );

  const addEntry = useCallback(
    (date: string, entry: Omit<FoodEntry, "id" | "timestamp">) => {
      const newEntry: FoodEntry = {
        ...entry,
        id:
          Date.now().toString() + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
      };

      setDailyLogs((prev) => {
        const updated = {
          ...prev,
          [date]: [...(prev[date] ?? []), newEntry],
        };
        AsyncStorage.setItem(
          STORAGE_KEYS.DAILY_LOGS,
          JSON.stringify(updated)
        );
        return updated;
      });

      updateStreak(date);
    },
    [updateStreak]
  );

  const removeEntry = useCallback((date: string, id: string) => {
    setDailyLogs((prev) => {
      const updated = {
        ...prev,
        [date]: (prev[date] ?? []).filter((e) => e.id !== id),
      };
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateGoals = useCallback((newGoals: DailyGoals) => {
    setGoals(newGoals);
    AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(newGoals));
  }, []);

  const getDayTotals = useCallback(
    (date: string): MacroTotals => {
      const entries = dailyLogs[date] ?? [];
      return entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [dailyLogs]
  );

  const getWeekData = useCallback(() => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0] ?? "";
      const entries = dailyLogs[dateStr] ?? [];
      const totalCal = entries.reduce((s, e) => s + e.calories, 0);
      result.push({
        date: dateStr,
        day: days[d.getDay()] ?? "",
        calories: Math.round(totalCal),
      });
    }
    return result;
  }, [dailyLogs]);

  return (
    <NutritionContext.Provider
      value={{
        dailyLogs,
        goals,
        streak,
        isLoaded,
        addEntry,
        removeEntry,
        updateGoals,
        getDayTotals,
        getDateString,
        getWeekData,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error("useNutrition must be inside NutritionProvider");
  return ctx;
}
