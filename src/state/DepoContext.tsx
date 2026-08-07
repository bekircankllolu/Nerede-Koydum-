import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as db from '../db';
import type { Item } from '../db';
import { search, daysBetween, formatAgo, initialOf, shortLoc, fullLoc, splitLoc, titleCaseFirst } from '../lib/search';
import { itemsToCsv } from '../lib/csv';
import { useVoiceRecognition } from '../lib/voice';
import { colors, FREE_ITEM_LIMIT } from '../theme';

export type FilterKey = 'all' | 'recent' | 'fav' | 'room' | 'nophoto';
export type VoiceTarget = 'search' | 'name' | 'loc' | 'move' | null;
export type Toast = { title: string; body: string } | null;

const FILTER_DEFS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'recent', label: 'Son eklenenler' },
  { key: 'fav', label: 'Favoriler' },
  { key: 'room', label: 'Yatak odası' },
  { key: 'nophoto', label: 'Fotoğrafsızlar' },
];

const ONB_STEPS = [
  { title: 'Bir daha evi baştan aşağı arama.', body: 'Nadiren kullandığın eşyalar hep kaybolur. Depo onları senin yerine hatırlar.', chips: ['Pasaport', 'Yedek anahtar', 'Kablolar'], cta: 'Devam' },
  { title: 'Koyarken söyle.', body: 'Fotoğrafını çek ve nereye koyduğunu kaydet. On saniyeden kısa sürer.', chips: ['Pasaport', '→', 'Yatak odası', '→', 'Üst çekmece'], cta: 'Devam' },
  { title: 'Gerektiğinde sor.', body: '"Pasaport nerede?" de, Depo sana göstersin.', chips: null as string[] | null, cta: 'İlk eşyamı kaydet' },
];

function daysSince(it: Item, now: number) {
  return daysBetween(it.updatedAt, now);
}

export function useDepoStore() {
  const [booting, setBooting] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onbStep, setOnbStep] = useState(0);

  const [screen, setScreen] = useState<'find' | 'items' | 'settings'>('find');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selId, setSelId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addLoc, setAddLoc] = useState('');
  const [addNote, setAddNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [addPhotoUri, setAddPhotoUri] = useState<string | null>(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveVal, setMoveVal] = useState('');

  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget>(null);
  const [paywall, setPaywall] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voice = useVoiceRecognition();

  useEffect(() => {
    (async () => {
      await db.initDb();
      const [loaded, hasOnboarded, proFlag] = await Promise.all([
        db.listItems(),
        db.getMeta('hasOnboarded'),
        db.getMeta('isPro'),
      ]);
      setItems(loaded);
      setShowOnboarding(!hasOnboarded);
      setIsPro(proFlag === '1');
      setBooting(false);
    })();
  }, []);

  const flash = useCallback((title: string, body: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ title, body });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Mirrors the design's nav(): switching screens/targets always collapses
  // every overlay (add/move/detail/paywall/voice) back to a clean base state.
  const nav = useCallback((patch: Partial<{
    screen: 'find' | 'items' | 'settings'; q: string; selId: string | null;
    addOpen: boolean; filter: FilterKey;
  }>) => {
    voice.reset();
    setAddOpen(false);
    setMoveOpen(false);
    setMoveVal('');
    setSelId(null);
    setPaywall(false);
    setPrivacyOpen(false);
    setHelpOpen(false);
    setVoiceTarget(null);
    if (patch.screen !== undefined) setScreen(patch.screen);
    if (patch.q !== undefined) setQ(patch.q);
    if (patch.selId !== undefined) setSelId(patch.selId);
    if (patch.addOpen !== undefined) setAddOpen(patch.addOpen);
    if (patch.filter !== undefined) setFilter(patch.filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = Date.now();
  const results = useMemo(() => search(items, q, (it) => daysSince(it, now)), [items, q, now]);

  function card(it: Item) {
    return {
      id: it.id,
      name: it.name,
      initial: initialOf(it.name),
      shortLoc: shortLoc(it.loc),
      fullLoc: fullLoc(it.loc),
      favMark: it.fav ? '★' : '',
      ago: formatAgo(it.updatedAt, now),
      open: () => setSelId(it.id),
    };
  }

  const selected = items.find((x) => x.id === selId) || null;

  function detail() {
    if (!selected) return null;
    return {
      item: selected,
      name: selected.name,
      lines: splitLoc(selected.loc),
      note: selected.note,
      confirmed: `${formatAgo(selected.updatedAt, now)} doğrulandı.`,
      history: selected.history.map((h, i) => ({
        where: h.where,
        when: new Date(h.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
        dot: i === 0 ? colors.accent : colors.photoPlaceholderBorder,
      })),
    };
  }

  async function refreshItems() {
    setItems(await db.listItems());
  }

  function openAdd() {
    setAddOpen(true);
    setAddName('');
    setAddLoc('');
    setAddNote('');
    setNoteOpen(false);
    setAddPhotoUri(null);
  }

  function closeAdd() {
    setAddOpen(false);
  }

  function createFromQuery() {
    setAddOpen(true);
    setAddName(titleCaseFirst(q));
    setAddLoc('');
    setAddNote('');
    setNoteOpen(false);
    setAddPhotoUri(null);
  }

  async function saveItem() {
    if (!addName.trim() || !addLoc.trim()) return;
    if (!isPro && items.length >= FREE_ITEM_LIMIT) {
      setPaywall(true);
      return;
    }
    const created = await db.createItem({ name: addName, loc: addLoc, note: addNote, photoUri: addPhotoUri });
    await refreshItems();
    setAddOpen(false);
    setAddName('');
    setAddLoc('');
    setAddNote('');
    setNoteOpen(false);
    setAddPhotoUri(null);
    setScreen('find');
    setQ('');
    flash('Tamam, ben hatırlarım.', `${created.name} — ${created.loc}`);
  }

  function openMove() {
    setMoveOpen(true);
    setMoveVal('');
  }
  function closeMove() {
    setMoveOpen(false);
  }
  async function saveMove() {
    if (!selId) return;
    if (!moveVal.trim()) {
      setMoveOpen(false);
      return;
    }
    await db.moveItem(selId, moveVal);
    await refreshItems();
    setMoveOpen(false);
    setMoveVal('');
    flash('Yeni yerini kaydettim.', 'Eski konum geçmişte duruyor.');
  }

  async function toggleFav() {
    if (!selected) return;
    await db.toggleFavorite(selected.id, !selected.fav);
    await refreshItems();
  }

  async function confirmLoc() {
    if (!selId) return;
    await db.confirmItem(selId);
    await refreshItems();
    flash('Yerini doğruladım.', 'Kayıt güncel olarak işaretlendi.');
  }

  async function deleteItem() {
    if (!selId) return;
    await db.deleteItemDb(selId);
    setSelId(null);
    await refreshItems();
    flash('Kayıt silindi.', 'Fotoğrafı da cihazdan kaldırıldı.');
  }

  // Row-level variants for the list swipe actions, which act on an arbitrary
  // item rather than the one currently open in the detail screen.
  async function toggleFavById(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    await db.toggleFavorite(id, !it.fav);
    await refreshItems();
    flash(it.fav ? 'Favorilerden çıkarıldı.' : 'Favorilere eklendi.', it.name);
  }

  async function deleteItemById(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    await db.deleteItemDb(id);
    if (selId === id) setSelId(null);
    await refreshItems();
    flash('Kayıt silindi.', `${it.name} — fotoğrafı da kaldırıldı.`);
  }

  function startVoice(target: Exclude<VoiceTarget, null>) {
    setVoiceTarget(target);
    voice.start();
  }

  function voiceRetry() {
    if (voice.stage === 'done' || voice.stage === 'no-speech' || voice.stage === 'error') {
      voice.start();
    } else {
      setVoiceTarget(null);
      voice.reset();
    }
  }

  function voiceUse() {
    if (voice.stage !== 'done' || !voice.transcript) return;
    const text = voice.transcript;
    if (voiceTarget === 'search') setQ(text);
    else if (voiceTarget === 'name') setAddName(text);
    else if (voiceTarget === 'loc') setAddLoc(text);
    else if (voiceTarget === 'move') setMoveVal(text);
    setVoiceTarget(null);
    voice.reset();
  }

  function onbNext() {
    if (onbStep < ONB_STEPS.length - 1) {
      setOnbStep(onbStep + 1);
    } else {
      finishOnboarding(true);
    }
  }
  function onbSkip() {
    finishOnboarding(false);
  }
  function finishOnboarding(openAddAfter: boolean) {
    setShowOnboarding(false);
    db.setMeta('hasOnboarded', '1').catch(() => {});
    setScreen('find');
    if (openAddAfter) openAdd();
  }

  function openPaywall() {
    setPaywall(true);
  }
  function closePaywall() {
    setPaywall(false);
  }
  async function buyPro() {
    setIsPro(true);
    await db.setMeta('isPro', '1');
    setPaywall(false);
    flash('Pro etkin.', 'Artık sınırsız eşya kaydedebilirsin.');
  }
  async function restorePro() {
    setIsPro(true);
    await db.setMeta('isPro', '1');
    setPaywall(false);
    flash('Satın alma geri yüklendi.', 'Depo Pro yeniden etkin.');
  }

  function openPrivacy() {
    setPrivacyOpen(true);
  }
  function closePrivacy() {
    setPrivacyOpen(false);
  }
  function openHelp() {
    setHelpOpen(true);
  }
  function closeHelp() {
    setHelpOpen(false);
  }

  async function deleteAllData() {
    await db.deleteAllItems();
    setItems([]);
    setSelId(null);
    flash('Bütün veriler silindi.', 'Eşya kayıtları cihazdan kaldırıldı.');
  }

  async function exportCsv() {
    if (!isPro) {
      setPaywall(true);
      return;
    }
    const csv = itemsToCsv(items);
    const file = new File(Paths.cache, `depo-esyalar-${Date.now()}.csv`);
    file.create({ overwrite: true });
    file.write(csv);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      flash('Paylaşım kullanılamıyor.', 'Bu cihazda dosya paylaşımı desteklenmiyor.');
      return;
    }
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Eşyaları dışa aktar' });
  }

  const listed = useMemo(() => {
    const filtered = items.filter((it) => {
      if (filter === 'fav') return it.fav;
      if (filter === 'nophoto') return !it.photoUri;
      if (filter === 'room') return it.loc.indexOf('Yatak odası') === 0;
      return true;
    });
    if (filter === 'recent') {
      return filtered.slice().sort((a, b) => daysSince(a, now) - daysSince(b, now));
    }
    return filtered;
  }, [items, filter, now]);

  const recent = useMemo(
    () => items.slice().sort((a, b) => daysSince(a, now) - daysSince(b, now)).slice(0, 4),
    [items, now]
  );

  // Real substitute for the prototype's 3 hardcoded location suggestions:
  // most recently used distinct locations, falling back to sensible defaults
  // when there isn't enough history yet.
  const locSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const fromItems: string[] = [];
    for (const it of items.slice().sort((a, b) => b.updatedAt - a.updatedAt)) {
      if (!seen.has(it.loc)) {
        seen.add(it.loc);
        fromItems.push(it.loc);
      }
      if (fromItems.length >= 3) break;
    }
    if (fromItems.length >= 3) return fromItems;
    const defaults = ['Yatak odası / Beyaz dolap / Üst çekmece', 'Yatak odası / Komodin / Alt çekmece', 'Salon / TV ünitesi / Sol dolap'];
    for (const d of defaults) {
      if (fromItems.length >= 3) break;
      if (!seen.has(d)) {
        seen.add(d);
        fromItems.push(d);
      }
    }
    return fromItems;
  }, [items]);

  return {
    booting,
    accent: colors.accent,
    isPro,
    showOnboarding,
    onbStep,
    onbData: ONB_STEPS[onbStep],
    onbDotsCount: ONB_STEPS.length,
    onbNext,
    onbSkip,

    screen,
    setScreen,
    nav,
    q,
    setQ,
    filter,
    setFilter,
    filterDefs: FILTER_DEFS,

    items,
    listed,
    recent,
    results,
    card,
    locSuggestions,

    selId,
    selected,
    detail,
    closeDetail: () => setSelId(null),
    toggleFav,
    confirmLoc,
    deleteItem,
    toggleFavById,
    deleteItemById,

    addOpen,
    addName,
    setAddName,
    addLoc,
    setAddLoc,
    addNote,
    setAddNote,
    noteOpen,
    setNoteOpen,
    addPhotoUri,
    setAddPhotoUri,
    openAdd,
    closeAdd,
    createFromQuery,
    saveItem,

    moveOpen,
    moveVal,
    setMoveVal,
    openMove,
    closeMove,
    saveMove,

    voiceTarget,
    voice,
    startVoice,
    voiceRetry,
    voiceUse,

    paywall,
    openPaywall,
    closePaywall,
    buyPro,
    restorePro,

    privacyOpen,
    openPrivacy,
    closePrivacy,
    helpOpen,
    openHelp,
    closeHelp,
    deleteAllData,
    exportCsv,

    toast,
    flash,

    goItems: () => nav({ screen: 'items' }),
  };
}

export type DepoStore = ReturnType<typeof useDepoStore>;

const DepoCtx = createContext<DepoStore | null>(null);

export function DepoProvider({ children }: { children: React.ReactNode }) {
  const store = useDepoStore();
  return <DepoCtx.Provider value={store}>{children}</DepoCtx.Provider>;
}

export function useDepo(): DepoStore {
  const ctx = useContext(DepoCtx);
  if (!ctx) throw new Error('useDepo must be used within DepoProvider');
  return ctx;
}
