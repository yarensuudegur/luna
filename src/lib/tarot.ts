import { useCallback, useEffect, useState } from 'react';
import { TAROT_COUNT } from '@/lib/daily';
import { randomInt } from '@/lib/random';
import { supabase } from '@/lib/supabase';

export type DrawnCard = { card: number; reversed: boolean };

const UNIQUE_VIOLATION = '23505';

export async function fetchCard(userId: string, date: string): Promise<DrawnCard | null> {
  const { data, error } = await supabase
    .from('daily_tarot')
    .select('card, reversed')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? { card: data.card as number, reversed: data.reversed as boolean } : null;
}

/** Çekilmiş tüm kartlar: gün anahtarı → kart numarası. */
export async function fetchCardMap(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('daily_tarot').select('date, card').eq('user_id', userId);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const r of (data ?? []) as { date: string; card: number }[]) map[r.date] = r.card;
  return map;
}

/** Günün kartını çeker ve kaydeder; o gün zaten çekilmişse kayıtlı olanı döndürür. */
export async function drawCard(userId: string, date: string): Promise<DrawnCard> {
  const pick: DrawnCard = {
    card: randomInt(TAROT_COUNT),
    reversed: randomInt(100) < 22,
  };
  const { error } = await supabase
    .from('daily_tarot')
    .insert({ user_id: userId, date, card: pick.card, reversed: pick.reversed });
  if (!error) return pick;
  if (error.code === UNIQUE_VIOLATION) {
    const existing = await fetchCard(userId, date);
    if (existing) return existing;
  }
  throw error;
}

export type TarotState = {
  loading: boolean;
  /** Çekilmiş kart; henüz çekilmediyse null. */
  drawn: DrawnCard | null;
  error: boolean;
  /** Kartı çeker; kaydedilemezse false döner. */
  draw: () => Promise<boolean>;
};

export function useDailyTarot(userId: string | undefined, date: string): TarotState {
  const [drawn, setDrawn] = useState<DrawnCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    setError(false);
    setDrawn(null);
    fetchCard(userId, date)
      .then((c) => alive && setDrawn(c))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, date]);

  const draw = useCallback(async () => {
    if (!userId) return false;
    setError(false);
    try {
      setDrawn(await drawCard(userId, date));
      return true;
    } catch {
      setError(true);
      return false;
    }
  }, [userId, date]);

  return { loading, drawn, error, draw };
}

/** Çekilmiş tüm kartlar (gün anahtarı → kart numarası); Günlük özetleri için. */
export function useCardMap(userId: string | undefined, enabled: boolean): Record<string, number> {
  const [map, setMap] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!userId || !enabled) return;
    let alive = true;
    fetchCardMap(userId)
      .then((m) => alive && setMap(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId, enabled]);
  return map;
}
