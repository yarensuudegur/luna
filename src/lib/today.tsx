import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { dateKey } from '@/lib/date';
import type { LuckCategory } from '@/lib/daily';

export type DeepTab = 'Tümü' | 'Aşk' | 'Arkadaşlar' | 'İş & para' | 'Ev & aile';

type TodayState = {
  /** Bugünün anahtarı; gece yarısı değişir. */
  today: string;
  /** Bugün sekmesinde seçili gün. */
  selected: string;
  select: (key: string) => void;
  daysOpen: boolean;
  toggleDays: () => void;
  deepOpen: boolean;
  deepTab: DeepTab;
  setDeepTab: (tab: DeepTab) => void;
  openDeep: (tab?: LuckCategory) => void;
  closeDeep: () => void;
};

const TodayContext = createContext<TodayState | null>(null);

export function TodayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => dateKey());
  const [selected, setSelected] = useState(today);
  const [daysOpen, setDaysOpen] = useState(false);
  const [deepOpen, setDeepOpen] = useState(false);
  const [deepTab, setDeepTab] = useState<DeepTab>('Tümü');

  const todayRef = useRef(today);

  useEffect(() => {
    const id = setInterval(() => {
      const now = dateKey();
      const prev = todayRef.current;
      if (now === prev) return;
      todayRef.current = now;
      setToday(now);
      // Bugünü izliyorsa seçim de yeni güne geçsin.
      setSelected((sel) => (sel === prev ? now : sel));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const toggleDays = useCallback(() => setDaysOpen((o) => !o), []);
  const openDeep = useCallback((tab?: LuckCategory) => {
    setDeepTab(tab ?? 'Tümü');
    setDeepOpen(true);
  }, []);
  const closeDeep = useCallback(() => setDeepOpen(false), []);

  const value = useMemo<TodayState>(
    () => ({
      today,
      selected,
      select: setSelected,
      daysOpen,
      toggleDays,
      deepOpen,
      deepTab,
      setDeepTab,
      openDeep,
      closeDeep,
    }),
    [today, selected, daysOpen, toggleDays, deepOpen, deepTab, openDeep, closeDeep],
  );
  return <TodayContext.Provider value={value}>{children}</TodayContext.Provider>;
}

export function useToday(): TodayState {
  const ctx = useContext(TodayContext);
  if (!ctx) throw new Error('useToday, TodayProvider içinde kullanılmalı.');
  return ctx;
}
