import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { tr } from './translations/tr';
import { en } from './translations/en';
import type {
  AppLocale, LanguagePreference, LocaleTag, TranslateParams, TranslationKey,
} from './types';

export type { AppLocale, LanguagePreference, LocaleTag, TranslationKey, TranslateParams };

export const APP_LOCALES: AppLocale[] = ['tr', 'en'];

/** Everything that isn't Turkish falls back to English. */
export const FALLBACK_LOCALE: AppLocale = 'en';

const LOCALE_TAGS: Record<AppLocale, LocaleTag> = {
  tr: 'tr-TR',
  en: 'en-US',
};

const i18n = new I18n({ tr, en });
i18n.defaultLocale = FALLBACK_LOCALE;
i18n.enableFallback = true;

/**
 * Locale-agnostic lookup. Kept separate from the React hook on purpose: pure
 * modules (search, CSV, date formatting) take a locale argument instead of
 * reaching for context they can't see.
 */
export function translate(locale: AppLocale, key: TranslationKey, params?: TranslateParams): string {
  return i18n.t(key, { locale, ...params });
}

export function localeTagFor(locale: AppLocale): LocaleTag {
  return LOCALE_TAGS[locale];
}

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'tr' || value === 'en';
}

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'auto' || isAppLocale(value);
}

/**
 * The device's primary language code, lowercased ('tr', 'en', 'de', …).
 * Returns null if the platform gives us nothing usable.
 */
export function deviceLanguageCode(): string | null {
  try {
    const code = getLocales()[0]?.languageCode;
    return code ? code.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Turkish device -> Turkish. Everything else -> English, which is why adding
 * a third language later only means adding a translations file and one entry
 * to APP_LOCALES rather than touching call sites.
 */
export function resolveLocale(
  preference: LanguagePreference,
  deviceCode: string | null = deviceLanguageCode()
): AppLocale {
  if (isAppLocale(preference)) return preference;
  return deviceCode && isAppLocale(deviceCode) ? deviceCode : FALLBACK_LOCALE;
}
