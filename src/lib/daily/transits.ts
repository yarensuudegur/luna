import { houseOf, moonPhaseName, norm, planetsAt, signIndex } from '@/lib/astro';
import type { PlanetKey, PlanetPosition } from '@/lib/astro';

export type AspectKind = 'kavuşum' | 'altmışlık' | 'kare' | 'üçgen' | 'karşıt';

const ASPECTS: ReadonlyArray<{ kind: AspectKind; angle: number; glyph: string }> = [
  { kind: 'kavuşum', angle: 0, glyph: '☌' },
  { kind: 'altmışlık', angle: 60, glyph: '⚹' },
  { kind: 'kare', angle: 90, glyph: '□' },
  { kind: 'üçgen', angle: 120, glyph: '△' },
  { kind: 'karşıt', angle: 180, glyph: '☍' },
];

/** Transit gezegenin doğal gezegene yaptığı açıda kabul edilen en geniş sapma (derece). */
const ORB: Record<PlanetKey, number> = {
  Güneş: 4, Ay: 3, Merkür: 3, Venüs: 3, Mars: 4, Jüpiter: 3, Satürn: 3, Uranüs: 2, Neptün: 2, Plüton: 2,
};

/** Açının günün yorumundaki ağırlığı: yavaş gezegenler ve ışıklar daha önemli. */
const WEIGHT: Record<PlanetKey, number> = {
  Güneş: 1, Ay: 0.6, Merkür: 0.8, Venüs: 0.9, Mars: 1, Jüpiter: 1.2, Satürn: 1.2, Uranüs: 1.3, Neptün: 1.3, Plüton: 1.3,
};

export type NatalTarget = PlanetKey | 'Yükselen';

export type Aspect = {
  transit: PlanetKey;
  glyph: string;
  kind: AspectKind;
  aspectGlyph: string;
  natal: NatalTarget;
  /** Tam açıdan sapma, derece. */
  orb: number;
  /** Büyük = daha önemli. */
  strength: number;
};

/** Kullanıcının doğum haritasından transitlerin ihtiyaç duyduğu kısım. */
export type Natal = {
  planets: readonly PlanetPosition[];
  asc: number | null;
  /** Ev başlangıçları; doğum saati bilinmiyorsa null. */
  cusps: readonly number[] | null;
};

export type BodyToday = {
  lon: number;
  /** Burç dizini, 0 = Koç. */
  sign: number;
  /** Doğum saati bilinmiyorsa null. */
  house: number | null;
};

export type Transits = {
  planets: PlanetPosition[];
  moon: BodyToday;
  sun: BodyToday;
  phase: string;
  /** En güçlüden zayıfa, en çok 6 açı. */
  aspects: Aspect[];
};

/** Bir günün transit anı: o günün yerel öğlesi (Ay günde ~13° gittiği için gün ortası temsilidir). */
export function transitMoment(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function bodyToday(p: PlanetPosition, cusps: readonly number[] | null): BodyToday {
  return { lon: p.lon, sign: signIndex(p.lon), house: cusps ? houseOf(p.lon, cusps) : null };
}

/** İki boylam arasındaki en kısa açı farkı [0, 180]. */
function separation(a: number, b: number): number {
  const d = Math.abs(norm(a - b));
  return d > 180 ? 360 - d : d;
}

export function computeTransits(dateKey: string, natal: Natal): Transits {
  const when = transitMoment(dateKey);
  const planets = planetsAt(when);
  const moon = planets.find((p) => p.key === 'Ay')!;
  const sun = planets.find((p) => p.key === 'Güneş')!;

  const targets: Array<{ key: NatalTarget; lon: number; weight: number }> = natal.planets.map((p) => ({
    key: p.key,
    lon: p.lon,
    weight: p.key === 'Güneş' || p.key === 'Ay' ? 1.2 : 1,
  }));
  if (natal.asc !== null) targets.push({ key: 'Yükselen', lon: natal.asc, weight: 1.2 });

  const aspects: Aspect[] = [];
  for (const t of planets) {
    for (const n of targets) {
      const sep = separation(t.lon, n.lon);
      for (const a of ASPECTS) {
        const orb = Math.abs(sep - a.angle);
        if (orb > ORB[t.key]) continue;
        aspects.push({
          transit: t.key,
          glyph: t.glyph,
          kind: a.kind,
          aspectGlyph: a.glyph,
          natal: n.key,
          orb,
          strength: (1 - orb / ORB[t.key]) * WEIGHT[t.key] * n.weight,
        });
      }
    }
  }
  aspects.sort((x, y) => y.strength - x.strength);

  return {
    planets,
    moon: bodyToday(moon, natal.cusps),
    sun: bodyToday(sun, natal.cusps),
    phase: moonPhaseName(when),
    aspects: aspects.slice(0, 6),
  };
}
