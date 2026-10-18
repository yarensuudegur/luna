import { useMemo } from 'react';
import type { Profile } from '@/lib/auth';
import { buildReading, computeTransits } from '@/lib/daily';
import type { Reading, Transits } from '@/lib/daily';
import { useProfileChart } from '@/lib/use-chart';

export type Daily = { transits: Transits; reading: Reading };

/** Seçilen günün transitleri ve yorumu; doğum haritası yoksa null. */
export function useDaily(profile: Profile | null, dateKey: string): Daily | null {
  const data = useProfileChart(profile);
  const userId = profile?.id;

  return useMemo(() => {
    if (!data || !userId) return null;
    const transits = computeTransits(dateKey, {
      planets: data.chart.planets,
      asc: data.chart.asc,
      cusps: data.cusps,
    });
    return { transits, reading: buildReading(userId, dateKey, transits) };
  }, [data, userId, dateKey]);
}
