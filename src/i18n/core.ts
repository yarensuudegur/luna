import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from './lang';
import { resources } from './resources';

/** i18next'i bir kez başlatır. Yerel modül gerektirmediği için testlerde de çalışır. */
export function setupI18n(lng: Lang): void {
  if (i18n.isInitialized) return;
  void i18n.use(initReactI18next).init({
    resources: { tr: { translation: resources.tr }, en: { translation: resources.en } },
    lng,
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
    returnNull: false,
    initAsync: false,
  });
}

export const t = ((...args: Parameters<typeof i18n.t>) => i18n.t(...args)) as typeof i18n.t;

export { i18n };
