import en from './en.json';
import tr from './tr.json';
import type { Lang } from './lang';

export const resources = { tr, en } as const;

/** Bir dilin sözlüğü; hook kullanmayan saf kod (günlük yorum, şişe özeti) buradan okur. */
export function dict(lang: Lang) {
  return resources[lang];
}
