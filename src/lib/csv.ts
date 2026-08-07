import type { Item } from '../db';

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function itemsToCsv(items: Item[]): string {
  const header = ['Ad', 'Konum', 'Not', 'Favori', 'Son güncelleme'];
  const rows = items.map((it) => [
    it.name,
    it.loc,
    it.note,
    it.fav ? 'Evet' : 'Hayır',
    new Date(it.updatedAt).toLocaleDateString('tr-TR'),
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\n');
}
