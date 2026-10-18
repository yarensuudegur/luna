import i18next from 'i18next';

export type Lang = 'tr' | 'en';
export const LANGS: readonly Lang[] = ['tr', 'en'];

/** Seçili dil; i18next henüz başlamadıysa (testler) Türkçe. */
export function currentLang(): Lang {
  return i18next.language === 'en' ? 'en' : 'tr';
}

/** `toLocaleUpperCase` / `toLocaleLowerCase` için dil: İ ve ı yalnızca Türkçede dönüşür. */
export const locale = currentLang;

/** Dile göre ondalık ayracı: "6,5" / "6.5". */
export function decimal(n: number, digits = 1): string {
  const s = n.toFixed(digits);
  return currentLang() === 'tr' ? s.replace('.', ',') : s;
}
