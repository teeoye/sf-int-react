'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Locale } from '@/lib/i18n';
import { translations } from '@/lib/i18n';

const STORAGE_KEY = 'app-locale';

function getStoredLocale(): Locale {
  if (globalThis.window === undefined) return 'en';
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'en';
}

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: keyof (typeof translations)['en']) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: keyof (typeof translations)['en']) => translations[locale][key] ?? key,
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {mounted && (
        <SyncHtmlLang
          lang={locale === 'ar' ? 'ar' : 'en'}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        />
      )}
      {children}
    </LanguageContext.Provider>
  );
}

function SyncHtmlLang({ lang, dir }: Readonly<{ lang: string; dir: 'rtl' | 'ltr' }>) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
  return null;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
