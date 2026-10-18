import { useMemo } from 'react';
import { computeChart, cuspsOf, houseOf } from '@/lib/astro';
import type { Chart, PlanetPosition } from '@/lib/astro';
import type { Profile } from '@/lib/auth';
import { useSettings } from '@/lib/settings';

export type ChartRow = PlanetPosition & {
  /** Doğum saati bilinmiyorsa null. */
  house: number | null;
};

export type ProfileChart = {
  chart: Chart;
  /** Ev başlangıçları; doğum saati bilinmiyorsa null. */
  cusps: number[] | null;
  /** "Sadece klasik" ayarına göre süzülmüş gezegenler. */
  rows: ChartRow[];
};

/** Profildeki doğum bilgisinden haritayı ve seçili ev sistemine göre evleri hesaplar. */
export function useProfileChart(profile: Profile | null): ProfileChart | null {
  const { houseSystem, classicOnly } = useSettings();
  const date = profile?.birth_date ?? null;
  const time = profile?.birth_time_known ? (profile.birth_time ?? null) : null;
  const tz = profile?.timezone ?? null;
  const lat = profile?.lat ?? null;
  const lon = profile?.lon ?? null;

  const chart = useMemo(() => {
    if (!date || !tz || lat === null || lon === null) return null;
    return computeChart({ date, time, timeZone: tz, lat, lon });
  }, [date, time, tz, lat, lon]);

  return useMemo(() => {
    if (!chart) return null;
    const cusps = cuspsOf(chart, houseSystem);
    const rows = chart.planets
      .filter((p) => !(classicOnly && p.outer))
      .map<ChartRow>((p) => ({ ...p, house: cusps ? houseOf(p.lon, cusps) : null }));
    return { chart, cusps, rows };
  }, [chart, houseSystem, classicOnly]);
}
