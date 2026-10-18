import { BURC_DA } from '@/lib/astro';
import type { PlanetKey } from '@/lib/astro';
import { DAILY, DEEP, DEEP_CATEGORIES, DO, DONT, HOUSE_THEME } from './content';
import type { DeepCategory, LuckState, Tone } from './content';
import { pickN, pickWeighted, rng } from './rng';
import type { Aspect, AspectKind, Transits } from './transits';

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

const KIND_PHRASE: Record<AspectKind, string> = {
  kavuşum: 'ile kavuşuyor',
  altmışlık: 'ile altmışlık açı yapıyor',
  kare: 'ile kare yapıyor',
  üçgen: 'ile üçgen yapıyor',
  karşıt: 'ile karşıt duruyor',
};

export function aspectSentence(a: Aspect): string {
  return `Gökyüzündeki ${a.transit}, doğum haritandaki ${a.natal} ${KIND_PHRASE[a.kind]}.`;
}

/** Metnin transitlerle örtüşme puanı: konuştuğu gezegenin açısı ve Ay'ın evi. */
function relevance(item: (typeof DAILY)[number], tr: Transits): number {
  let s = 0;
  for (const a of tr.aspects) if (item.planets.includes(a.transit)) s += a.strength;
  if (tr.moon.house !== null && item.houses?.includes(tr.moon.house)) s += 0.8;
  return s;
}

/**
 * Bir kullanıcının bir günkü yorumu. Tohum kullanıcı ID'si ve tarihtir, bu yüzden aynı gün
 * hep aynı metin gelir; metinler ise o günün transitlerine göre ağırlıklanarak seçilir.
 */
export function buildReading(userId: string, dateKey: string, tr: Transits, tone: Tone = 'Dengeli'): Reading {
  const seed = `${userId}|${dateKey}`;
  const item = pickWeighted(rng(`day|${seed}`), DAILY, (d) => 1 + 3 * relevance(d, tr));
  const ay = BURC_DA[tr.moon.sign];

  const r2 = rng(`dodont|${seed}`);
  const dos = pickN(r2, DO, 3);
  const donts = pickN(r2, DONT, 3);

  const states = DEEP_CATEGORIES.map((k) => ({ k, ...categoryState(k, tr, `deep|${seed}|`) }));
  // Prototipteki kural: aynı gün en fazla bir alan "zorluk" olsun, en güçlüsü kalır.
  const hard = states.filter((s) => s.st === 2).sort((a, b) => b.score - a.score);
  const deep = states.map<DeepEntry>(({ k, st }) => {
    const final: LuckState = st === 2 && k !== hard[0].k ? 3 : st;
    return { k, st: final, txt: DEEP[k][final] };
  });

  const base = item.b.replace('{ay}', ay);
  // Ton yalnızca kapanış cümlesini değiştirir: Dengeli ikisini de, diğerleri kendi cümlesini söyler.
  const closer = tone === 'Destekleyici' ? item.s : tone === 'Sert' ? item.x : `${item.s} ${item.x}`;
  const body = tone === 'Dengeli' ? base : `${base} ${closer}`;
  const long = [base, closer];
  if (tr.moon.house !== null && tr.sun.house !== null) {
    long.push(
      `Ay bugün haritanın ${tr.moon.house}. evinden geçiyor, bu yüzden ${HOUSE_THEME[tr.moon.house - 1]} daha çok gündeminde olabilir. Güneş ise ${tr.sun.house}. evinde ve ${HOUSE_THEME[tr.sun.house - 1]} alanını aydınlatıyor.`,
    );
  } else {
    long.push(`Ay bugün ${ay} ilerliyor, Güneş ise ${BURC_DA[tr.sun.sign]}.`);
  }
  if (tr.aspects[0]) long.push(aspectSentence(tr.aspects[0]));

  return { h: item.h, body, dos, donts, long, deep };
}
