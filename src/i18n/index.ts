import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageSetting } from '../storage';
import en from './en.json';
import lv from './lv.json';

export const SUPPORTED = ['en', 'lv'] as const;
export type AppLanguage = (typeof SUPPORTED)[number];

const resources = {
  en: { translation: en },
  lv: { translation: lv },
} as const;

/** Map the user's setting to an actual language code, resolving 'system'. */
export function resolveLanguage(setting: LanguageSetting): AppLanguage {
  if (setting === 'en' || setting === 'lv') return setting;
  const device = getLocales()?.[0]?.languageCode?.toLowerCase();
  return device === 'lv' ? 'lv' : 'en';
}

let started = false;

export function initI18n(setting: LanguageSetting): typeof i18n {
  if (!started) {
    started = true;
    void i18n.use(initReactI18next).init({
      resources,
      lng: resolveLanguage(setting),
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  } else {
    applyLanguage(setting);
  }
  return i18n;
}

export function applyLanguage(setting: LanguageSetting): void {
  const lng = resolveLanguage(setting);
  if (i18n.language !== lng) void i18n.changeLanguage(lng);
}

export default i18n;
