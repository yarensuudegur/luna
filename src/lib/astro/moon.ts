import { MoonPhase, SearchMoonPhase } from 'astronomy-engine';
import { planetsAt } from './chart';
import { signIndex } from './zodiac';

/** Ay'ın Güneş'e göre boylam farkı, derece [0, 360): 0 yeni ay, 180 dolunay. */
export function moonElongation(when: Date): number {
  return MoonPhase(when);
}

/** Prototipteki phaseName ile aynı eşikler. */
export function moonPhaseName(when: Date): string {
  const e = moonElongation(when);
  if (e < 12 || e > 348) return 'Yeni Ay';
  if (e < 80) return 'Büyüyen Hilal';
  if (e < 100) return 'İlk Dördün';
  if (e < 168) return 'Büyüyen Ay';
  if (e < 192) return 'Dolunay';
  if (e < 260) return 'Küçülen Ay';
  if (e < 280) return 'Son Dördün';
  return 'Küçülen Hilal';
}

export type MoonEvent = {
  name: 'Dolunay' | 'Yeni Ay';
  date: Date;
  /** Olay anında Ay'ın burç dizini (0 = Koç). */
  sign: number;
};

/** `from` anından sonraki ilk yeni ay ya da dolunay; bulunamazsa null. */
export function nextMoonEvent(from: Date): MoonEvent | null {
  const newMoon = SearchMoonPhase(0, from, 40);
  const fullMoon = SearchMoonPhase(180, from, 40);
  const found = [
    newMoon && { name: 'Yeni Ay' as const, date: newMoon.date },
    fullMoon && { name: 'Dolunay' as const, date: fullMoon.date },
  ]
    .filter((e): e is { name: 'Yeni Ay' | 'Dolunay'; date: Date } => !!e)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  if (!found) return null;
  const moon = planetsAt(found.date).find((p) => p.key === 'Ay');
  return { ...found, sign: moon ? signIndex(moon.lon) : 0 };
}
