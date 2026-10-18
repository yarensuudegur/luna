import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { City } from '@/lib/cities';

export type Draft = {
  name: string;
  /** "@" olmadan, küçük harf. */
  handle: string;
  /** YYYY-MM-DD */
  birthDate: string;
  /** HH:MM; null = bilinmiyor. */
  birthTime: string | null;
  place: City | null;
};

type OnboardingState = {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
};

const EMPTY: Draft = { name: '', handle: '', birthDate: '', birthTime: null, place: null };

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const value = useMemo<OnboardingState>(
    () => ({ draft, update: (patch) => setDraft((d) => ({ ...d, ...patch })) }),
    [draft],
  );
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding, OnboardingProvider içinde kullanılmalı.');
  return ctx;
}
