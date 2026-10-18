export const EVENING_DAYS = 14;

/** Akşam hatırlatmalarının zamanları: bugünden başlayarak `days` gün, geçmiş saatler ve (istenirse) bugün atlanır. */
export function eveningDates(now: Date, hour: number, skipToday: boolean, days = EVENING_DAYS): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < days; i++) {
    if (i === 0 && skipToday) continue;
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(hour, 0, 0, 0);
    if (d.getTime() > now.getTime()) out.push(d);
  }
  return out;
}

export type ReminderTab = 'index' | 'gunluk';

export function isReminderTab(v: unknown): v is ReminderTab {
  return v === 'index' || v === 'gunluk';
}
