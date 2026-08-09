// Controlled 8-color item palette. Items store a colorKey (not a raw hex) so
// the actual colors can be retuned later without touching stored data.
export type ItemColorKey =
  | 'indigo' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'pink' | 'teal';

type ColorDef = { strong: string; soft: string };

export const ITEM_COLORS: Record<ItemColorKey, ColorDef> = {
  indigo: { strong: '#5556D9', soft: '#EEEEFF' },
  green: { strong: '#2D7A59', soft: '#E4F3EC' },
  blue: { strong: '#2F6FE4', soft: '#E7EEFC' },
  orange: { strong: '#D9822B', soft: '#FBEEDD' },
  red: { strong: '#C0392B', soft: '#FBE7E4' },
  purple: { strong: '#8A4FD1', soft: '#F1E7FB' },
  pink: { strong: '#D14F94', soft: '#FBE7F1' },
  teal: { strong: '#1F9E96', soft: '#DFF4F2' },
};

export const ITEM_COLOR_ORDER: ItemColorKey[] = [
  'indigo', 'green', 'blue', 'orange', 'red', 'purple', 'pink', 'teal',
];

export const DEFAULT_ITEM_COLOR: ItemColorKey = 'indigo';

export function isItemColorKey(v: string): v is ItemColorKey {
  return Object.prototype.hasOwnProperty.call(ITEM_COLORS, v);
}

export function itemColor(key: string): ColorDef {
  return ITEM_COLORS[isItemColorKey(key) ? key : DEFAULT_ITEM_COLOR];
}
