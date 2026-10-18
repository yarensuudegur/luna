import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { HOUSE_SYSTEMS } from '@/lib/astro';
import { DEFAULT_EVENING, EVENING_OPTIONS } from '@/lib/bottle';
import { TONES } from '@/lib/daily';
import type { Tone } from '@/lib/daily';
import type { HouseSystem } from '@/lib/astro';

export const RELATIONSHIP_OPTIONS = ['Belirtmek istemiyorum', 'Bekâr', 'Flört ediyor', 'İlişkide', 'Evli'] as const;
export const LIFE_OPTIONS = ['Belirtmek istemiyorum', 'Öğrenci', 'Çalışan', 'Ebeveyn', 'Emekli'] as const;

export type Settings = {
  houseSystem: HouseSystem;
  /** Açıkken Uranüs, Neptün ve Plüton gizlenir. */
  classicOnly: boolean;
  /** Duygu kaydının açıldığı akşam saati, "21:00". */
  eveningTime: string;
  /** Günlük metinlerin ve Void'in tonu. */
  tone: Tone;
  /** Açıkken Void kapalıdır; yalnızca insan yazımı metinler gösterilir. */
  noAI: boolean;
  relationship: (typeof RELATIONSHIP_OPTIONS)[number];
  lifeStage: (typeof LIFE_OPTIONS)[number];
  /** Her gece 00:00'da "Yeni kartın hazır." bildirimi. */
  cardReminder: boolean;
};

const DEFAULTS: Settings = {
  houseSystem: 'Placidus',
  classicOnly: false,
  eveningTime: DEFAULT_EVENING,
  tone: 'Dengeli',
  noAI: false,
  relationship: 'Belirtmek istemiyorum',
  lifeStage: 'Belirtmek istemiyorum',
  cardReminder: false,
};
const KEY = 'luna.settings.v1';

type SettingsState = Settings & {
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

function oneOf<T extends string>(list: readonly T[], v: unknown, fallback: T): T {
  return list.includes(v as T) ? (v as T) : fallback;
}

function parse(raw: string | null): Settings {
  if (!raw) return DEFAULTS;
  try {
    const v = JSON.parse(raw) as Partial<Settings>;
    return {
      houseSystem: oneOf(HOUSE_SYSTEMS, v.houseSystem, DEFAULTS.houseSystem),
      classicOnly: typeof v.classicOnly === 'boolean' ? v.classicOnly : DEFAULTS.classicOnly,
      eveningTime: oneOf(EVENING_OPTIONS, v.eveningTime, DEFAULTS.eveningTime),
      tone: oneOf(TONES, v.tone, DEFAULTS.tone),
      noAI: typeof v.noAI === 'boolean' ? v.noAI : DEFAULTS.noAI,
      relationship: oneOf(RELATIONSHIP_OPTIONS, v.relationship, DEFAULTS.relationship),
      lifeStage: oneOf(LIFE_OPTIONS, v.lifeStage, DEFAULTS.lifeStage),
      cardReminder: typeof v.cardReminder === 'boolean' ? v.cardReminder : DEFAULTS.cardReminder,
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
