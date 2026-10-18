import { t } from '@/i18n/core';
import type { Chart, PlanetKey } from './chart';
import { norm, signIndex } from './zodiac';

export type CompatKey = 'Aşk' | 'Arkadaşlık' | 'İletişim' | 'İş';

export type Compat = Record<CompatKey, number>;

/** Prototipteki ELEM ile aynı sıra: burç dizini % 4. */
export const ELEMENTS = ['Ateş', 'Toprak', 'Hava', 'Su'] as const;

/** Kişinin Güneş burcunun elementi (0 Ateş, 1 Toprak, 2 Hava, 3 Su). */
export function elementOf(sign: number): number {
  return sign % 4;
}

type Aspect = { angle: number; orb: number; harmony: number };

/** Uyum: +1 besleyici, negatif gerilimli. Açı ne kadar tam oturursa etkisi o kadar büyür. */
const ASPECTS: readonly Aspect[] = [
  { angle: 0, orb: 8, harmony: 1 },
  { angle: 60, orb: 5, harmony: 0.7 },
  { angle: 120, orb: 6, harmony: 1 },
  { angle: 90, orb: 6, harmony: -0.8 },
  { angle: 180, orb: 7, harmony: -0.4 },
];

/** [A'nın gezegeni, B'nin gezegeni, ağırlık]; iki yönde de bakılır. */
type Pair = readonly [PlanetKey, PlanetKey, number];

const PAIRS: Record<CompatKey, readonly Pair[]> = {
  Aşk: [
    ['Venüs', 'Mars', 2],
    ['Venüs', 'Venüs', 1.4],
    ['Güneş', 'Ay', 1.6],
    ['Ay', 'Venüs', 1.4],
    ['Mars', 'Mars', 1],
    ['Güneş', 'Venüs', 1.2],
  ],
  Arkadaşlık: [
    ['Güneş', 'Güneş', 1.4],
    ['Ay', 'Ay', 1.6],
    ['Jüpiter', 'Güneş', 1.2],
    ['Jüpiter', 'Ay', 1.2],
    ['Güneş', 'Venüs', 1.2],
    ['Venüs', 'Venüs', 1],
  ],
  İletişim: [
    ['Merkür', 'Merkür', 2],
    ['Merkür', 'Güneş', 1.4],
    ['Merkür', 'Ay', 1.4],
    ['Merkür', 'Venüs', 1],
    ['Merkür', 'Mars', 0.8],
  ],
  İş: [
    ['Güneş', 'Satürn', 1.4],
    ['Merkür', 'Satürn', 1.2],
    ['Mars', 'Mars', 1.4],
    ['Jüpiter', 'Güneş', 1.2],
    ['Merkür', 'Jüpiter', 1.2],
    ['Mars', 'Satürn', 0.8],
  ],
};

/** İki boylam arasındaki açının bir açıyla ilişkisi: uyum katsayısı ya da 0. */
function aspectScore(a: number, b: number): number {
  const sep = Math.abs(norm(a - b + 180) - 180);
  let best = 0;
  for (const asp of ASPECTS) {
    const off = Math.abs(sep - asp.angle);
    if (off > asp.orb) continue;
    const v = asp.harmony * (1 - off / asp.orb);
    if (Math.abs(v) > Math.abs(best)) best = v;
  }
  return best;
}

function lonOf(chart: Chart, key: PlanetKey): number | null {
  return chart.planets.find((p) => p.key === key)?.lon ?? null;
}

/** Güneşler aynı ya da birbirini besleyen elementteyse küçük bir pay. */
function elementBonus(a: Chart, b: Chart): number {
  const sa = lonOf(a, 'Güneş');
  const sb = lonOf(b, 'Güneş');
  if (sa === null || sb === null) return 0;
  const ea = elementOf(signIndex(sa));
  const eb = elementOf(signIndex(sb));
  if (ea === eb) return 0.6;
  // Ateş–Hava (0,2) ve Toprak–Su (1,3) birbirini besler.
  return (ea + eb) % 2 === 0 ? 0.4 : 0;
}

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));

/**
 * İki doğum haritasından 1–10 arası dört uyum puanı. Her alan için ilgili
 * gezegen çiftlerinin birbirine açıları toplanır; iki yönde de bakılır.
 */
export function compatibility(a: Chart, b: Chart): Compat {
  const bonus = elementBonus(a, b);
  const out = {} as Compat;
  for (const key of Object.keys(PAIRS) as CompatKey[]) {
    let raw = 0;
    for (const [p, q, w] of PAIRS[key]) {
      const pa = lonOf(a, p);
      const qb = lonOf(b, q);
      if (pa !== null && qb !== null) raw += w * aspectScore(pa, qb);
      if (p !== q) {
        const qa = lonOf(a, q);
        const pb = lonOf(b, p);
        if (qa !== null && pb !== null) raw += w * aspectScore(qa, pb);
      }
    }
    out[key] = clamp(5 + raw * 1.1 + bonus);
  }
  return out;
}

/** İlişki geçişi kartındaki cümle: iki Güneş'in elementlerine göre. */
export function sunPairLine(sunA: number, sunB: number): string {
  const a = elementOf(sunA);
  const b = elementOf(sunB);
  if (a === b) return t('friends.transition.sunSame');
  if ((a + b) % 2 === 0) return t('friends.transition.sunFeed');
  return t('friends.transition.sunDiff');
}

export const ROLES = ['Ateşleyici', 'Planlayıcı', 'Fikir insanı', 'Arabulucu'] as const;

export type GroupMix = {
  /** Element başına kişi sayısı, ELEMENTS sırasıyla. */
  counts: [number, number, number, number];
  total: number;
  /** En kalabalık element (eşitlikte ilki). */
  dominant: number;
  /** Baskın elementin yüzdesi. */
  percent: number;
};

/** Güneş burçlarından element dağılımı. */
export function groupMix(sunSigns: readonly number[]): GroupMix {
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  for (const s of sunSigns) counts[elementOf(s)]++;
  const total = sunSigns.length;
  const dominant = counts.indexOf(Math.max(...counts));
  return { counts, total, dominant, percent: total ? Math.round((counts[dominant] / total) * 100) : 0 };
}
