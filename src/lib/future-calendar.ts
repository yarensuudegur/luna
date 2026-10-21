import type { Song, SongDay } from '@/lib/song-utils';

/** Teslim edilmiş bir mesaj. */
export type ArchivedMessage = { id: string; body: string; createdAt: Date; deliverAt: Date };

export type CalendarMonth = {
  year: number;
  /** 0 = Ocak */
  month: number;
  /** Ayın ilk gününden önceki boş hücre sayısı (hafta Pazartesi'den başlar). */
  lead: number;
  daysInMonth: number;
  /** Ayın günü → o gün teslim edilen mesajlar (eskiden yeniye). */
  byDay: Map<number, ArchivedMessage[]>;
  /** Ayın günü → o günün şarkısı (günlükte eklenen). */
  songs: Map<number, Song>;
};

/** Mesajı yerel saatte teslim edildiği güne göre "YYYY-AA-GG" anahtarına çevirir. */
export const deliveryDayKey = (m: ArchivedMessage): string => {
  const d = m.deliverAt;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Yalnızca mesajı ya da şarkısı olan aylar, en yeni ay en üstte.
 * Teslim günü kullanıcının yerel saatine göre; şarkı günü günlükteki gün anahtarından.
 */
export function groupByMonth(messages: readonly ArchivedMessage[], songs: readonly SongDay[] = []): CalendarMonth[] {
  const months = new Map<string, CalendarMonth>();
  const monthOf = (year: number, month: number) => {
    const key = `${year}-${month}`;
    let entry = months.get(key);
    if (!entry) {
      entry = {
        year,
        month,
        lead: (new Date(year, month, 1).getDay() + 6) % 7,
        daysInMonth: new Date(year, month + 1, 0).getDate(),
        byDay: new Map(),
        songs: new Map(),
      };
      months.set(key, entry);
    }
    return entry;
  };
  const sorted = [...messages].sort((a, b) => a.deliverAt.getTime() - b.deliverAt.getTime());
  for (const m of sorted) {
    const entry = monthOf(m.deliverAt.getFullYear(), m.deliverAt.getMonth());
    const day = m.deliverAt.getDate();
    entry.byDay.set(day, [...(entry.byDay.get(day) ?? []), m]);
  }
  for (const d of songs) {
    const [y, mo, day] = d.date.split('-').map(Number);
    if (!y || !mo || !day) continue;
    monthOf(y, mo - 1).songs.set(day, d.song);
  }
  return [...months.values()].sort((a, b) => b.year - a.year || b.month - a.month);
}
