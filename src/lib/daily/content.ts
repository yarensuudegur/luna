import type { Lang } from '@/i18n/lang';
import { dict } from '@/i18n/resources';
import type { PlanetKey } from '@/lib/astro';

/** Günlük metinlerin dilden bağımsız tarafı: hangi transitler ve evler metni öne çıkarır. Sıra, sözlükteki `daily` ile aynı. */
export type DailyMeta = {
  /** Metnin konuştuğu transit gezegenler; seçimde bu gezegenlerin açıları ağırlık kazanır. */
  planets: readonly PlanetKey[];
  /** Ay bu evlerden geçerken de metin öne çıkar. */
  houses?: readonly number[];
};

export const DAILY_META: readonly DailyMeta[] = [
  { planets: ['Ay'] },
  { planets: ['Merkür'] },
  { planets: ['Ay'], houses: [4, 6] },
  { planets: ['Jüpiter'], houses: [11] },
  { planets: ['Mars'] },
  { planets: ['Satürn'], houses: [7] },
  { planets: ['Ay', 'Neptün'], houses: [12] },
  { planets: ['Venüs'] },
];

export type DailyText = {
  /** Başlık. */
  h: string;
  /** Metin; {{ay}} yerine Ay'ın bulunduğu burç gelir. */
  b: string;
  /** Destekleyici kapanış cümlesi. */
  s: string;
  /** Sert kapanış cümlesi. */
  x: string;
};

/** Durum sırası her yerde: 0 şans/güç, 1 baskı, 2 zorluk, 3 akış. */
export type LuckState = 0 | 1 | 2 | 3;

/** İç anahtarlar Türkçe kalır (veritabanı ve mantık bunlara dayanır); görünen ad sözlükten gelir. */
export const DEEP_CATEGORIES = ['Ev & aile', 'Arkadaşlar', 'İş & para', 'Aşk', 'Düşünce', 'Ruhsal'] as const;
export type DeepCategory = (typeof DEEP_CATEGORIES)[number];

/** Bugün ekranındaki şans bölümlerinin sırası. */
export const LUCK_ORDER = ['Ev & aile', 'Arkadaşlar', 'İş & para', 'Aşk'] as const;
export type LuckCategory = (typeof LUCK_ORDER)[number];

/** [numara, ad, düz anlam, ters anlam, öneri] */
export type TarotCard = readonly [string, string, string, string, string];

/** 22 büyük arkana + 56 küçük arkana (Asalar, Kupalar, Kılıçlar, Tılsımlar; As'tan Papaz'a). */
export const TAROT_COUNT = 78;

type Four = readonly [string, string, string, string];

export type Content = {
  daily: readonly DailyText[];
  dos: readonly string[];
  donts: readonly string[];
  deep: Record<DeepCategory, Four>;
  luckText: Record<LuckCategory, Four>;
  houseTheme: readonly string[];
  tarot: readonly TarotCard[];
};

/** Bir dilin yorum, tarot ve ipucu metinleri. */
export function contentFor(lang: Lang): Content {
  const d = dict(lang);
  return {
    daily: d.daily,
    dos: d.dos,
    donts: d.donts,
    deep: d.deepText as unknown as Record<DeepCategory, Four>,
    luckText: d.luck.text as unknown as Record<LuckCategory, Four>,
    houseTheme: d.houseTheme,
    tarot: d.tarot as unknown as readonly TarotCard[],
  };
}
