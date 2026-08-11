import type { Item } from '../db';
import { isUnknownLocation } from './location';
import { formatShortDate } from './search';
import { translate, type AppLocale } from '../i18n';

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Only the column labels, the yes/no values and the date presentation are
// localized. Escaping, quoting, the delimiter and the row order are
// deliberately untouched.
export function itemsToCsv(items: Item[], locale: AppLocale): string {
  const header = [
    translate(locale, 'csv.name'),
    translate(locale, 'csv.location'),
    translate(locale, 'csv.note'),
    translate(locale, 'csv.favorite'),
    translate(locale, 'csv.lastUpdated'),
  ];
  const yes = translate(locale, 'csv.yes');
  const no = translate(locale, 'csv.no');
  const unknown = translate(locale, 'common.unknownLocation');

  const rows = items.map((it) => [
    it.name,
    // The internal placeholder must never reach the exported file.
    isUnknownLocation(it.loc) ? unknown : it.loc,
    it.note,
    it.fav ? yes : no,
    formatShortDate(it.updatedAt, locale),
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\n');
}
