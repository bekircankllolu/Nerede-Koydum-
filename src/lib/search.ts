// Ported verbatim (logic-wise) from Koydum.dc.html's Turkish search/normalization.
import type { Item } from '../db';
import { isUnknownLocation } from './location';
import { translate, localeTagFor, type AppLocale } from '../i18n';

// Conversational filler, stripped from the *query* only — never from stored
// item text. Both language lists are applied at once on purpose: someone can
// run the UI in English and still search for an item they saved in Turkish.
const STOP_TR = [
  'nerede', 'neredeydi', 'nereye', 'nereye koydum', 'koydum', 'koymuştum',
  'bul', 'bulabilir', 'misin', 'göster', 'bana', 'benim', 'acaba', 'var', 'bir', 'şey',
];

// 's' and 't' only ever appear as tokens because normalization splits
// contractions ("where's" -> "where s", "don't" -> "don t"); left in, they
// would count as unmatched tokens and disqualify every item.
const STOP_EN = [
  'where', 'wheres', 'what', 'whats', 'which', 'did', 'do', 'does', 'is', 'are', 'was',
  'i', 'im', 'my', 'mine', 'me', 'you', 'your', 'the', 'a', 'an', 'of', 'to', 'in', 'on',
  'at', 'it', 'its', 'put', 'find', 'finding', 'locate', 'search', 'show', 'get', 'got',
  'look', 'looking', 'for', 'can', 'could', 'please', 'help', 'again', 'thing', 'stuff',
  's', 't',
];

const STOP = [...STOP_TR, ...STOP_EN];

function deacc(s: string): string {
  return s
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/â/g, 'a');
}

export function norm(s: string | null | undefined): string {
  return deacc((s || '').toLocaleLowerCase('tr'))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clean(s: string | null | undefined): string {
  const normalized = norm(s);
  const words = normalized.split(' ').filter((w) => w && STOP.indexOf(w) < 0);
  // If filler removal ate the whole query, search the raw words instead.
  // This only affects queries that would otherwise return nothing at all, so
  // no ranking behaviour changes — it just stops a real item whose name
  // collides with a stop word (Turkish "iş" normalizes to "is") from becoming
  // unreachable now that two languages' filler lists are active.
  if (!words.length) return normalized;
  return words.join(' ');
}

// Bounded edit distance: gives up as soon as the distance exceeds `max`, so
// a typo like "pasaprot" still finds "pasaport" without letting genuinely
// unrelated words score at all.
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return false;
    const tmp = prev; prev = curr; curr = tmp;
  }
  return prev[b.length] <= max;
}

/** How much of a typo we forgive, scaled to word length. */
function typoBudget(word: string): number {
  if (word.length >= 7) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

function fuzzyHit(token: string, haystackWords: string[]): boolean {
  const budget = typoBudget(token);
  if (!budget) return false;
  return haystackWords.some((w) => withinEditDistance(token, w, budget));
}

/**
 * Scores one item against a cleaned query.
 *
 * The name is always the strongest signal — an item called "Pasaport" must
 * outrank one that merely lives in a drawer whose name mentions it. Multi-word
 * queries are scored per token and every token has to land somewhere, so
 * "yedek anahtar" doesn't match an item that only satisfies "anahtar".
 */
export function score(it: Item, q: string, daysSince: (it: Item) => number): number {
  const n = norm(it.name);
  // "Location unknown" is a placeholder, not something the user wrote, so it
  // must not be searchable — neither the new internal token nor the legacy
  // Turkish string it replaced. Weights and thresholds below are unchanged.
  const loc = isUnknownLocation(it.loc) ? '' : norm(it.loc);
  const note = norm(it.note);

  // Whole-query matches on the name are the highest-confidence signals.
  let s = 0;
  if (n === q) s = 100;
  else if (n.indexOf(q) === 0) s = 88;
  else if (n.indexOf(q) > -1) s = 76;

  if (!s) {
    const tokens = q.split(' ').filter(Boolean);
    const nameWords = n.split(' ').filter(Boolean);
    const locWords = loc.split(' ').filter(Boolean);
    const noteWords = note.split(' ').filter(Boolean);

    let total = 0;
    for (const t of tokens) {
      // Best available evidence for this token, name first.
      let best = 0;
      if (nameWords.some((w) => w === t)) best = 70;
      else if (nameWords.some((w) => w.startsWith(t))) best = 62;
      else if (n.indexOf(t) > -1) best = 54;
      else if (fuzzyHit(t, nameWords)) best = 46;
      else if (locWords.some((w) => w === t)) best = 34;
      else if (loc.indexOf(t) > -1) best = 30;
      else if (noteWords.some((w) => w === t)) best = 26;
      else if (note.indexOf(t) > -1) best = 22;
      else if (fuzzyHit(t, locWords) || fuzzyHit(t, noteWords)) best = 16;

      // A single unmatched token disqualifies the item — this is what keeps
      // unrelated rows from floating up on multi-word queries.
      if (!best) return 0;
      total += best;
    }
    s = total / tokens.length;
  }

  if (s && daysSince(it) < 7) s += 5;
  return s;
}

export function search(items: Item[], rawQuery: string, daysSince: (it: Item) => number): Item[] {
  const q = clean(rawQuery);
  if (!q) return [];
  return items
    .map((it) => ({ it, s: score(it, q, daysSince) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.it);
}

export function splitLoc(loc: string): string[] {
  return loc.split(' / ').filter(Boolean);
}

export function shortLoc(loc: string): string {
  return splitLoc(loc).slice(-2).join(' · ');
}

export function fullLoc(loc: string): string {
  return splitLoc(loc).join(' · ');
}

// Casing defaults to Turkish so every pre-existing call keeps its exact
// behaviour; screens that know the active locale pass it in, which is what
// stops an English "island box" from being title-cased to "İsland box".
export function initialOf(name: string, locale: AppLocale = 'tr'): string {
  return (name.charAt(0) || '?').toLocaleUpperCase(localeTagFor(locale));
}

/** "8 Ağustos" / "August 8", optionally carrying the year. */
export function formatMonthDay(ts: number, locale: AppLocale, withYear = false): string {
  const options: Intl.DateTimeFormatOptions = withYear
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'long' };
  return new Date(ts).toLocaleDateString(localeTagFor(locale), options);
}

export function formatWhen(ts: number, locale: AppLocale): string {
  return formatMonthDay(ts, locale);
}

/** Short numeric date, used by the CSV export. */
export function formatShortDate(ts: number, locale: AppLocale): string {
  return new Date(ts).toLocaleDateString(localeTagFor(locale));
}

export function daysBetween(fromTs: number, toTs: number): number {
  return Math.floor((toTs - fromTs) / 86400000);
}

// Same thresholds as before; only the strings moved into the translation
// layer, where English gets real singular/plural forms.
export function formatAgo(ts: number, now: number = Date.now(), locale: AppLocale = 'tr'): string {
  const diffMs = Math.max(0, now - ts);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return translate(locale, 'time.justNow');
  if (minutes < 60) return translate(locale, 'time.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(locale, 'time.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(locale, 'time.days', { count: days });
  const weeks = Math.floor(days / 7);
  if (days < 30) return translate(locale, 'time.weeks', { count: weeks });
  const months = Math.floor(days / 30);
  if (days < 365) return translate(locale, 'time.months', { count: months });
  const years = Math.floor(days / 365);
  return translate(locale, 'time.years', { count: years });
}

export function titleCaseFirst(s: string, locale: AppLocale = 'tr'): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase(localeTagFor(locale)) + s.slice(1);
}

// Splits free-typed location text on '/', ',' or '>' the way the prototype's
// move sheet and add-item flows do, producing a normalized breadcrumb string.
export function normalizeLocInput(raw: string, locale: AppLocale = 'tr'): string {
  return raw
    .split(/[/,>]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => (i === 0 ? titleCaseFirst(s, locale) : s))
    .join(' / ');
}

export function lastSegment(loc: string): string {
  const parts = splitLoc(loc);
  return parts[parts.length - 1] || loc;
}
