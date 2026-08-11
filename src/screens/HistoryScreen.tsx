import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { colors, motion, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { UNKNOWN_LOCATION, type Item } from '../db';
import { MONTHS_TR, initialOf, lastSegment, splitLoc } from '../lib/search';
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

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: '7', label: 'Son 7 gün', days: 7 },
  { key: '30', label: 'Son 30 gün', days: 30 },
  { key: 'all', label: 'Tümü', days: null },
];

const EVENT_LABEL: Record<EventType, string> = {
  created: 'Eklendi',
  moved: 'Taşındı',
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
 * "Bugün" / "Dün" / "8 Ağustos" / "12 Aralık 2025".
 * Built from the platform Date plus the month table the app already ships —
 * no date library, and no dependency on Intl being present in the runtime.
 */
function dayLabel(ts: number, now: number): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS);
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  const d = new Date(ts);
  const base = `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
  return d.getFullYear() === new Date(now).getFullYear() ? base : `${base} ${d.getFullYear()}`;
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
function buildEvents(items: Item[]): HistoryEvent[] {
  const out: HistoryEvent[] = [];
  for (const it of items) {
    const h = it.history; // newest first, straight from listItems()
    if (h.length === 0) continue;
    const initial = initialOf(it.name);
    const currentTail = lastSegment(it.loc);
    for (let i = 0; i < h.length; i++) {
      const isNewest = i === 0;
      const where = isNewest && currentTail === h[i].where ? breadcrumb(it.loc) : h[i].where;
      out.push({
        key: `${it.id}:${i}:${h[i].at}`,
        itemId: it.id,
        name: it.name,
        initial,
        colorKey: it.colorKey,
        photoUri: it.photoUri,
        where: where || UNKNOWN_LOCATION,
        type: i === h.length - 1 ? 'created' : 'moved',
        at: h[i].at,
      });
    }
  }
  out.sort((a, b) => b.at - a.at);
  return out;
}

function Row({ event, onPress }: { event: HistoryEvent; onPress: (id: string) => void }) {
  return (
    <Pressable
      onPress={() => onPress(event.itemId)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${EVENT_LABEL[event.type]}, ${event.where}, ${clock(event.at)}`}
    >
      <ItemAvatar initial={event.initial} colorKey={event.colorKey} photoUri={event.photoUri} size={40} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>{event.name}</Text>
        <Text style={styles.rowWhere} numberOfLines={1}>
          {EVENT_LABEL[event.type]} · {event.where}
        </Text>
      </View>
      <Text style={styles.rowTime}>{clock(event.at)}</Text>
    </Pressable>
  );
}

const MemoRow = React.memo(Row);

export default function HistoryScreen() {
  const { items, closeHistory, openItem } = useDepo();
  const reduced = useReducedMotion();
  const [range, setRange] = useState<RangeKey>('all');

  // Minute buckets, same as the rest of the app: day labels never need finer
  // resolution, and this keeps the memos below stable between renders.
  const now = Math.floor(Date.now() / 60000) * 60000;

  // Deleted items take their history rows with them (deleteItemDb clears both
  // in one transaction), and items inside an open undo window are already
  // filtered out of `items` — so a row here can never point at a record that
  // no longer opens.
  const events = useMemo(() => buildEvents(items), [items]);

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
        out.push({ title: dayLabel(e.at, now), data: [] });
        lastKey = key;
      }
      out[out.length - 1].data.push(e);
    }
    return out;
  }, [events, range, now]);

  const onRowPress = useCallback((id: string) => openItem(id), [openItem]);

  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 8 }] });

  const header = (
    <View style={styles.listHeader}>
      <Text style={styles.title}>Geçmiş</Text>
      <Text style={styles.subtitle}>Eşyalarını nereye koyduğunun kaydı.</Text>
      {/* Kept mounted even when the filtered result is empty, so the user can
          always widen the range again. */}
      <View style={styles.chipRow}>
        {RANGES.map((r) => {
          const on = range === r.key;
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
              accessibilityLabel={r.label}
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, { color: on ? '#fff' : colors.neutralChipText }]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const empty = events.length === 0 ? (
    <EmptyState
      icon={<HistoryIcon size={26} color={colors.indigo} />}
      title="Henüz geçmiş yok."
      body="Eşyalarını kaydettikçe hareketlerini burada görebilirsin."
    />
  ) : (
    <EmptyState
      icon={<HistoryIcon size={26} color={colors.indigo} />}
      title="Bu aralıkta hareket yok."
      body="Daha geniş bir tarih aralığı seçebilirsin."
    />
  );

  return (
    <AnimatedSafeArea style={styles.root} edges={['top', 'bottom']} entering={entering}>
      <View style={styles.navBar}>
        <Pressable onPress={closeHistory} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(e) => e.key}
        renderItem={({ item }) => <MemoRow event={item} onPress={onRowPress} />}
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
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
