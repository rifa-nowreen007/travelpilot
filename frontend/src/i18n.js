import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/common.json';
import hi from './locales/hi/common.json';
import ta from './locales/ta/common.json';
import te from './locales/te/common.json';
import ml from './locales/ml/common.json';
import kn from './locales/kn/common.json';

// Add more languages here as you translate them — just drop a new
// locales/<code>/common.json file and register it below plus in
// LanguageSwitcher.jsx's LANGUAGES list.
i18n
  .use(LanguageDetector) // auto-detects from localStorage / browser, in that order
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      hi: { common: hi },
      ta: { common: ta },
      te: { common: te },
      ml: { common: ml },
      kn: { common: kn },
    },
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }, // React already escapes output
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tp-lang',
    },
  });

export default i18n;
