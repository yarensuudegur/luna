import { t } from '@/i18n/core';

const pad2 = (n: number) => String(n).padStart(2, '0');

const list = (key: string): string[] => t(key, { returnObjects: true }) as unknown as string[];

/** Örn. "PAZ 18 EKİ" / "SUN OCT 18" */
export function formatTopDate(d: Date = new Date()): string {
  return t('date.topDate', {
    dow: list('date.dowShort')[d.getDay()],
    day: d.getDate(),
    month: list('date.monthShort')[d.getMonth()],
  });
}

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

/** Örn. "18 Ekim 2026" / "October 18, 2026" */
export function formatFullDate(d: Date): string {
  return t('date.full', { day: d.getDate(), month: monthName(d), year: d.getFullYear() });
}

/** Ay adı, örn. "Ekim" / "October". */
export function monthName(d: Date): string {
  return list('date.monthLong')[d.getMonth()];
}

/** Örn. "18 Ekim" / "October 18" */
export function formatDayMonth(d: Date): string {
  return t('date.dayMonth', { day: d.getDate(), month: monthName(d) });
}

export function dayName(d: Date): string {
  return list('date.dowLong')[d.getDay()];
}

/** Haftanın kısa gün adı ("PAZ") ve "bugün" kısaltması. */
export const dayShort = (d: Date): string => list('date.dowShort')[d.getDay()];

/** Gece yarısına kalan süre, "SS:DD:SS". */
export function countdownToMidnight(now: Date = new Date()): string {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}
