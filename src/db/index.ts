import * as SQLite from 'expo-sqlite';
import { normalizeLocInput, lastSegment } from '../lib/search';
import { DEFAULT_ITEM_COLOR, type ItemColorKey, isItemColorKey } from '../lib/colors';

export type HistoryEntry = {
  where: string;
  at: number; // ms epoch
};

export type ItemStatus = 'stored' | 'lost';

export type Item = {
  id: string;
  name: string;
  loc: string; // breadcrumb joined by ' / '
  note: string;
  fav: boolean;
  photoUri: string | null;
  colorKey: ItemColorKey;
  status: ItemStatus;
  lostAt: number | null;
  createdAt: number;
  updatedAt: number; // last time the location was set or confirmed
  history: HistoryEntry[]; // newest first
};

export const UNKNOWN_LOCATION = 'Konum bilinmiyor';

const DB_NAME = 'depo.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  ddl: string
): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      loc TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      fav INTEGER NOT NULL DEFAULT 0,
      photo_uri TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS item_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      where_text TEXT NOT NULL,
      at INTEGER NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Older installs may not have these columns yet — add them without
  // touching existing rows (they land on the DEFAULT for each column).
  await ensureColumn(db, 'items', 'color_key', "color_key TEXT NOT NULL DEFAULT 'indigo'");
  await ensureColumn(db, 'items', 'status', "status TEXT NOT NULL DEFAULT 'stored'");
  await ensureColumn(db, 'items', 'lost_at', 'lost_at INTEGER');
}

// Demo data matching the design's SEED, translated into real timestamps
// relative to "now" so ago-labels and history stay internally consistent.
async function seedIfEmpty(db: SQLite.SQLiteDatabase) {
  const seeded = await getMetaDb(db, 'seeded');
  if (seeded) return;

  const now = Date.now();
  const DAY = 86400000;
  type SeedDef = {
    name: string; loc: string; note: string; fav: boolean; hasPhoto: boolean;
    daysAgo: number; history: Array<{ where: string; daysAgo: number }>;
  };
  const seeds: SeedDef[] = [
    { name: 'Pasaport', loc: 'Yatak odası / Beyaz dolap / Üst çekmece', note: 'Pasaportla birlikte eski vizeler de burada.', fav: true, hasPhoto: true, daysAgo: 3,
      history: [{ where: 'Üst çekmece', daysAgo: 3 }, { where: 'Çalışma masası', daysAgo: 87 }, { where: 'Mavi valiz', daysAgo: 208 }] },
    { name: 'Matkap', loc: 'Balkon / Alet dolabı / Alt raf', note: 'Şarj adaptörü aynı çantada.', fav: false, hasPhoto: true, daysAgo: 7,
      history: [{ where: 'Alet dolabı', daysAgo: 7 }, { where: 'Bodrum rafı', daysAgo: 100 }] },
    { name: 'Kışlık montlar', loc: 'Yatak odası / Gardırop / Üst raf', note: '', fav: false, hasPhoto: false, daysAgo: 14,
      history: [{ where: 'Gardırop üst raf', daysAgo: 14 }, { where: 'Mavi valiz', daysAgo: 140 }] },
    { name: 'Yedek anahtar', loc: 'Salon / TV ünitesi / Sol dolap', note: 'Ev ve bodrum anahtarı birlikte.', fav: true, hasPhoto: false, daysAgo: 21,
      history: [{ where: 'TV ünitesi sol dolap', daysAgo: 21 }] },
    { name: 'Şarj aleti', loc: 'Çalışma odası / Masa çekmecesi', note: '', fav: false, hasPhoto: true, daysAgo: 32,
      history: [{ where: 'Masa çekmecesi', daysAgo: 32 }, { where: 'Salon sehpası', daysAgo: 44 }] },
    { name: 'Eski pasaport', loc: 'Salon / TV ünitesi / Sol dolap', note: '', fav: false, hasPhoto: false, daysAgo: 60,
      history: [{ where: 'TV ünitesi sol dolap', daysAgo: 60 }] },
    { name: "Cemre'nin pasaportu", loc: 'Yatak odası / Komodin / Alt çekmece', note: '', fav: false, hasPhoto: true, daysAgo: 64,
      history: [{ where: 'Komodin alt çekmece', daysAgo: 64 }] },
  ];

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const id = `seed_${i + 1}`;
      const updatedAt = now - s.daysAgo * DAY;
      await db.runAsync(
        `INSERT INTO items (id, name, loc, note, fav, photo_uri, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id, s.name, s.loc, s.note, s.fav ? 1 : 0, s.hasPhoto ? 'seed://placeholder' : null, updatedAt, updatedAt
      );
      for (const h of s.history) {
        await db.runAsync(
          `INSERT INTO item_history (item_id, where_text, at) VALUES (?, ?, ?)`,
          id, h.where, now - h.daysAgo * DAY
        );
      }
    }
  });

  await setMetaDb(db, 'seeded', '1');
}

async function getMetaDb(db: SQLite.SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', key);
  return row ? row.value : null;
}

async function setMetaDb(db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, value
  );
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  return getMetaDb(db, key);
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  return setMetaDb(db, key, value);
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await migrate(db);
  await seedIfEmpty(db);
}

type ItemRow = {
  id: string; name: string; loc: string; note: string; fav: number;
  photo_uri: string | null; color_key: string; status: string; lost_at: number | null;
  created_at: number; updated_at: number;
};
type HistoryRow = { item_id: string; where_text: string; at: number };

function rowToItem(r: ItemRow, history: HistoryEntry[]): Item {
  return {
    id: r.id,
    name: r.name,
    loc: r.loc,
    note: r.note,
    fav: !!r.fav,
    photoUri: r.photo_uri,
    colorKey: isItemColorKey(r.color_key) ? r.color_key : DEFAULT_ITEM_COLOR,
    status: r.status === 'lost' ? 'lost' : 'stored',
    lostAt: r.lost_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    history,
  };
}

export async function listItems(): Promise<Item[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY updated_at DESC');
  const historyRows = await db.getAllAsync<HistoryRow>('SELECT * FROM item_history ORDER BY at DESC');
  const historyByItem = new Map<string, HistoryEntry[]>();
  for (const h of historyRows) {
    const list = historyByItem.get(h.item_id) || [];
    list.push({ where: h.where_text, at: h.at });
    historyByItem.set(h.item_id, list);
  }
  return rows.map((r) => rowToItem(r, historyByItem.get(r.id) || []));
}

export type NewItemInput = {
  name: string;
  loc: string;
  note: string;
  photoUri: string | null;
  colorKey?: ItemColorKey;
};

async function insertItem(input: NewItemInput & { status: ItemStatus }): Promise<Item> {
  const db = await getDb();
  const now = Date.now();
  const id = `n${now}${Math.floor(Math.random() * 1000)}`;
  const loc = normalizeLocInput(input.loc) || input.loc.trim() || UNKNOWN_LOCATION;
  const colorKey = input.colorKey || DEFAULT_ITEM_COLOR;
  const lostAt = input.status === 'lost' ? now : null;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO items (id, name, loc, note, fav, photo_uri, color_key, status, lost_at, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)',
      id, input.name.trim(), loc, input.note.trim(), input.photoUri, colorKey, input.status, lostAt, now, now
    );
    await db.runAsync(
      'INSERT INTO item_history (item_id, where_text, at) VALUES (?, ?, ?)',
      id, lastSegment(loc), now
    );
  });
  return {
    id, name: input.name.trim(), loc, note: input.note.trim(), fav: false,
    photoUri: input.photoUri, colorKey, status: input.status, lostAt,
    createdAt: now, updatedAt: now,
    history: [{ where: lastSegment(loc), at: now }],
  };
}

export async function createItem(input: NewItemInput): Promise<Item> {
  return insertItem({ ...input, status: 'stored' });
}

export async function createLostItem(input: NewItemInput): Promise<Item> {
  return insertItem({ ...input, status: 'lost' });
}

export async function moveItem(id: string, rawLoc: string): Promise<{ loc: string; at: number }> {
  const db = await getDb();
  const now = Date.now();
  const loc = normalizeLocInput(rawLoc) || rawLoc.trim();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE items SET loc = ?, updated_at = ? WHERE id = ?', loc, now, id);
    await db.runAsync('INSERT INTO item_history (item_id, where_text, at) VALUES (?, ?, ?)', id, lastSegment(loc), now);
  });
  return { loc, at: now };
}

export async function confirmItem(id: string): Promise<number> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync('UPDATE items SET updated_at = ? WHERE id = ?', now, id);
  return now;
}

export async function toggleFavorite(id: string, fav: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE items SET fav = ? WHERE id = ?', fav ? 1 : 0, id);
}

export type UpdateItemDetailsInput = {
  name: string;
  note: string;
  photoUri: string | null;
  colorKey: ItemColorKey;
};

// Pure detail edit (name/note/photo/color) — deliberately does not touch
// loc/updated_at/history, since that timeline means "location confirmed at".
export async function updateItemDetails(id: string, input: UpdateItemDetailsInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE items SET name = ?, note = ?, photo_uri = ?, color_key = ? WHERE id = ?',
    input.name.trim(), input.note.trim(), input.photoUri, input.colorKey, id
  );
}

export async function markItemLost(id: string): Promise<number> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync('UPDATE items SET status = ?, lost_at = ?, updated_at = ? WHERE id = ?', 'lost', now, now, id);
  return now;
}

// newLoc omitted/blank -> stays at its last-known location, just flips back to stored.
export async function markItemFound(id: string, newLoc?: string): Promise<{ loc: string | null }> {
  const db = await getDb();
  const now = Date.now();
  if (newLoc && newLoc.trim()) {
    const loc = normalizeLocInput(newLoc) || newLoc.trim();
    await db.withTransactionAsync(async () => {
      await db.runAsync('UPDATE items SET loc = ?, status = ?, lost_at = NULL, updated_at = ? WHERE id = ?', loc, 'stored', now, id);
      await db.runAsync('INSERT INTO item_history (item_id, where_text, at) VALUES (?, ?, ?)', id, lastSegment(loc), now);
    });
    return { loc };
  }
  await db.runAsync('UPDATE items SET status = ?, lost_at = NULL, updated_at = ? WHERE id = ?', 'stored', now, id);
  return { loc: null };
}

export async function deleteItemDb(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM item_history WHERE item_id = ?', id);
    await db.runAsync('DELETE FROM items WHERE id = ?', id);
  });
}

export async function deleteAllItems(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM item_history');
    await db.runAsync('DELETE FROM items');
  });
}
