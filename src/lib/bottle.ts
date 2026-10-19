import slotsData from '../../assets/bottle/slots.json';
import { t } from '@/i18n/core';
import { currentLang, decimal, locale } from '@/i18n/lang';
import { moodName } from '@/i18n/names';
import { contentFor } from '@/lib/daily/content';
import { rng } from '@/lib/daily/rng';
import { addDays, dateKey, dayName, formatDayMonth, fromDateKey, monthName } from '@/lib/date';

export const MOODS = [
  ['mutluluk', 'Mutluluk'],
  ['enerji', 'Enerji'],
  ['huzur', 'Huzur'],
  ['kaygi', 'Kaygı'],
  ['sevgi', 'Sevgi'],
  ['motivasyon', 'Motivasyon'],
] as const;

export type MoodField = (typeof MOODS)[number][0];
export type MoodValues = Record<MoodField, number>;
export type MoodEntry = { values: MoodValues; note: string };
/** "YYYY-MM-DD" anahtarlı duygu kayıtları. */
export type MoodMap = Record<string, MoodEntry>;

/** Şişe çiziminin ölçüleri; assets/bottle/slots.json prototipteki BOT nesnesinden çıkarıldı. */
export const BOTTLE = {
  width: slotsData.width,
  height: slotsData.height,
  orb: slotsData.orbSize,
  mouth: slotsData.mouth as [number, number],
  slots: slotsData.slots as [number, number][],
} as const;

export const DEFAULT_EVENING = '21:00';
export const EVENING_OPTIONS = ['20:00', '21:00', '22:00', '23:00'] as const;

export const low = (s: string) => s.toLocaleLowerCase(locale());
export const up = (s: string) => s.toLocaleUpperCase(locale());

/** Duygunun görünen adı. `WeekData.best` arşivde Türkçe adıyla durur; bu da onu seçili dile çevirir. */
export function moodLabel(trLabel: string): string {
  const found = MOODS.find(([, label]) => label === trLabel);
  return found ? moodName(found[0]) : trLabel;
}

export { monthName };
/** Haftanın pazartesisinin anahtarı. */
export function weekStartKey(today: string): string {
  const d = fromDateKey(today);
  return dateKey(addDays(d, -((d.getDay() + 6) % 7)));
}

/** Pazartesiden bugüne (dahil) günlerin anahtarları. */
export function weekKeys(today: string): string[] {
  const start = fromDateKey(weekStartKey(today));
  const n = (fromDateKey(today).getDay() + 6) % 7;
  return Array.from({ length: n + 1 }, (_, i) => dateKey(addDays(start, i)));
}

/** Örn. "12–18 Ekim" veya "28 Eylül–4 Ekim" / "October 12–18". */
export function weekLabel(weekStart: string): string {
  const m = fromDateKey(weekStart);
  const e = addDays(m, 6);
  if (m.getMonth() === e.getMonth()) {
    return t('date.weekSame', { a: m.getDate(), b: e.getDate(), month: monthName(e) });
  }
  return t('date.weekSpan', { a: m.getDate(), month1: monthName(m), b: e.getDate(), month2: monthName(e) });
}

export const weekdayName = (key: string) => dayName(fromDateKey(key));
export const isSunday = (key: string) => fromDateKey(key).getDay() === 0;

/** "21:00" gibi ayardan saat; geçersizse 21. */
export function eveningHour(setting: string): number {
  const h = parseInt(setting, 10);
  return Number.isFinite(h) && h >= 0 && h < 24 ? h : 21;
}

/** Akşam saatine kalan süre "SS:DD"; saat geldiyse boş. */
export function eveningCountdown(now: Date, setting: string): string {
  const t = new Date(now);
  t.setHours(eveningHour(setting), 0, 0, 0);
  const ms = t.getTime() - now.getTime();
  if (ms <= 0) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor((ms % 3_600_000) / 60_000))}`;
}

export const isEvening = (now: Date, setting: string) => now.getHours() >= eveningHour(setting);

export function avgOf(keys: readonly string[], moods: MoodMap, field: MoodField): number | null {
  const xs = keys.map((k) => moods[k]?.values[field]).filter((x): x is number => x != null);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

const fmtAvg = (n: number | null) => (n == null ? '-' : decimal(n, 1));

/** Kaygı dışındaki en yüksek ortalamalı duygu (prototipteki "haftanın duygusu"). */
export function bestMood(keys: readonly string[], moods: MoodMap): { label: string; value: number } {
  let best: string = MOODS[0][1];
  let bv = -1;
  for (const [f, label] of MOODS) {
    if (f === 'kaygi') continue;
    const a = avgOf(keys, moods, f);
    if (a != null && a > bv) {
      bv = a;
      best = label;
    }
  }
  return { label: best, value: bv };
}

/** Story kartı ve arşiv satırı için hafta özeti; arşive olduğu gibi yazılır. */
export type WeekData = {
  label: string;
  /** Haftanın duygusu, örn. "Huzur". */
  best: string;
  /** Kayıtlı günlerin anahtarları. */
  keys: string[];
  /** Duygu başına ortalama, "6,5" biçiminde; kayıt yoksa "-". */
  avg: Record<MoodField, string>;
};

export function weekData(weekStart: string, keys: readonly string[], moods: MoodMap): WeekData {
  const ks = keys.filter((k) => moods[k]);
  const avg = {} as Record<MoodField, string>;
  for (const [f] of MOODS) avg[f] = fmtAvg(avgOf(ks, moods, f));
  return { label: weekLabel(weekStart), best: bestMood(ks, moods).label, keys: ks, avg };
}

export type OrbSpec = {
  /** Topun ait olduğu gün. */
  key: string;
  field: MoodField;
  x: number;
  y: number;
  /** Sallanma süresi (sn), gecikmesi (sn, negatif), kayma (px). */
  t: number;
  d: number;
  dx: number;
  dy: number;
  /** Aynı gün içindeki sırası 0..5. */
  nth: number;
};

/** Kayıtlı her gün için 6 top; alttan yukarı sırayla slotlara yerleşir. */
export function orbsFor(keys: readonly string[]): OrbSpec[] {
  const out: OrbSpec[] = [];
  let n = 0;
  for (const key of keys) {
    MOODS.forEach(([field], nth) => {
      const [x, y] = BOTTLE.slots[n % BOTTLE.slots.length];
      n++;
      const r = rng(`orb${key}${field}`);
      out.push({
        key,
        field,
        x,
        y,
        t: 4 + r() * 4,
        d: -r() * 6,
        // Her top gözle görülür biçimde (2–4 px) sallanır; işaret rastgele.
        dx: (r() < 0.5 ? -1 : 1) * (2 + r() * 2),
        dy: (r() < 0.5 ? -1 : 1) * (2 + r() * 2),
        nth,
      });
    });
  }
  return out;
}

/** Günün Ay burcu dizini (0 = Koç). */
export type MoonSignOf = (key: string) => number;

/** "Gökyüzü ve sen" cümleleri. tarot: gün anahtarı → kart numarası. */
export function weekInsights(
  filledKeys: readonly string[],
  moods: MoodMap,
  tarot: Record<string, number>,
  moonSignOf: MoonSignOf,
): string[] {
  const out: string[] = [];

  const byEl: string[][] = [[], [], [], []];
  for (const k of Object.keys(moods)) byEl[moonSignOf(k) % 4].push(k);
  let bE = -1;
  let bEv = -1;
  byEl.forEach((ks, i) => {
    const a = avgOf(ks, moods, 'huzur');
    if (a != null && a > bEv) {
      bEv = a;
      bE = i;
    }
  });
  if (bE >= 0) out.push(t('gunluk.insights.element', { element: low(t(`elements.${bE}`)) }));

  let mx = -1;
  let mk: string | null = null;
  for (const k of filledKeys) {
    const e = moods[k].values.enerji;
    if (e > mx) {
      mx = e;
      mk = k;
    }
  }
  if (mk) {
    out.push(t('gunluk.insights.energy', { day: low(weekdayName(mk)), sign: t(`signs.in.${moonSignOf(mk)}`) }));
  }

  const tk = filledKeys.filter((k) => tarot[k] != null);
  if (tk.length) {
    let bk = tk[0];
    for (const k of tk) if (moods[k].values.mutluluk > moods[bk].values.mutluluk) bk = k;
    out.push(t('gunluk.insights.card', { card: contentFor(currentLang()).tarot[tarot[bk]][1] }));
  }
  return out;
}

export type MonthSlide = readonly [label: string, title: string, sub: string];

/** Aylık özet (Wrapped) slaytları. */
export function monthSlides(
  month: Date,
  moods: MoodMap,
  tarot: Record<string, number>,
  moonSignOf: MoonSignOf,
  name: string,
): MonthSlide[] {
  const mo = month.getMonth();
  const inMonth = (k: string) => {
    const d = fromDateKey(k);
    return d.getMonth() === mo && d.getFullYear() === month.getFullYear();
  };
  const ks = Object.keys(moods).filter(inMonth);
  const best = bestMood(ks, moods);

  let mx = -1;
  let mk: string | null = null;
  for (const k of ks) {
    if (moods[k].values.enerji > mx) {
      mx = moods[k].values.enerji;
      mk = k;
    }
  }

  const cnt: Record<number, number> = {};
  for (const [k, card] of Object.entries(tarot)) if (inMonth(k)) cnt[card] = (cnt[card] ?? 0) + 1;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];

  const cards = contentFor(currentLang()).tarot;
  return [
    [
      t('gunluk.month.mood'),
      best.value < 0 ? '-' : `${moodLabel(best.label)}.`,
      best.value < 0 ? '' : t('gunluk.month.avg', { v: fmtAvg(best.value) }),
    ],
    [
      t('gunluk.month.energy'),
      mk ? `${formatDayMonth(fromDateKey(mk))}.` : '-',
      mk ? t('gunluk.month.moonIn', { sign: t(`signs.in.${moonSignOf(mk)}`) }) : '',
    ],
    [
      t('gunluk.month.card'),
      top ? `${cards[+top[0]][1]}.` : '-',
      top ? t('gunluk.month.times', { n: top[1], text: cards[+top[0]][2] }) : '',
    ],
    [t('gunluk.month.ending', { month: up(monthName(month)) }), t('gunluk.month.seeYou'), `${name} · ${month.getFullYear()}`],
  ];
}
