import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { haptics } from '../lib/haptics';
import { deleteManagedPhoto, isManagedPhoto, persistPhoto } from '../lib/photoStorage';
import * as db from '../db';
import type { Item } from '../db';
import {
  search, norm, daysBetween, formatAgo, formatMonthDay, initialOf, shortLoc, fullLoc, splitLoc,
  titleCaseFirst,
} from '../lib/search';
import { isUnknownLocation } from '../lib/location';
import { itemsToCsv } from '../lib/csv';
import { useVoiceRecognition } from '../lib/voice';
import { colors, FREE_ITEM_LIMIT } from '../theme';
import { DEFAULT_ITEM_COLOR, type ItemColorKey } from '../lib/colors';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
import {
  configureRevenueCat, fetchCustomerInfoSafe, findLifetimePackage, getCurrentOffering,
  isAlreadyPurchasedError, isCancelledError, isEntitlementActive, isRevenueCatAvailable,
  purchaseErrorKeys, PURCHASES_UNAVAILABLE_COPY,
} from '../lib/revenueCat';

export type FilterKey = 'all' | 'recent' | 'fav' | 'nophoto' | 'loc';
export type VoiceTarget = 'search' | 'name' | 'loc' | 'move' | null;
export type ToastAction = { label: string; onPress: () => void };
export type Toast = { title: string; body: string; action?: ToastAction } | null;
export type Screen = 'find' | 'items' | 'lost' | 'settings';
export type FormMode = 'create' | 'edit' | 'lost-create';

type PendingDelete = { item: Item; timer: ReturnType<typeof setTimeout> };

/** How long "Geri Al" stays available before the DB row is really removed. */
const UNDO_WINDOW_MS = 4500;

/** Upper bound on the location list offered in the form. */
const MAX_LOCATION_SUGGESTIONS = 6;

/** After this long without confirmation, the detail screen suggests a re-check. */
const STALE_LOCATION_DAYS = 90;

// Keys rather than baked strings: the label is resolved at render time, so a
// language change re-labels the chips without any of this being re-created.
const FILTER_DEFS: { key: FilterKey; labelKey: TranslationKey }[] = [
  { key: 'all', labelKey: 'items.filters.all' },
  { key: 'recent', labelKey: 'items.filters.recent' },
  { key: 'fav', labelKey: 'items.filters.fav' },
  { key: 'nophoto', labelKey: 'items.filters.nophoto' },
  { key: 'loc', labelKey: 'items.filters.loc' },
];

const ONB_STEP_KEYS: {
  title: TranslationKey; body: TranslationKey; cta: TranslationKey; chips: TranslationKey[] | null;
}[] = [
  {
    title: 'onboarding.step1Title', body: 'onboarding.step1Body', cta: 'onboarding.step1Cta',
    chips: ['onboarding.step1Chip1', 'onboarding.step1Chip2', 'onboarding.step1Chip3'],
  },
  {
    title: 'onboarding.step2Title', body: 'onboarding.step2Body', cta: 'onboarding.step2Cta',
    chips: ['onboarding.step2Chip1', 'onboarding.step2Chip2', 'onboarding.step2Chip3'],
  },
  {
    title: 'onboarding.step3Title', body: 'onboarding.step3Body', cta: 'onboarding.step3Cta',
    chips: null,
  },
];

// The arrows between the second step's chips are punctuation, not copy.
const ONB_STEP2_SEPARATOR = '→';

function daysSince(it: Item, now: number) {
  return daysBetween(it.updatedAt, now);
}


export function useDepoStore() {
  // `t` is stable per locale, so listing it in the dependency arrays below
  // only re-creates those callbacks when the language actually changes —
  // never during normal scrolling, which is what keeps ItemRow's React.memo
  // effective.
  const { locale, t } = useI18n();
  const [booting, setBooting] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onbStep, setOnbStep] = useState(0);

  const [screen, setScreen] = useState<Screen>('find');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);
  const [locFilterOpen, setLocFilterOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  // Full-screen "Geçmiş" timeline, opened from the Items header rather than
  // a fifth tab. Detail sits above it, so tapping a row and coming back
  // returns to the timeline where the user left it.
  const [historyOpen, setHistoryOpen] = useState(false);

  // Unified add / edit / lost-report form state.
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formEditingId, setFormEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formLoc, setFormLoc] = useState('');
  const [formLocUnknown, setFormLocUnknown] = useState(false);
  const [formNote, setFormNote] = useState('');
  const [formNoteOpen, setFormNoteOpen] = useState(false);
  const [formPhotoUri, setFormPhotoUri] = useState<string | null>(null);
  const [formColorKey, setFormColorKey] = useState<ItemColorKey>(DEFAULT_ITEM_COLOR);
  const [formOriginalLoc, setFormOriginalLoc] = useState('');
  // The photo the row already had when an edit started, so we can tell an
  // untouched photo from a newly picked one.
  const [formOriginalPhotoUri, setFormOriginalPhotoUri] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveVal, setMoveVal] = useState('');

  const [foundSheetOpen, setFoundSheetOpen] = useState(false);
  const [foundLocVal, setFoundLocVal] = useState('');

  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget>(null);
  const [paywall, setPaywall] = useState(false);
  // Store offering, loaded fresh each time the paywall opens so the price
  // shown is never stale. RevenueCat — not this state, not app_meta — is the
  // only thing that ever decides `isPro`.
  const [offeringStatus, setOfferingStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Items removed from the UI but not yet deleted from the DB, keyed by id
  // so several undo windows can be in flight at once.
  const pendingDeletesRef = useRef<Map<string, PendingDelete>>(new Map());

  const voice = useVoiceRecognition();

  // Read through a ref by every write path, so the DB layer always gets the
  // locale that is current *at the moment of the write* without any of the
  // callbacks below having to be re-created on a language change.
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    configureRevenueCat();
    (async () => {
      // Device language is resolved synchronously on the very first render,
      // so a genuinely empty database is seeded in the right language.
      await db.initDb(localeRef.current);
      // The item-tracking half of the app boots off local SQLite alone —
      // this never waits on RevenueCat, so a slow or unreachable network
      // never delays opening to the user's own data.
      const [loaded, hasOnboarded] = await Promise.all([
        db.listItems(),
        db.getMeta('hasOnboarded'),
      ]);
      setItems(loaded);
      setShowOnboarding(!hasOnboarded);
      setBooting(false);
    })();
    // Resolved independently, in parallel. `fetchCustomerInfoSafe` never
    // throws and defaults to null on any failure, so `isPro` simply stays at
    // its `false` initial value rather than ever defaulting to true.
    fetchCustomerInfoSafe().then((info) => {
      if (info) setIsPro(isEntitlementActive(info));
    });
  }, []);

  // Entitlement changes (a purchase completing elsewhere, a renewal, a
  // refund) flow back through this listener rather than only through the
  // explicit purchase/restore calls below. Registered once for the life of
  // the app — the empty dependency array is what prevents a duplicate
  // registration on re-render.
  useEffect(() => {
    if (!isRevenueCatAvailable()) return;
    const listener = (info: CustomerInfo) => setIsPro(isEntitlementActive(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const flash = useCallback((title: string, body: string, action?: ToastAction) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ title, body, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 4500 : 2600);
  }, []);

  // Mirrors the design's nav(): switching screens/targets always collapses
  // every overlay (form/move/detail/paywall/voice/found/loc-filter) back to
  // a clean base state.
  const nav = useCallback((patch: Partial<{
    screen: Screen; q: string; selId: string | null; filter: FilterKey;
  }>) => {
    voice.reset();
    setFormOpen(false);
    setMoveOpen(false);
    setMoveVal('');
    setFoundSheetOpen(false);
    setFoundLocVal('');
    setLocFilterOpen(false);
    setHistoryOpen(false);
    setSelId(null);
    setPaywall(false);
    setPrivacyOpen(false);
    setHelpOpen(false);
    setVoiceTarget(null);
    if (patch.screen !== undefined) setScreen(patch.screen);
    if (patch.q !== undefined) setQ(patch.q);
    if (patch.selId !== undefined) setSelId(patch.selId);
    if (patch.filter !== undefined) setFilter(patch.filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Relative labels ("3 gün önce") only need minute resolution. Bucketing to
  // the minute keeps this value identical across renders inside the same
  // minute, so the derived-list useMemos below aren't invalidated on every
  // single render the way a raw Date.now() would.
  const now = Math.floor(Date.now() / 60000) * 60000;
  const results = useMemo(() => search(items, q, (it) => daysSince(it, now)), [items, q, now]);

  // Row callbacks read the latest items/selection through refs so they can
  // stay referentially stable — that is what lets ItemRow's React.memo
  // actually skip work while a long list scrolls.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selIdRef = useRef(selId);
  selIdRef.current = selId;

  const openItem = useCallback((id: string) => setSelId(id), []);

  // The user's own text (name, location, note) is never translated — only the
  // "location unknown" placeholder, which was never user input to begin with.
  function card(it: Item) {
    const unknownLoc = isUnknownLocation(it.loc);
    const unknownLabel = t('common.unknownLocation');
    return {
      id: it.id,
      name: it.name,
      initial: initialOf(it.name, locale),
      shortLoc: unknownLoc ? unknownLabel : shortLoc(it.loc),
      fullLoc: unknownLoc ? unknownLabel : fullLoc(it.loc),
      fav: it.fav,
      photoUri: it.photoUri,
      ago: formatAgo(it.updatedAt, now, locale),
      colorKey: it.colorKey,
      lost: it.status === 'lost',
      open: () => setSelId(it.id),
    };
  }

  const selected = items.find((x) => x.id === selId) || null;

  function detail() {
    if (!selected) return null;
    const isLost = selected.status === 'lost';
    return {
      item: selected,
      name: selected.name,
      lines: isUnknownLocation(selected.loc)
        ? [t('common.unknownLocation')]
        : splitLoc(selected.loc),
      note: selected.note,
      confirmed: t('detail.confirmedAgo', { ago: formatAgo(selected.updatedAt, now, locale) }),
      // A location nobody has confirmed in months is worth a gentle nudge —
      // stated calmly, since a stale record is normal, not an error.
      stale: !isLost && daysBetween(selected.updatedAt, now) >= STALE_LOCATION_DAYS,
      isLost,
      lostDaysLabel: isLost && selected.lostAt
        ? t('detail.lostDays', { count: Math.max(0, daysBetween(selected.lostAt, now)) })
        : null,
      history: selected.history.map((h, i) => ({
        where: h.where,
        when: formatMonthDay(h.at, locale),
        dot: i === 0 ? colors.accent : colors.photoPlaceholderBorder,
      })),
    };
  }

  // Every reload goes through here, and every reload hides rows whose undo
  // window is still open — otherwise an unrelated refresh (favouriting
  // another item, an edit, a move) would resurrect a just-deleted row,
  // since its DB record deliberately still exists.
  const refreshItems = useCallback(async () => {
    const loaded = await db.listItems();
    const pending = pendingDeletesRef.current;
    setItems(pending.size ? loaded.filter((it) => !pending.has(it.id)) : loaded);
  }, []);

  function resetForm() {
    setFormName('');
    setFormLoc('');
    setFormLocUnknown(false);
    setFormNote('');
    setFormNoteOpen(false);
    setFormPhotoUri(null);
    setFormColorKey(DEFAULT_ITEM_COLOR);
    setFormOriginalLoc('');
    setFormOriginalPhotoUri(null);
  }

  function openAddForm() {
    resetForm();
    setFormMode('create');
    setFormEditingId(null);
    setFormOpen(true);
  }

  function openEditForm() {
    if (!selected) return;
    setFormMode('edit');
    setFormEditingId(selected.id);
    setFormName(selected.name);
    setFormLoc(selected.loc);
    setFormOriginalLoc(selected.loc);
    setFormLocUnknown(false);
    setFormNote(selected.note);
    setFormNoteOpen(!!selected.note);
    setFormPhotoUri(selected.photoUri);
    setFormOriginalPhotoUri(selected.photoUri);
    setFormColorKey(selected.colorKey);
    setFormOpen(true);
  }

  function openLostForm() {
    resetForm();
    setFormMode('lost-create');
    setFormEditingId(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
  }

  function createFromQuery() {
    resetForm();
    setFormMode('create');
    setFormEditingId(null);
    setFormName(titleCaseFirst(q, locale));
    setFormOpen(true);
  }

  const formValid = formName.trim().length > 0 &&
    (formMode === 'lost-create' ? (formLocUnknown || formLoc.trim().length > 0) : formLoc.trim().length > 0);

  // Photo/DB ordering rule used throughout: copy the new photo in first, write
  // the DB second, and only delete the old photo once the DB write actually
  // succeeded. Never the other way round — a failed write must never be able
  // to take the user's existing photo with it.
  async function saveForm() {
    if (!formValid || formSaving) return;

    // Check the free limit before copying anything, so a blocked save can't
    // leave an orphaned file behind.
    if (formMode === 'create' && !isPro && items.length >= FREE_ITEM_LIMIT) {
      openPaywall();
      return;
    }

    setFormSaving(true);
    // Set when this save copied a new file in, so failures can roll it back.
    let persistedPhotoUri: string | null = null;

    try {
      const photoChanged = formPhotoUri !== formOriginalPhotoUri;
      if (formPhotoUri && photoChanged && !isManagedPhoto(formPhotoUri)) {
        try {
          persistedPhotoUri = await persistPhoto(formPhotoUri);
        } catch (err) {
          if (__DEV__) console.error('[saveForm] persistPhoto failed', err);
          flash(t('errors.photoSaveTitle'), t('errors.photoSaveBody'));
          return;
        }
      }
      // Unchanged photos keep their existing managed URI — no needless copy.
      const photoUri = persistedPhotoUri ?? formPhotoUri;

      if (formMode === 'create' || formMode === 'lost-create') {
        const isLost = formMode === 'lost-create';
        const loc = isLost && formLocUnknown ? '' : formLoc;
        const create = isLost ? db.createLostItem : db.createItem;
        let created: Item;
        try {
          created = await create({
            name: formName, loc, note: formNote, photoUri, colorKey: formColorKey,
          }, locale);
        } catch (err) {
          if (__DEV__) console.error('[saveForm] create failed', err);
          await deleteManagedPhoto(persistedPhotoUri);
          flash(t('errors.itemSaveTitle'), t('errors.itemSaveBody'));
          return;
        }
        await refreshItems();
        setFormOpen(false);
        setScreen(isLost ? 'lost' : 'find');
        if (!isLost) setQ('');
        haptics.success();
        if (isLost) {
          flash(t('toast.savedLostTitle'), created.name);
        } else {
          const createdLoc = isUnknownLocation(created.loc)
            ? t('common.unknownLocation')
            : created.loc;
          flash(t('toast.savedTitle'), t('toast.savedBody', { name: created.name, loc: createdLoc }));
        }
      } else if (formMode === 'edit' && formEditingId) {
        const id = formEditingId;
        const movedTo = formLoc.trim() && formLoc.trim() !== formOriginalLoc.trim()
          ? formLoc
          : undefined;
        try {
          await db.updateItemWithOptionalMove(
            id,
            { name: formName, note: formNote, photoUri, colorKey: formColorKey },
            locale,
            movedTo
          );
        } catch (err) {
          if (__DEV__) console.error('[saveForm] update failed', err);
          await deleteManagedPhoto(persistedPhotoUri);
          flash(t('errors.changesSaveTitle'), t('errors.changesSaveBody'));
          return;
        }
        // The row now points at the new photo, so the previous one is safe
        // to drop.
        if (photoChanged) await deleteManagedPhoto(formOriginalPhotoUri);
        await refreshItems();
        setFormOpen(false);
        haptics.success();
        flash(t('toast.changesSavedTitle'), formName.trim());
      }
    } finally {
      setFormSaving(false);
    }
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
    await db.moveItem(selId, moveVal, locale);
    await refreshItems();
    setMoveOpen(false);
    setMoveVal('');
    flash(t('toast.movedTitle'), t('toast.movedBody'));
  }

  async function toggleFav() {
    if (!selected) return;
    haptics.light();
    await db.toggleFavorite(selected.id, !selected.fav);
    await refreshItems();
  }

  async function confirmLoc() {
    if (!selId) return;
    await db.confirmItem(selId);
    await refreshItems();
    haptics.success();
    flash(t('toast.confirmedTitle'), t('toast.confirmedBody'));
  }

  async function deleteItem() {
    if (!selId) return;
    let removed: { photoUri: string | null };
    try {
      removed = await db.deleteItemDb(selId);
    } catch (err) {
      if (__DEV__) console.error('[deleteItem] failed', err);
      flash(t('errors.deleteTitle'), t('errors.deleteBody'));
      return;
    }
    setSelId(null);
    await refreshItems();
    // Only now that the row is gone is the file genuinely unreferenced.
    await deleteManagedPhoto(removed.photoUri);
    flash(t('toast.deletedTitle'), t('toast.deletedBody'));
  }

  // Row-level variants for the list swipe actions, which act on an arbitrary
  // item rather than the one currently open in the detail screen.
  const toggleFavById = useCallback(async (id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (!it) return;
    await db.toggleFavorite(id, !it.fav);
    await refreshItems();
    flash(it.fav ? t('toast.favRemovedTitle') : t('toast.favAddedTitle'), it.name);
  }, [refreshItems, flash, t]);

  const deleteItemById = useCallback(async (id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (!it) return;
    let removed: { photoUri: string | null };
    try {
      removed = await db.deleteItemDb(id);
    } catch (err) {
      if (__DEV__) console.error('[deleteItemById] failed', err);
      flash(t('errors.deleteTitle'), t('errors.deleteBody'));
      return;
    }
    if (selIdRef.current === id) setSelId(null);
    await refreshItems();
    await deleteManagedPhoto(removed.photoUri);
    flash(t('toast.deletedTitle'), t('toast.deletedBodyNamed', { name: it.name }));
  }, [refreshItems, flash, t]);

  // Full-swipe delete: no confirmation Alert (the full swipe itself is the
  // deliberate gesture) — instead it's optimistic + undoable. The row
  // disappears immediately; the DB row is only actually deleted once the
  // undo window lapses without the user tapping "Geri Al".
  // Undo window lapsed: the row really goes. A failed DB delete must not be
  // swallowed — the item comes back so the user never silently loses data.
  const commitPendingDelete = useCallback(async (id: string) => {
    const entry = pendingDeletesRef.current.get(id);
    if (!entry) return;
    try {
      const removed = await db.deleteItemDb(id);
      pendingDeletesRef.current.delete(id);
      // The undo window closed without a rescue, so the photo is free to go.
      await deleteManagedPhoto(removed.photoUri);
    } catch {
      pendingDeletesRef.current.delete(id);
      await refreshItems();
      flash(t('errors.deleteTitle'), t('errors.deleteRestoredBody', { name: entry.item.name }));
    }
  }, [refreshItems, flash, t]);

  // The DB row was never touched during the undo window, so restoring is a
  // plain reload — no re-insert, hence no duplicate row and no lost history.
  const undoDelete = useCallback(async (id: string) => {
    const entry = pendingDeletesRef.current.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pendingDeletesRef.current.delete(id);
    haptics.light();
    setToast(null);
    await refreshItems();
  }, [refreshItems]);

  const deleteItemByIdWithUndo = useCallback((id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (!it || pendingDeletesRef.current.has(id)) return;

    // Each delete gets its own timer/entry, so two deletes started seconds
    // apart can never clobber each other's pending state.
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (selIdRef.current === id) setSelId(null);

    const timer = setTimeout(() => { commitPendingDelete(id); }, UNDO_WINDOW_MS);
    pendingDeletesRef.current.set(id, { item: it, timer });

    flash(t('toast.deletedTitle'), it.name, {
      label: t('common.undo'),
      onPress: () => undoDelete(id),
    });
  }, [commitPendingDelete, undoDelete, flash, t]);

  async function markLost() {
    if (!selId) return;
    const name = selected?.name ?? '';
    await db.markItemLost(selId);
    await refreshItems();
    flash(t('toast.markedLostTitle'), name);
  }

  function openFoundSheet() {
    setFoundLocVal('');
    setFoundSheetOpen(true);
  }
  function closeFoundSheet() {
    setFoundSheetOpen(false);
    setFoundLocVal('');
  }
  async function markFound(useNewLoc: boolean) {
    if (!selId) return;
    await db.markItemFound(selId, locale, useNewLoc ? foundLocVal : undefined);
    await refreshItems();
    setFoundSheetOpen(false);
    setFoundLocVal('');
    haptics.success();
    flash(t('toast.foundTitle'), t('toast.foundBody'));
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
    else if (voiceTarget === 'name') setFormName(text);
    else if (voiceTarget === 'loc') setFormLoc(text);
    else if (voiceTarget === 'move') setMoveVal(text);
    setVoiceTarget(null);
    voice.reset();
  }

  // Re-derived when the locale changes, so switching language mid-onboarding
  // re-labels the step immediately.
  const onbData = useMemo(() => {
    const step = ONB_STEP_KEYS[onbStep];
    const chips = step.chips ? step.chips.map((key) => t(key)) : null;
    return {
      title: t(step.title),
      body: t(step.body),
      cta: t(step.cta),
      // Step two reads as a flow, so its chips are joined by arrows.
      chips: chips && onbStep === 1
        ? [chips[0], ONB_STEP2_SEPARATOR, chips[1], ONB_STEP2_SEPARATOR, chips[2]]
        : chips,
    };
  }, [onbStep, t]);

  const filterDefs = useMemo(
    () => FILTER_DEFS.map((f) => ({ key: f.key, label: t(f.labelKey) })),
    [t]
  );

  function onbNext() {
    if (onbStep < ONB_STEP_KEYS.length - 1) {
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
    if (openAddAfter) openAddForm();
  }

  // Fetched fresh on every open rather than cached across the app's
  // lifetime, so a price change or a newly-fixed offering in the dashboard
  // shows up without requiring a relaunch.
  const loadOffering = useCallback(async () => {
    if (!isRevenueCatAvailable()) {
      setOfferingStatus('error');
      return;
    }
    setOfferingStatus('loading');
    try {
      const offering = await getCurrentOffering();
      const pkg = findLifetimePackage(offering);
      if (!pkg) {
        setLifetimePackage(null);
        setOfferingStatus('error');
        return;
      }
      setLifetimePackage(pkg);
      setOfferingStatus('ready');
    } catch (err) {
      if (__DEV__) console.warn('[loadOffering] failed', err);
      setLifetimePackage(null);
      setOfferingStatus('error');
    }
  }, []);

  // Resolves an SDK error to copy at the moment it is shown, so the message
  // is always in the language that is active right then.
  const purchaseErrorCopy = useCallback((err: unknown): [string, string] => {
    const { titleKey, bodyKey } = purchaseErrorKeys(err);
    return [t(titleKey), t(bodyKey)];
  }, [t]);

  function openPaywall() {
    // Last line of defence: every current caller already checks `isPro`, but
    // a future entry point that forgets must still never show a purchase
    // screen to someone who has already bought.
    if (isPro) return;
    setPaywall(true);
    loadOffering();
  }
  function closePaywall() {
    setPaywall(false);
  }

  async function buyPro() {
    // The button is disabled in these states too — this guard is what
    // actually stops a double tap from starting two purchases.
    if (purchasing || restoring || !lifetimePackage) return;
    setPurchasing(true);
    try {
      const result = await Purchases.purchasePackage(lifetimePackage);
      if (isEntitlementActive(result.customerInfo)) {
        setIsPro(true);
        setPaywall(false);
        haptics.success();
        flash(t('pro.purchasedTitle'), t('pro.purchasedBody'));
      } else {
        // The store reported success but RevenueCat's own entitlement check
        // disagrees — never claim success on the strength of the former.
        flash(t('errors.purchaseFailedTitle'), t('errors.purchaseFailedBody'));
      }
    } catch (err) {
      if (isCancelledError(err)) {
        // The user closing Apple's sheet is not an error: no toast, no
        // alert, the paywall just stays open with its loading state cleared.
      } else if (isAlreadyPurchasedError(err)) {
        const info = await fetchCustomerInfoSafe();
        if (info && isEntitlementActive(info)) {
          setIsPro(true);
          setPaywall(false);
          flash(t('pro.alreadyActiveTitle'), t('pro.alreadyActiveBody'));
        } else {
          flash(...purchaseErrorCopy(err));
        }
      } else {
        if (__DEV__) console.error('[buyPro] purchase failed', err);
        flash(...purchaseErrorCopy(err));
      }
    } finally {
      setPurchasing(false);
    }
  }

  // Always a user-initiated action — never called automatically at boot,
  // since fetchCustomerInfoSafe() already covers that check.
  async function restorePro() {
    if (purchasing || restoring) return;
    if (!isRevenueCatAvailable()) {
      flash(t(PURCHASES_UNAVAILABLE_COPY.titleKey), t(PURCHASES_UNAVAILABLE_COPY.bodyKey));
      return;
    }
    setRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      if (isEntitlementActive(info)) {
        setIsPro(true);
        setPaywall(false);
        haptics.success();
        flash(t('pro.restoredTitle'), t('pro.restoredBody'));
      } else {
        setIsPro(false);
        flash(t('pro.nothingToRestoreTitle'), t('pro.nothingToRestoreBody'));
      }
    } catch (err) {
      if (__DEV__) console.error('[restorePro] restore failed', err);
      flash(...purchaseErrorCopy(err));
    } finally {
      setRestoring(false);
    }
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
    // Everything is going anyway — drop the pending timers so none of them
    // later fires against an already-empty table (or resurrects a row).
    for (const entry of pendingDeletesRef.current.values()) clearTimeout(entry.timer);
    pendingDeletesRef.current.clear();
    let removed: { photoUris: string[] };
    try {
      removed = await db.deleteAllItems();
    } catch (err) {
      if (__DEV__) console.error('[deleteAllData] failed', err);
      flash(t('errors.deleteAllTitle'), t('errors.deleteAllBody'));
      return;
    }
    setItems([]);
    setSelId(null);
    for (const uri of removed.photoUris) await deleteManagedPhoto(uri);
    flash(t('toast.deletedAllTitle'), t('toast.deletedAllBody'));
  }

  async function exportCsv() {
    if (!isPro) {
      openPaywall();
      return;
    }
    const csv = itemsToCsv(items, locale);
    const file = new File(Paths.cache, `depo-esyalar-${Date.now()}.csv`);
    file.create({ overwrite: true });
    file.write(csv);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      flash(t('errors.sharingTitle'), t('errors.sharingBody'));
      return;
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: t('settings.exportData'),
    });
  }

  const storedItems = useMemo(() => items.filter((it) => it.status === 'stored'), [items]);
  const lostItems = useMemo(
    () => items.filter((it) => it.status === 'lost').sort((a, b) => (b.lostAt || 0) - (a.lostAt || 0)),
    [items]
  );

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of storedItems) {
      const first = it.loc.split(' / ')[0]?.trim();
      if (first) set.add(first);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [storedItems]);

  function openHistory() {
    setHistoryOpen(true);
  }
  function closeHistory() {
    setHistoryOpen(false);
  }

  function openLocFilterSheet() {
    setLocFilterOpen(true);
  }
  function closeLocFilterSheet() {
    setLocFilterOpen(false);
  }
  function chooseLocFilter(loc: string) {
    setSelectedLoc(loc);
    setFilter('loc');
    setLocFilterOpen(false);
  }

  const listed = useMemo(() => {
    const filtered = storedItems.filter((it) => {
      if (filter === 'fav') return it.fav;
      if (filter === 'nophoto') return !it.photoUri;
      if (filter === 'loc') return selectedLoc ? it.loc.split(' / ')[0]?.trim() === selectedLoc : true;
      return true;
    });
    if (filter === 'recent') {
      return filtered.slice().sort((a, b) => daysSince(a, now) - daysSince(b, now));
    }
    return filtered;
  }, [storedItems, filter, selectedLoc, now]);

  const recent = useMemo(
    () => items.slice().sort((a, b) => daysSince(a, now) - daysSince(b, now)).slice(0, 4),
    [items, now]
  );

  // Every distinct location the user has actually used, most recent first.
  // Deduped on a normalized key so "Salon / Dolap" and " salon / dolap "
  // don't both show up, while the nicely-cased original is what's displayed.
  const recentLocations = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const it of storedItems.slice().sort((a, b) => b.updatedAt - a.updatedAt)) {
      if (!it.loc) continue;
      const key = norm(it.loc);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it.loc);
      if (out.length >= MAX_LOCATION_SUGGESTIONS) break;
    }
    return out;
  }, [storedItems]);

  // What the form actually shows: as the user types, the same list narrows to
  // locations containing what they've written so far, so a long breadcrumb
  // never has to be retyped in full.
  const locSuggestions = useMemo(() => {
    const typed = norm(formLoc);
    if (!typed) return recentLocations;
    const matches = recentLocations.filter((loc) => norm(loc).includes(typed));
    // Hide a suggestion that is just what they already typed.
    return matches.filter((loc) => norm(loc) !== typed);
  }, [recentLocations, formLoc]);

  return {
    booting,
    accent: colors.accent,
    isPro,
    showOnboarding,
    onbStep,
    onbData,
    onbDotsCount: ONB_STEP_KEYS.length,
    onbNext,
    onbSkip,

    screen,
    setScreen,
    nav,
    q,
    setQ,
    filter,
    setFilter,
    filterDefs,
    selectedLoc,
    locationOptions,
    locFilterOpen,
    openLocFilterSheet,
    closeLocFilterSheet,
    chooseLocFilter,
    historyOpen,
    openHistory,
    closeHistory,

    items,
    storedItems,
    lostItems,
    listed,
    recent,
    results,
    card,
    locSuggestions,

    selId,
    selected,
    detail,
    openItem,
    closeDetail: () => setSelId(null),
    toggleFav,
    confirmLoc,
    deleteItem,
    toggleFavById,
    deleteItemById,
    deleteItemByIdWithUndo,
    markLost,

    foundSheetOpen,
    foundLocVal,
    setFoundLocVal,
    openFoundSheet,
    closeFoundSheet,
    markFound,

    formOpen,
    formMode,
    formName,
    setFormName,
    formLoc,
    setFormLoc,
    formLocUnknown,
    setFormLocUnknown,
    formNote,
    setFormNote,
    formNoteOpen,
    setFormNoteOpen,
    formPhotoUri,
    setFormPhotoUri,
    formColorKey,
    setFormColorKey,
    formValid,
    formSaving,
    openAddForm,
    openEditForm,
    openLostForm,
    closeForm,
    createFromQuery,
    saveForm,

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
    offeringStatus,
    lifetimePackage,
    purchasing,
    restoring,
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
