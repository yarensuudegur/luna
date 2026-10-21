import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { planetsAt, signIndex } from '@/lib/astro';
import { MOODS } from '@/lib/bottle';
import type { MoodEntry, MoodMap, MoodValues, WeekData } from '@/lib/bottle';
import { transitMoment } from '@/lib/daily';
import { parseSong } from '@/lib/song-utils';
import { supabase } from '@/lib/supabase';

type MoodRow = { date: string; values: Partial<Record<string, unknown>>; note: string | null; song: unknown };

function parseValues(raw: MoodRow['values']): MoodValues | null {
  const v = {} as MoodValues;
  for (const [f] of MOODS) {
    const n = raw?.[f];
    if (typeof n !== 'number') return null;
    v[f] = Math.min(10, Math.max(0, Math.round(n)));
  }
  return v;
}

export async function fetchMoods(userId: string): Promise<MoodMap> {
  const { data, error } = await supabase
    .from('moods')
    .select('date, values, note, song')
    .eq('user_id', userId)
    .order('date');
  if (error) throw error;
  const map: MoodMap = {};
  for (const row of (data ?? []) as MoodRow[]) {
    const values = parseValues(row.values);
    if (values) map[row.date] = { values, note: row.note ?? '', song: parseSong(row.song) };
  }
  return map;
}

export async function saveMood(userId: string, date: string, entry: MoodEntry): Promise<boolean> {
  const { error } = await supabase
    .from('moods')
    .upsert(
      {
        user_id: userId,
        date,
        values: entry.values,
        note: entry.note.trim().slice(0, 280) || null,
        song: entry.song ?? null,
      },
      { onConflict: 'user_id,date' },
    );
  return !error;
}

export type MoodsState = {
  loading: boolean;
  error: boolean;
  moods: MoodMap;
  reload: () => void;
  /** Kaydı yerel listeye de ekler; kaydedilemezse false döner. */
  save: (date: string, entry: MoodEntry) => Promise<boolean>;
};

export function useMoods(userId: string | undefined): MoodsState {
  const [moods, setMoods] = useState<MoodMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    setError(false);
    fetchMoods(userId)
      .then((m) => alive && setMoods(m))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const save = useCallback(
    async (date: string, entry: MoodEntry) => {
      if (!userId) return false;
      if (!(await saveMood(userId, date, entry))) return false;
      setMoods((m) => ({ ...m, [date]: entry }));
      return true;
    },
    [userId],
  );

  return { loading, error, moods, reload, save };
}

/** Arşivdeki bir haftanın şişesi. */
export type ArchivedBottle = { weekStart: string; summary: WeekData };

function isWeekData(s: unknown): s is WeekData {
  const w = s as Partial<WeekData> | null;
  return !!w && typeof w.label === 'string' && typeof w.best === 'string' && Array.isArray(w.keys) && !!w.avg;
}

export function useBottleArchive(userId: string | undefined) {
  const [list, setList] = useState<ArchivedBottle[]>([]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase
      .from('bottle_archive')
      .select('week_start, summary')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .then(({ data }) => {
        if (!alive || !data) return;
        setList(
          (data as { week_start: string; summary: unknown }[])
            .filter((r) => isWeekData(r.summary))
            .map((r) => ({ weekStart: r.week_start, summary: r.summary as WeekData })),
        );
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  /** Haftanın şişesini arşive yazar; kaydedilemezse false döner. */
  const add = useCallback(
    async (weekStart: string, summary: WeekData) => {
      if (!userId) return false;
      const { error } = await supabase
        .from('bottle_archive')
        .upsert({ user_id: userId, week_start: weekStart, summary }, { onConflict: 'user_id,week_start' });
      if (error) return false;
      setList((l) => [{ weekStart, summary }, ...l.filter((a) => a.weekStart !== weekStart)]);
      return true;
    },
    [userId],
  );

  return { list, add };
}

/** Cihazda tutulan hafta listesi (pazartesi anahtarları). */
function useWeekSet(userId: string | undefined, storageKey: (userId: string) => string) {
  const [weeks, setWeeks] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(storageKey(userId))
      .then((raw) => {
        const list = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(list)) setWeeks(list.filter((w): w is string => typeof w === 'string'));
      })
      .catch(() => {});
  }, [userId]);

  const mark = useCallback(
    (week: string, opened: boolean) => {
      if (!userId) return;
      setWeeks((prev) => {
        const next = opened ? [...prev.filter((w) => w !== week), week] : prev.filter((w) => w !== week);
        AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [userId, storageKey],
  );

  return { weeks, mark };
}

const openedKey = (userId: string) => `luna.bottle.opened.${userId}.v1`;
const closedKey = (userId: string) => `luna.bottle.closed.${userId}.v1`;

/** Şişesi patlatılmış haftalar (pazartesi anahtarları); cihazda tutulur. */
export function useOpenedWeeks(userId: string | undefined) {
  return useWeekSet(userId, openedKey);
}

/** "Yeni şişeye geç" ile kapatılmış haftalar: özet gizlenir, boş yeni şişe görünür. */
export function useClosedWeeks(userId: string | undefined) {
  return useWeekSet(userId, closedKey);
}

const moonCache = new Map<string, number>();

/** Günün (öğle) Ay burcu dizini. */
export function moonSignOf(key: string): number {
  let s = moonCache.get(key);
  if (s == null) {
    const moon = planetsAt(transitMoment(key)).find((p) => p.key === 'Ay');
    s = moon ? signIndex(moon.lon) : 0;
    moonCache.set(key, s);
  }
  return s;
}
