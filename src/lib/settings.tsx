import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { HOUSE_SYSTEMS } from '@/lib/astro';
import type { HouseSystem } from '@/lib/astro';

export type Settings = {
  houseSystem: HouseSystem;
  /** Açıkken Uranüs, Neptün ve Plüton gizlenir. */
  classicOnly: boolean;
};

const DEFAULTS: Settings = { houseSystem: 'Placidus', classicOnly: false };
const KEY = 'luna.settings.v1';

type SettingsState = Settings & {
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

function parse(raw: string | null): Settings {
  if (!raw) return DEFAULTS;
  try {
    const v = JSON.parse(raw) as Partial<Settings>;
    return {
      houseSystem: HOUSE_SYSTEMS.includes(v.houseSystem as HouseSystem)
        ? (v.houseSystem as HouseSystem)
        : DEFAULTS.houseSystem,
      classicOnly: typeof v.classicOnly === 'boolean' ? v.classicOnly : DEFAULTS.classicOnly,
    };
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setSettings(parse(raw)))
      .catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<SettingsState>(() => ({ ...settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings, SettingsProvider içinde kullanılmalı.');
  return ctx;
}
