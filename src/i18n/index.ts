import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { i18n, setupI18n, t } from './core';
import type { Lang } from './lang';

const KEY = 'luna.language.v1';

/** Telefon dili İngilizceyse İngilizce, değilse Türkçe. */
export function deviceLang(): Lang {
  return Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'tr';
}

setupI18n(deviceLang());

/** Kaydedilmiş dil seçimini uygular; yoksa telefon dili kalır. */
export async function loadLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if ((stored === 'tr' || stored === 'en') && stored !== i18n.language) await i18n.changeLanguage(stored);
  } catch {
    // okunamazsa telefon dili geçerli
  }
}

export async function setLanguage(lang: Lang): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(KEY, lang).catch(() => {});
}

export { i18n, t };
export { currentLang, decimal, locale } from './lang';
export type { Lang } from './lang';

/** Seçili dil; dil değişince bileşeni yeniden çizer. */
export function useLang(): Lang {
  const { i18n: instance } = useTranslation();
  return instance.language === 'en' ? 'en' : 'tr';
}

export { useTranslation };
