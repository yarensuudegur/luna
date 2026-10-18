import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/i18n/core';
import { computeChart, signIndex } from '@/lib/astro';
import type { Chart } from '@/lib/astro';
import { useRealtime } from '@/lib/notifications';
import { REL_TYPES } from '@/lib/relations';
import type { RelChange, RelType } from '@/lib/relations';
import { supabase } from '@/lib/supabase';

export type Friend = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  rel: RelType;
  history: RelChange[];
  chart: Chart | null;
  /** Burç dizinleri (0 = Koç); harita hesaplanamadıysa ya da saat bilinmiyorsa null. */
  sun: number | null;
  moon: number | null;
  asc: number | null;
};

type FriendRow = {
  id: string;
  name: string | null;
  handle: string | null;
  avatar: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_time_known: boolean;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  rel_type: string;
  history: unknown;
};

const isRel = (v: unknown): v is RelType => REL_TYPES.includes(v as RelType);

function parseHistory(raw: unknown): RelChange[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (h): h is RelChange =>
      !!h && typeof h === 'object' && isRel((h as RelChange).from) && isRel((h as RelChange).to) && typeof (h as RelChange).date === 'string',
  );
}

function toFriend(row: FriendRow): Friend {
  const chart =
    row.birth_date && row.timezone && row.lat !== null && row.lon !== null
      ? computeChart({
          date: row.birth_date,
          time: row.birth_time_known ? row.birth_time : null,
          timeZone: row.timezone,
          lat: row.lat,
          lon: row.lon,
        })
      : null;
  const lonOf = (key: string) => chart?.planets.find((p) => p.key === key)?.lon;
  const sun = lonOf('Güneş');
  const moon = lonOf('Ay');
  return {
    id: row.id,
    name: row.name ?? t('common.unnamed'),
    handle: row.handle ?? '',
    avatar: row.avatar,
    rel: isRel(row.rel_type) ? row.rel_type : 'Arkadaş',
    history: parseHistory(row.history),
    chart,
    sun: sun === undefined ? null : signIndex(sun),
    moon: moon === undefined ? null : signIndex(moon),
    asc: chart?.asc != null ? signIndex(chart.asc) : null,
  };
}

export type FriendsState = {
  friends: Friend[];
  loading: boolean;
  error: boolean;
  /** Listeyi yeniden çeker; yükleme bitince çözülür. */
  reload: () => Promise<void>;
  /** Son yüklemede listeye yeni düşen kişi (örn. kodunu okuttuğu biri); yoksa null. */
  arrival: { id: string; name: string } | null;
  /** İlişki türünü değiştirir; kaydedilemezse false döner. */
  setRel: (id: string, rel: RelType) => Promise<boolean>;
  /** Arkadaşlığı iki yönlü siler; silinemezse false döner. */
  remove: (id: string) => Promise<boolean>;
};

/**
 * Arkadaş listesi: ad, kullanıcı adı, avatar ve harita yalnızca `friend_list` ile okunur.
 */
export function useFriends(userId: string | undefined): FriendsState {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [arrival, setArrival] = useState<FriendsState['arrival']>(null);
  const known = useRef<Set<string> | null>(null);
  const waiters = useRef<(() => void)[]>([]);
  const flush = () => waiters.current.splice(0).forEach((done) => done());

  useEffect(() => {
    if (!userId) {
      known.current = null;
      flush();
      return;
    }
    let alive = true;
    setError(false);
    supabase
      .rpc('friend_list')
      .then(({ data, error: err }) => {
        if (!alive) return;
        if (err) return setError(true);
        const list = ((data ?? []) as FriendRow[]).map(toFriend);
        const added = known.current ? list.find((f) => !known.current?.has(f.id)) : undefined;
        known.current = new Set(list.map((f) => f.id));
        setFriends(list);
        if (added) setArrival({ id: added.id, name: added.name });
      })
      .then(() => {
        if (!alive) return;
        setLoading(false);
        flush();
      });
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  // Karşı taraf kodumu okutunca ya da ilişki türü değişince (Realtime, NotificationsProvider'dan) liste yenilenir.
  useRealtime((event) => {
    if (event.kind === 'friends') setAttempt((n) => n + 1);
  });

  const reload = useCallback(
    () =>
      new Promise<void>((done) => {
        waiters.current.push(done);
        setAttempt((n) => n + 1);
      }),
    [],
  );

  const setRel = useCallback(
    async (id: string, rel: RelType) => {
      if (!userId) return false;
      const { error: err } = await supabase
        .from('friendships')
        .update({ rel_type: rel })
        .eq('user_a', userId)
        .eq('user_b', id);
      if (err) return false;
      // Geçmişi sunucudaki tetikleyici yazar; güncel hâli yeniden oku.
      setAttempt((n) => n + 1);
      return true;
    },
    [userId],
  );

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase.rpc('remove_friend', { p_friend: id });
    if (err) return false;
    known.current?.delete(id);
    setFriends((prev) => prev.filter((f) => f.id !== id));
    return true;
  }, []);

  return { friends, loading, error, reload, arrival, setRel, remove };
}

export type AddFriendResult =
  | { ok: true; id: string; name: string; handle: string }
  | { ok: false; reason: 'self' | 'invalid' | 'failed' };

/** QR'dan okunan tek kullanımlık kodla iki yönlü arkadaşlık açar. */
export async function addFriendByCode(code: string): Promise<AddFriendResult> {
  const { data, error } = await supabase.rpc('add_friend_by_code', { p_code: code });
  if (error) {
    if (error.message.includes('kendini_ekleyemezsin')) return { ok: false, reason: 'self' };
    if (error.message.includes('kod_gecersiz')) return { ok: false, reason: 'invalid' };
    return { ok: false, reason: 'failed' };
  }
  const row = (data as { id: string; name: string | null; handle: string }[] | null)?.[0];
  if (!row) return { ok: false, reason: 'failed' };
  return { ok: true, id: row.id, name: row.name ?? row.handle, handle: row.handle };
}

export type FriendCode = { code: string; expiresAt: Date };

/** Kendi QR'ın için yeni kod üretir (eskisi geçersiz olur); alınamazsa null. */
export async function fetchMyFriendCode(): Promise<FriendCode | null> {
  const { data, error } = await supabase.rpc('my_friend_code');
  const row = (data as { code: string; expires_at: string }[] | null)?.[0];
  if (error || !row) return null;
  return { code: row.code, expiresAt: new Date(row.expires_at) };
}
