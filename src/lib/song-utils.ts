import { rng } from '@/lib/daily/rng';

/** Bir şarkı; kapak ve bağlantı Apple'ın arama servisinden gelir, demo şarkılarda yoktur. */
export type Song = {
  id: string;
  title: string;
  artist: string;
  art: string | null;
  url: string | null;
};

const str = (v: unknown, max = 200): string | null => (typeof v === 'string' && v.trim() ? v.slice(0, max) : null);

/** Veritabanından gelen jsonb'yi şarkıya çevirir; biçimi bozuksa null. */
export function parseSong(raw: unknown): Song | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const title = str(o.title);
  const artist = str(o.artist);
  if (!title || !artist) return null;
  return {
    id: str(o.id, 64) ?? `${artist}-${title}`,
    title,
    artist,
    art: str(o.art, 500),
    url: str(o.url, 500),
  };
}

/** Şarkıyı Spotify'da aratan bağlantı. */
export const spotifyUrl = (s: Song) =>
  `https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist}`)}`;

/** Apple Music bağlantısı; yoksa Apple Music'te arama. */
export const appleUrl = (s: Song) =>
  s.url ?? `https://music.apple.com/search?term=${encodeURIComponent(`${s.title} ${s.artist}`)}`;

/** Gün anahtarı ve o günün şarkısı. */
export type SongDay = { date: string; song: Song };

/**
 * Haftanın şarkısı: haftaya eklenen şarkılardan biri, sistem tarafından "rastgele" seçilir.
 * Tohum haftanın pazartesisi olduğu için aynı hafta hep aynı şarkıyı verir.
 */
export function weekSong(weekStart: string, days: readonly SongDay[]): SongDay | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[Math.floor(rng(`haftanin-sarkisi${weekStart}`)() * sorted.length)];
}

/** Demo haftası için şarkılar (kapaksız; plak çizimiyle görünür). */
export const DEMO_SONGS: Song[] = [
  { id: 'demo-1', title: 'UNETHICAL', artist: 'Faouzia', art: null, url: null },
  { id: 'demo-2', title: 'Getting Older', artist: 'Billie Eilish', art: null, url: null },
  { id: 'demo-3', title: 'Lover’s Grip', artist: 'Them & I', art: null, url: null },
  { id: 'demo-4', title: 'us.', artist: 'Gracie Abrams', art: null, url: null },
  { id: 'demo-5', title: 'Bittersweet', artist: 'Madison Beer', art: null, url: null },
  { id: 'demo-6', title: 'Take Me There', artist: 'DA TI', art: null, url: null },
];
