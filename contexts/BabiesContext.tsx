import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const _PROJECT_SCOPE =
  Constants.expoConfig?.extra?.nativelyProjectId ||
  Constants.expoConfig?.slug ||
  "app";

const BABIES_KEY = `babies_${_PROJECT_SCOPE}`;
const LOGS_KEY = `baby_logs_${_PROJECT_SCOPE}`;

export type Baby = {
  id: string;
  name: string;
  dob: string;
};

export type LogType = "Feed" | "Sleep" | "Diaper";

export type BabyLog = {
  id: string;
  babyId: string;
  type: LogType;
  time: string;
  note?: string;
};

type BabiesContextValue = {
  babies: Baby[];
  addBaby: (name: string, dob: string) => void;
  removeBaby: (id: string) => void;
  updateBaby: (id: string, name: string, dob: string) => void;
  logs: BabyLog[];
  addLog: (babyId: string, type: LogType, note?: string) => void;
};

const BabiesContext = createContext<BabiesContextValue | null>(null);

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export function BabiesProvider({ children }: { children: React.ReactNode }) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log("[BabiesContext] Loading babies and logs from storage");
    Promise.all([storageGet(BABIES_KEY), storageGet(LOGS_KEY)]).then(
      ([babiesRaw, logsRaw]) => {
        if (babiesRaw) {
          try {
            setBabies(JSON.parse(babiesRaw));
          } catch {
            console.warn("[BabiesContext] Failed to parse babies from storage");
          }
        }
        if (logsRaw) {
          try {
            setLogs(JSON.parse(logsRaw));
          } catch {
            console.warn("[BabiesContext] Failed to parse logs from storage");
          }
        }
        setLoaded(true);
      }
    );
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storageSet(BABIES_KEY, JSON.stringify(babies)).catch(() => {});
  }, [babies, loaded]);

  useEffect(() => {
    if (!loaded) return;
    storageSet(LOGS_KEY, JSON.stringify(logs)).catch(() => {});
  }, [logs, loaded]);

  const addBaby = useCallback((name: string, dob: string) => {
    const id = `baby_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    console.log("[BabiesContext] addBaby called", { id, name, dob });
    setBabies((prev) => [...prev, { id, name, dob }]);
  }, []);

  const removeBaby = useCallback((id: string) => {
    console.log("[BabiesContext] removeBaby called", { id });
    setBabies((prev) => prev.filter((b) => b.id !== id));
    setLogs((prev) => prev.filter((l) => l.babyId !== id));
  }, []);

  const updateBaby = useCallback((id: string, name: string, dob: string) => {
    console.log("[BabiesContext] updateBaby called", { id, name, dob });
    setBabies((prev) =>
      prev.map((b) => (b.id === id ? { ...b, name, dob } : b))
    );
  }, []);

  const addLog = useCallback((babyId: string, type: LogType, note?: string) => {
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const time = new Date().toISOString();
    console.log("[BabiesContext] addLog called", { id, babyId, type, time, note });
    setLogs((prev) => [...prev, { id, babyId, type, time, note }]);
  }, []);

  return (
    <BabiesContext.Provider value={{ babies, addBaby, removeBaby, updateBaby, logs, addLog }}>
      {children}
    </BabiesContext.Provider>
  );
}

export function useBabies(): BabiesContextValue {
  const ctx = useContext(BabiesContext);
  if (!ctx) throw new Error("useBabies must be used within BabiesProvider");
  return ctx;
}
