const GUNLER = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'] as const;
const AYLAR = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'] as const;

/** Örn. "PAZ 18 EKİ" */
export function formatTopDate(d: Date = new Date()): string {
  return `${GUNLER[d.getDay()]} ${d.getDate()} ${AYLAR[d.getMonth()]}`;
}

const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;
const AY_ADLARI = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Yerel tarihi "YYYY-MM-DD" anahtarına çevirir. */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "YYYY-MM-DD" anahtarını yerel öğle saatinde bir Date'e çevirir. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Örn. "18 Ekim" */
export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${AY_ADLARI[d.getMonth()]}`;
}

export function dayName(d: Date): string {
  return GUN_ADLARI[d.getDay()];
}

/** Gece yarısına kalan süre, "SS:DD:SS". */
export function countdownToMidnight(now: Date = new Date()): string {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}
