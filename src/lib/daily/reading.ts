import { t } from '@/i18n/core';
import { currentLang } from '@/i18n/lang';
import type { Lang } from '@/i18n/lang';
import type { PlanetKey } from '@/lib/astro';
import { DAILY_META, DEEP_CATEGORIES, contentFor } from './content';
import type { DeepCategory, LuckState } from './content';
import { pickN, pickWeighted, rng } from './rng';
import type { Aspect, Transits } from './transits';

export type DeepEntry = { k: DeepCategory; st: LuckState; txt: string };

export type Reading = {
  /** Başlık. */
  h: string;
  /** Bugün ekranındaki kısa metin. */
  body: string;
  dos: string[];
  donts: string[];
  /** Derine in'deki uzun yorum, paragraf paragraf. */
  long: string[];
  deep: DeepEntry[];
};

/** Hangi gezegenler ve evler hangi alanı etkiler. */
const CATEGORY_RULES: Record<DeepCategory, { planets: readonly string[]; houses: readonly number[] }> = {
  'Ev & aile': { planets: ['Ay'], houses: [4] },
  Arkadaşlar: { planets: ['Jüpiter', 'Merkür'], houses: [11, 3] },
  'İş & para': { planets: ['Satürn', 'Mars', 'Güneş'], houses: [10, 2, 6] },
  Aşk: { planets: ['Venüs', 'Mars'], houses: [5, 7] },
  Düşünce: { planets: ['Merkür'], houses: [3, 9] },
  Ruhsal: { planets: ['Neptün', 'Ay'], houses: [12, 8] },
};

const BENEFICS: readonly PlanetKey[] = ['Venüs', 'Jüpiter'];

/** Açının tonu: 0 uyumlu, 1 baskı, 2 zorlayıcı. */
function tone(a: Aspect): 0 | 1 | 2 {
  if (a.kind === 'üçgen' || a.kind === 'altmışlık') return 0;
  if (a.kind === 'kare') return 2;
  if (a.kind === 'karşıt') return 1;
  return BENEFICS.includes(a.transit) ? 0 : 1;
}

/** Bir alanın o günkü durumu: önce o alanı ilgilendiren açılar, yoksa Ay'ın evi, yoksa sakin gün. */
function categoryState(k: DeepCategory, tr: Transits, seed: string): { st: LuckState; score: number } {
  const rule = CATEGORY_RULES[k];
  const score = [0, 0, 0];
  for (const a of tr.aspects) {
    if (rule.planets.includes(a.transit) || rule.planets.includes(a.natal)) score[tone(a)] += a.strength;
  }
  const best = Math.max(...score);
  if (best > 0) {
    const st = score.indexOf(best) as 0 | 1 | 2;
    return { st, score: score[2] };
  }
  if (tr.moon.house !== null && rule.houses.includes(tr.moon.house)) return { st: 0, score: 0 };
  // Gökyüzü bu alanda sessiz: çoğunlukla akış, bazen hafif şans.
  return { st: rng(seed + k)() < 0.25 ? 0 : 3, score: 0 };
}

/** Metnin transitlerle örtüşme puanı: konuştuğu gezegenin açısı ve Ay'ın evi. */
function relevance(index: number, tr: Transits): number {
  const meta = DAILY_META[index];
  let s = 0;
  for (const a of tr.aspects) if (meta.planets.includes(a.transit)) s += a.strength;
  if (tr.moon.house !== null && meta.houses?.includes(tr.moon.house)) s += 0.8;
  return s;
}

const ordinalEn = (n: number): string => {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

/**
 * Bir kullanıcının bir günkü yorumu. Tohum kullanıcı ID'si ve tarihtir, bu yüzden aynı gün
 * hep aynı metin gelir; metinler ise o günün transitlerine göre ağırlıklanarak seçilir.
 * Seçim dilden bağımsızdır: dil yalnızca metni belirler.
 */
export function buildReading(userId: string, dateKey: string, tr: Transits, lang: Lang = 'tr'): Reading {
  const seed = `${userId}|${dateKey}`;
  const c = contentFor(lang);
  const index = pickWeighted(
    rng(`day|${seed}`),
    DAILY_META.map((_, i) => i),
    (i) => 1 + 3 * relevance(i, tr),
  );
  const item = c.daily[index];
  const ay = t('signs.in.' + tr.moon.sign, { lng: lang });

  const r2 = rng(`dodont|${seed}`);
  const dos = pickN(r2, c.dos.map((_, i) => i), 3).map((i) => c.dos[i]);
  const donts = pickN(r2, c.donts.map((_, i) => i), 3).map((i) => c.donts[i]);

  const states = DEEP_CATEGORIES.map((k) => ({ k, ...categoryState(k, tr, `deep|${seed}|`) }));
  // Prototipteki kural: aynı gün en fazla bir alan "zorluk" olsun, en güçlüsü kalır.
  const hard = states.filter((s) => s.st === 2).sort((a, b) => b.score - a.score);
  const deep = states.map<DeepEntry>(({ k, st }) => {
    const final: LuckState = st === 2 && k !== hard[0].k ? 3 : st;
    return { k, st: final, txt: c.deep[k][final] };
  });

  const base = item.b.replace('{{ay}}', ay);
  const long = [base, `${item.s} ${item.x}`];
  if (tr.moon.house !== null && tr.sun.house !== null) {
    const house = (n: number) => (lang === 'en' ? ordinalEn(n) : n);
    long.push(
      t('reading.houses', {
        lng: lang,
        moonHouse: house(tr.moon.house),
        moonTheme: c.houseTheme[tr.moon.house - 1],
        sunHouse: house(tr.sun.house),
        sunTheme: c.houseTheme[tr.sun.house - 1],
      }),
    );
  } else {
    long.push(t('reading.signs', { lng: lang, moon: ay, sun: t('signs.in.' + tr.sun.sign, { lng: lang }) }));
  }
  if (tr.aspects[0]) long.push(aspectSentence(tr.aspects[0], lang));

  return { h: item.h, body: base, dos, donts, long, deep };
}

/** "Gökyüzündeki Mars, doğum haritandaki Güneş ile kare yapıyor." gibi açı cümlesi. */
export function aspectSentence(a: Aspect, lang: Lang = currentLang()): string {
  return t('aspects.sentence', {
    lng: lang,
    transit: t(`planets.${a.transit}`, { lng: lang }),
    natal: t(`planets.${a.natal}`, { lng: lang }),
    kind: t(`aspects.${a.kind}`, { lng: lang }),
  });
}
