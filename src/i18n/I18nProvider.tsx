import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import Storage from 'expo-sqlite/kv-store';
import {
  deviceLanguageCode, isLanguagePreference, localeTagFor, resolveLocale, translate,
} from './index';
import type {
  AppLocale, LanguagePreference, LocaleTag, TranslateParams, TranslationKey,
} from './types';

/**
 * Deliberately not in the items database: wiping the user's items from
 * Settings must not silently reset their language back to Automatic.
 */
const PREFERENCE_KEY = 'depo.languagePreference';

/** Handy for helpers that render copy but sit outside a component body. */
export type TranslateFn = (key: TranslationKey, params?: TranslateParams) => string;

type I18nValue = {
  locale: AppLocale;
  localeTag: LocaleTag;
  languagePreference: LanguagePreference;
  /** True until the stored preference has been read back from disk. */
  preferenceLoaded: boolean;
  setLanguagePreference: (next: LanguagePreference) => void;
  t: TranslateFn;
};

const I18nCtx = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Device detection is synchronous, so the very first render is already in
  // the right language — no flash of English on a Turkish phone, and the
  // first-launch seed data gets the correct locale.
  const [preference, setPreference] = useState<LanguagePreference>('auto');
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  const [deviceCode] = useState(deviceLanguageCode);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await Storage.getItem(PREFERENCE_KEY);
        // Anything unreadable or unrecognised falls back to 'auto' rather
        // than trapping the user in a language they never chose.
        if (!cancelled && isLanguagePreference(stored)) setPreference(stored);
      } catch (err) {
        if (__DEV__) console.warn('[i18n] could not read language preference', err);
      } finally {
        if (!cancelled) setPreferenceLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const locale = resolveLocale(preference, deviceCode);

  // Applied to state first so the UI switches on the same frame; the write is
  // best-effort and a failure only costs the preference on next launch.
  const setLanguagePreference = useCallback((next: LanguagePreference) => {
    setPreference(next);
    Storage.setItem(PREFERENCE_KEY, next).catch((err) => {
      if (__DEV__) console.warn('[i18n] could not persist language preference', err);
    });
  }, []);

  // Stable per locale: consumers can safely list `t` in dependency arrays
  // without re-creating callbacks on every render.
  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo<I18nValue>(() => ({
    locale,
    localeTag: localeTagFor(locale),
    languagePreference: preference,
    preferenceLoaded,
    setLanguagePreference,
    t,
  }), [locale, preference, preferenceLoaded, setLanguagePreference, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
