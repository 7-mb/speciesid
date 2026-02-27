import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_LANGUAGE, translate, type Language, type TranslationKey } from '../i18n/translations';

const STORAGE_KEY = 'speciesid.language';

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string): value is Language {
  return value === 'de' || value === 'fr' || value === 'it' || value === 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled || !stored) {
          return;
        }
        if (isLanguage(stored)) {
          setLanguage(stored);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguagePersisted = useCallback((next: Language) => {
    setLanguage(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage: setLanguagePersisted, t }), [language, setLanguagePersisted, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return value;
}

export type { Language };
