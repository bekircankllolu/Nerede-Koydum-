// Ported verbatim (logic-wise) from Koydum.dc.html's Turkish search/normalization.
import type { Item } from '../db';

const STOP = [
  'nerede', 'neredeydi', 'nereye', 'nereye koydum', 'koydum', 'koymuştum',
  'bul', 'bulabilir', 'misin', 'göster', 'bana', 'benim', 'acaba', 'var', 'bir', 'şey',
];

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
  const words = norm(s).split(' ').filter((w) => w && STOP.indexOf(w) < 0);
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
  const loc = norm(it.loc);
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

export function initialOf(name: string): string {
  return (name.charAt(0) || '?').toLocaleUpperCase('tr');
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function formatWhen(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
}

export function daysBetween(fromTs: number, toTs: number): number {
  return Math.floor((toTs - fromTs) / 86400000);
}

export function formatAgo(ts: number, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - ts);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} hafta önce`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months} ay önce`;
  const years = Math.floor(days / 365);
  return `${years} yıl önce`;
}

export function titleCaseFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
}

// Splits free-typed location text on '/', ',' or '>' the way the prototype's
// move sheet and add-item flows do, producing a normalized breadcrumb string.
export function normalizeLocInput(raw: string): string {
  return raw
    .split(/[/,>]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => (i === 0 ? titleCaseFirst(s) : s))
    .join(' / ');
}

export function lastSegment(loc: string): string {
  const parts = splitLoc(loc);
  return parts[parts.length - 1] || loc;
}
