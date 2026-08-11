import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { colors, motion, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import type { Item } from '../db';
import { formatMonthDay, initialOf, lastSegment, splitLoc } from '../lib/search';
import { isUnknownLocation } from '../lib/location';
import { useI18n } from '../i18n/I18nProvider';
import type { AppLocale, TranslationKey } from '../i18n';
import type { TranslateFn } from '../i18n/I18nProvider';
import { haptics } from '../lib/haptics';
import ItemAvatar from '../components/ItemAvatar';
import EmptyState from '../components/EmptyState';
import { HistoryIcon } from '../components/icons';
import type { ItemColorKey } from '../lib/colors';

const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

const DAY_MS = 86400000;

/** Every event the timeline can show comes from a real `item_history` row. */
type EventType = 'created' | 'moved';

type HistoryEvent = {
  key: string;
  itemId: string;
  name: string;
  initial: string;
  colorKey: ItemColorKey;
  photoUri: string | null;
  where: string;
  type: EventType;
  at: number;
};

type RangeKey = 'all' | '30' | '7';

const RANGES: { key: RangeKey; labelKey: TranslationKey; days: number | null }[] = [
  { key: '7', labelKey: 'history.range7', days: 7 },
  { key: '30', labelKey: 'history.range30', days: 30 },
  { key: 'all', labelKey: 'history.rangeAll', days: null },
];

const EVENT_LABEL_KEY: Record<EventType, TranslationKey> = {
  created: 'history.eventCreated',
  moved: 'history.eventMoved',
};

/** ' › ' rather than the list rows' ' · ' — a path reads as a direction here. */
function breadcrumb(loc: string): string {
  return splitLoc(loc).join(' › ');
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * "Bugün" / "Dün" / "8 Ağustos" / "12 Aralık 2025" — and their English
 * equivalents, formatted by the platform for the active locale. Still no
 * date library.
 */
function dayLabel(ts: number, now: number, locale: AppLocale, t: TranslateFn): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS);
  if (diffDays === 0) return t('history.today');
  if (diffDays === 1) return t('history.yesterday');
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear();
  return formatMonthDay(ts, locale, !sameYear);
}

function clock(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Flattens every item's stored location history into one timeline.
 *
 * Two things the database genuinely cannot tell us, handled honestly rather
 * than guessed at:
 *  - There is no event-type column. What we do know is that creating an item
 *    writes exactly one history row, and every later row was written by a
 *    move — so the *oldest* row for an item is its creation, and that is the
 *    only inference made here.
 *  - `where_text` stores only the last breadcrumb segment. The newest row is
 *    by definition the item's current location, so that one — and only that
 *    one — can be widened to the full path from `item.loc`.
 */
function buildEvents(items: Item[], locale: AppLocale, unknownLabel: string): HistoryEvent[] {
  const out: HistoryEvent[] = [];
  for (const it of items) {
    const h = it.history; // newest first, straight from listItems()
    if (h.length === 0) continue;
    const initial = initialOf(it.name, locale);
    const unknownLoc = isUnknownLocation(it.loc);
    const currentTail = unknownLoc ? '' : lastSegment(it.loc);
    for (let i = 0; i < h.length; i++) {
      const isNewest = i === 0;
      const raw = isNewest && !unknownLoc && currentTail === h[i].where
        ? breadcrumb(it.loc)
        : h[i].where;
      // Neither the internal token nor the legacy Turkish placeholder is ever
      // shown — both resolve to the current locale's wording.
      const where = isUnknownLocation(raw) ? unknownLabel : raw;
      out.push({
        key: `${it.id}:${i}:${h[i].at}`,
        itemId: it.id,
        name: it.name,
        initial,
        colorKey: it.colorKey,
        photoUri: it.photoUri,
        where,
        type: i === h.length - 1 ? 'created' : 'moved',
        at: h[i].at,
      });
    }
  }
  out.sort((a, b) => b.at - a.at);
  return out;
}

function Row({
  event, onPress, eventLabel, timeLabel, a11yLabel,
}: {
  event: HistoryEvent;
  onPress: (id: string) => void;
  eventLabel: string;
  timeLabel: string;
  a11yLabel: string;
}) {
  return (
    <Pressable
      onPress={() => onPress(event.itemId)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <ItemAvatar initial={event.initial} colorKey={event.colorKey} photoUri={event.photoUri} size={40} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>{event.name}</Text>
        <Text style={styles.rowWhere} numberOfLines={1}>
          {eventLabel} · {event.where}
        </Text>
      </View>
      <Text style={styles.rowTime}>{timeLabel}</Text>
    </Pressable>
  );
}

const MemoRow = React.memo(Row);

export default function HistoryScreen() {
  const { items, closeHistory, openItem } = useDepo();
  const { locale, t } = useI18n();
  const reduced = useReducedMotion();
  const [range, setRange] = useState<RangeKey>('all');

  // Minute buckets, same as the rest of the app: day labels never need finer
  // resolution, and this keeps the memos below stable between renders.
  const now = Math.floor(Date.now() / 60000) * 60000;

  // Deleted items take their history rows with them (deleteItemDb clears both
  // in one transaction), and items inside an open undo window are already
  // filtered out of `items` — so a row here can never point at a record that
  // no longer opens.
  const unknownLabel = t('common.unknownLocation');
  const events = useMemo(
    () => buildEvents(items, locale, unknownLabel),
    [items, locale, unknownLabel]
  );

  const sections = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? null;
    const from = days === null ? 0 : startOfDay(now) - (days - 1) * DAY_MS;
    const out: { title: string; data: HistoryEvent[] }[] = [];
    let lastKey = '';
    // `events` is already newest-first, so a single pass groups it.
    for (const e of events) {
      if (e.at < from) continue;
      const d = new Date(e.at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== lastKey) {
        out.push({ title: dayLabel(e.at, now, locale, t), data: [] });
        lastKey = key;
      }
      out[out.length - 1].data.push(e);
    }
    return out;
  }, [events, range, now, locale, t]);

  const onRowPress = useCallback((id: string) => openItem(id), [openItem]);

  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 8 }] });

  const header = (
    <View style={styles.listHeader}>
      <Text style={styles.title}>{t('history.title')}</Text>
      <Text style={styles.subtitle}>{t('history.subtitle')}</Text>
      {/* Kept mounted even when the filtered result is empty, so the user can
          always widen the range again. */}
      <View style={styles.chipRow}>
        {RANGES.map((r) => {
          const on = range === r.key;
          const label = t(r.labelKey);
          return (
            <Pressable
              key={r.key}
              onPress={() => {
                haptics.light();
                setRange(r.key);
              }}
              hitSlop={{ top: 5, bottom: 5 }}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: on ? colors.accent : colors.neutralChip },
                pressed && !on && { backgroundColor: colors.neutralChipPressed },
              ]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
            >
              <Text
                style={[styles.chipText, { color: on ? '#fff' : colors.neutralChipText }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const empty = events.length === 0 ? (
    <EmptyState
      icon={<HistoryIcon size={26} color={colors.indigo} />}
      title={t('history.emptyTitle')}
      body={t('history.emptyBody')}
    />
  ) : (
    <EmptyState
      icon={<HistoryIcon size={26} color={colors.indigo} />}
      title={t('history.rangeEmptyTitle')}
      body={t('history.rangeEmptyBody')}
    />
  );

  return (
    <AnimatedSafeArea style={styles.root} edges={['top', 'bottom']} entering={entering}>
      <View style={styles.navBar}>
        <Pressable onPress={closeHistory} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.backA11y')}>
          <Text style={styles.back} numberOfLines={1}>{t('common.back')}</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(e) => e.key}
        renderItem={({ item }) => {
          const eventLabel = t(EVENT_LABEL_KEY[item.type]);
          const timeLabel = clock(item.at);
          return (
            <MemoRow
              event={item}
              onPress={onRowPress}
              eventLabel={eventLabel}
              timeLabel={timeLabel}
              a11yLabel={t('history.rowA11y', {
                name: item.name, event: eventLabel, where: item.where, time: timeLabel,
              })}
            />
          );
        }}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        initialNumToRender={14}
        maxToRenderPerBatch={12}
        windowSize={7}
      />
    </AnimatedSafeArea>
  );
}

const styles = StyleSheet.create({
  // One step below DetailScreen's zIndex, so opening an item from the
  // timeline puts the detail screen on top of it.
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 18, backgroundColor: colors.appBg },
  navBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  back: { ...typography.body, color: colors.indigo, fontWeight: '500' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  listHeader: { marginBottom: spacing.xs },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  subtitle: { ...typography.subheadline, color: colors.textSecondary, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  chip: {
    height: 34, paddingHorizontal: spacing.lg - 2, borderRadius: radii.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { ...typography.caption, fontSize: 13.5, lineHeight: 18 },
  sectionHeader: {
    ...typography.footnote, fontWeight: '600', color: colors.textSecondary,
    paddingLeft: spacing.xs, marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  row: {
    ...surfaces.card,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md - 1,
    paddingHorizontal: spacing.lg - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowPressed: { backgroundColor: colors.cardPressed },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { ...typography.bodyStrong, color: colors.textPrimary },
  rowWhere: { ...typography.footnote, color: colors.textSecondary },
  rowTime: { ...typography.caption, color: colors.textTertiary, flexShrink: 0 },
});
