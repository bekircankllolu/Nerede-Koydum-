import type { tr } from './translations/tr';

/** The two locales the app actually renders in. English is the global fallback. */
export type AppLocale = 'tr' | 'en';

/** What the user picks in Settings. 'auto' follows the device. */
export type LanguagePreference = 'auto' | AppLocale;

/** BCP-47 tags used for Intl formatting and speech recognition. */
export type LocaleTag = 'tr-TR' | 'en-US';

/**
 * A count-sensitive entry. Turkish has no plural suffix in these phrases, so
 * both forms are simply the same string there — keeping the shape identical
 * across locales is what lets TypeScript enforce parity.
 */
export type PluralEntry = { one: string; other: string };

/**
 * Turkish is the canonical shape: every other locale file is declared as
 * `TranslationTree`, so a missing or misspelled key is a compile error rather
 * than a string that silently ships as a raw key.
 */
export type TranslationTree = typeof tr;

type Join<K, P> = K extends string
  ? P extends string
    ? P extends ''
      ? K
      : `${K}.${P}`
    : never
  : never;

// Plural entries are leaves, not branches — `t('time.minutes', { count })`
// resolves the one/other pair itself.
type Leaves<T> = T extends string
  ? ''
  : T extends PluralEntry
    ? ''
    : { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T];

/** Every valid dotted key, derived from the Turkish tree. */
export type TranslationKey = Leaves<TranslationTree>;

export type TranslateParams = Record<string, string | number>;
