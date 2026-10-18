import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { City } from '@/lib/cities';
import type { Profile } from '@/lib/auth';

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

/** Kayıtlı profilden taslak: doğum bilgilerini düzenlerken adımlar bununla dolu açılır. */
export function draftFromProfile(p: Profile | null): Draft {
  if (!p) return EMPTY;
  const [name = '', ...rest] = (p.birth_place ?? '').split(',');
  const place: City | null =
    p.birth_place && p.lat !== null && p.lon !== null && p.timezone
      ? { name: name.trim(), country: rest.join(',').trim(), lat: p.lat, lon: p.lon, tz: p.timezone }
      : null;
  return {
    name: p.name ?? '',
    handle: p.handle ?? '',
    birthDate: p.birth_date ?? '',
    birthTime: p.birth_time_known && p.birth_time ? p.birth_time.slice(0, 5) : null,
    place,
  };
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children, initial = EMPTY }: { children: ReactNode; initial?: Draft }) {
  const [draft, setDraft] = useState<Draft>(initial);
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
