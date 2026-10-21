import { useCallback, useEffect, useState } from 'react';
import { parseSong } from '@/lib/song-utils';
import type { Song, SongDay } from '@/lib/song-utils';
import { supabase } from '@/lib/supabase';

export * from '@/lib/song-utils';

/** Şarkı arar (Edge Function `song-search` üzerinden iTunes); hata olursa null. */
export async function searchSongs(q: string): Promise<Song[] | null> {
  const query = q.trim();
  if (query.length < 2) return [];
  const { data, error } = await supabase.functions.invoke('song-search', { body: { q: query } });
  if (error || !data) return null;
  const list = (data as { songs?: unknown }).songs;
  if (!Array.isArray(list)) return null;
  return list.map(parseSong).filter((s): s is Song => s !== null);
}

// ---------------------------------------------------------------------------
// Arşiv: şarkı eklenmiş günler
// ---------------------------------------------------------------------------

/** Şarkı eklenmiş tüm günler, eskiden yeniye. */
export function useSongDays(userId: string | undefined, active = true) {
  const [days, setDays] = useState<SongDay[]>([]);

  useEffect(() => {
    if (!userId || !active) return;
    let alive = true;
    supabase
      .from('moods')
      .select('date, song')
      .eq('user_id', userId)
      .not('song', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (!alive || !data) return;
        setDays(
          (data as { date: string; song: unknown }[])
            .map((r) => ({ date: r.date, song: parseSong(r.song) }))
            .filter((d): d is SongDay => d.song !== null),
        );
      });
    return () => {
      alive = false;
    };
  }, [userId, active]);

  return days;
}

// ---------------------------------------------------------------------------
// Şu an dinliyorum
// ---------------------------------------------------------------------------

/** Not 24 saat görünür (Instagram notu gibi). */
export const NOW_PLAYING_MS = 24 * 60 * 60 * 1000;

export type NowPlaying = { song: Song; setAt: Date };

function toNowPlaying(song: unknown, setAt: unknown): NowPlaying | null {
  const s = parseSong(song);
  if (!s || typeof setAt !== 'string') return null;
  const at = new Date(setAt);
  if (Number.isNaN(at.getTime()) || Date.now() - at.getTime() > NOW_PLAYING_MS) return null;
  return { song: s, setAt: at };
}

/** Kendi notum: oku, değiştir, kaldır. */
export function useNowPlaying(userId: string | undefined) {
  const [current, setCurrent] = useState<NowPlaying | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase
      .from('profiles')
      .select('now_playing, now_playing_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        const row = data as { now_playing: unknown; now_playing_at: unknown };
        setCurrent(toNowPlaying(row.now_playing, row.now_playing_at));
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  /** Şarkıyı not olarak koyar (null: kaldırır); kaydedilemezse false. */
  const set = useCallback(
    async (song: Song | null) => {
      if (!userId) return false;
      const setAt = new Date();
      const { error } = await supabase
        .from('profiles')
        .update({ now_playing: song, now_playing_at: song ? setAt.toISOString() : null })
        .eq('id', userId);
      if (error) return false;
      setCurrent(song ? { song, setAt } : null);
      return true;
    },
    [userId],
  );

  return { current, set };
}

/** Arkadaşların son 24 saatteki şarkıları: arkadaş id → not. */
export function useFriendSongs(userId: string | undefined, refreshKey = 0) {
  const [songs, setSongs] = useState<Record<string, NowPlaying>>({});

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase.rpc('friend_songs').then(({ data }) => {
      if (!alive || !data) return;
      const map: Record<string, NowPlaying> = {};
      for (const r of data as { id: string; song: unknown; set_at: unknown }[]) {
        const np = toNowPlaying(r.song, r.set_at);
        if (np) map[r.id] = np;
      }
      setSongs(map);
    });
    return () => {
      alive = false;
    };
  }, [userId, refreshKey]);

  return songs;
}

/** Arkadaşın şarkısına cevap yazar; olmazsa false. */
export async function replyToSong(friendId: string, body: string): Promise<boolean> {
  const text = body.trim().slice(0, 200);
  if (!text) return false;
  const { error } = await supabase.rpc('reply_to_song', { p_friend: friendId, p_body: text });
  return !error;
}

export type SongReply = {
  id: string;
  name: string;
  avatar: string | null;
  song: Song | null;
  body: string;
  read: boolean;
  at: Date;
};

/** Şarkılarıma gelen cevaplar (son 30 gün). */
export function useSongReplies(userId: string | undefined) {
  const [replies, setReplies] = useState<SongReply[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase.rpc('my_song_replies').then(({ data }) => {
      if (!alive || !data) return;
      setReplies(
        (
          data as {
            id: string;
            sender_name: string | null;
            sender_avatar: string | null;
            song: unknown;
            body: string;
            read: boolean;
            created_at: string;
          }[]
        ).map((r) => ({
          id: r.id,
          name: r.sender_name ?? '',
          avatar: r.sender_avatar,
          song: parseSong(r.song),
          body: r.body,
          read: r.read,
          at: new Date(r.created_at),
        })),
      );
    });
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  /** Hepsini okundu yapar. */
  const markRead = useCallback(async () => {
    if (!replies.some((r) => !r.read)) return;
    setReplies((list) => list.map((r) => ({ ...r, read: true })));
    await supabase.rpc('read_song_replies');
  }, [replies]);

  const unread = replies.filter((r) => !r.read).length;
  return { replies, unread, reload, markRead };
}
