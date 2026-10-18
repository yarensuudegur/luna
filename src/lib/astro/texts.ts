import { t } from '@/i18n/core';
import type { PlanetKey } from './chart';

/** Gezegen kartının metni: gezegenin rolü, burcu ve burcun kattığı ton. */
export function planetText(key: PlanetKey, sign: number): string {
  return t('planetCards.template', {
    role: t(`planetCards.roles.${key}`),
    sign: t(`signs.names.${sign}`),
    name: t(`planetCards.names.${key}`),
    tone: t(`signs.tones.${sign}`),
  });
}

export function ascText(sign: number): string {
  return t('planetCards.asc', { sign: t(`signs.names.${sign}`), tone: t(`signs.tones.${sign}`) });
}
