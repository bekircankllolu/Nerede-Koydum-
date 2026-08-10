import React, { useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PanGestureHandler, State,
  type PanGestureHandlerGestureEvent, type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, radii } from '../theme';
import { itemColor, type ItemColorKey } from '../lib/colors';
import { ChevronRight, StarIcon, TrashIcon } from './icons';
import StatusBadge from './StatusBadge';

type Props = {
  initial: string;
  name: string;
  subtitle: string;
  onPress: () => void;
  avatarSize?: number;
  favMark?: string;
  rightLabel?: string;
  showChevron?: boolean;
  colorKey?: ItemColorKey;
  lost?: boolean;
  /** Swipe actions are enabled only when at least one of these is provided. */
  isFav?: boolean;
  onToggleFav?: () => void;
  /** Normal swipe + tap on the pill: shows the existing confirm Alert. */
  onDeleteConfirm?: () => void;
  /** Full swipe past the commit threshold: immediate + undoable, no Alert. */
  onFullSwipeDelete?: () => void;
};

const ACTION_WIDTH = 64;
const ACTION_GAP = 8;
// Distance at which the pill is fully sized (64) and the card stops
// shrinking further — the boundary between "normal swipe" and "full swipe".
const REVEAL_DISTANCE = ACTION_WIDTH + ACTION_GAP;
// Release-time decision: past this (but not armed) -> snap open; under -> snap closed.
const OPEN_SNAP_THRESHOLD = 40;
// Dead zone before a gesture's direction (favorite vs delete) locks in.
const DIRECTION_ACTIVATION_DISTANCE = 10;
const FULL_SWIPE_RATIO = 0.5;
const MAX_OPEN_RATIO = 0.72;
const DEFAULT_ROW_WIDTH = 320;

// Only one row's swipe may be open at a time, tracked by a stable per-row
// identity token so a row never mistakes its own re-render for "another row".
const openRow: { current: { id: object; close: () => void } | null } = { current: null };

export default function ItemRow({
  initial, name, subtitle, onPress, avatarSize = 48, favMark, rightLabel, showChevron,
  colorKey = 'indigo', lost, isFav, onToggleFav, onDeleteConfirm, onFullSwipeDelete,
}: Props) {
  const swipeEnabled = !!(onToggleFav || onDeleteConfirm || onFullSwipeDelete);
  const canDelete = !!(onDeleteConfirm || onFullSwipeDelete);
  const color = itemColor(colorKey);

  const rowId = useRef({}).current;
  const x = useRef(new Animated.Value(0)).current;
  const restRef = useRef(0);
  const armedRef = useRef(false);
  const directionRef = useRef<'left' | 'right' | null>(null);
  const [rowWidth, setRowWidth] = useState(DEFAULT_ROW_WIDTH);

  const maxOpen = Math.max(REVEAL_DISTANCE + 20, rowWidth * MAX_OPEN_RATIO);
  const fullThreshold = Math.max(REVEAL_DISTANCE + 40, rowWidth * FULL_SWIPE_RATIO);
  const openCardWidth = Math.max(rowWidth * 0.4, rowWidth - REVEAL_DISTANCE);

  // A gesture's direction, once locked, cannot flip sides mid-gesture — a
  // right-swipe-in-progress can shrink back toward 0 but must never cross
  // into favorite territory, and vice versa (test cases H/I in the spec).
  function clampToDirection(raw: number, dir: 'left' | 'right' | null): number {
    let v = raw;
    if (dir === 'left') v = Math.min(0, v);
    else if (dir === 'right') v = Math.max(0, v);
    return Math.max(-maxOpen, Math.min(maxOpen, v));
  }

  function settleTo(target: number) {
    restRef.current = target;
    Animated.spring(x, {
      toValue: target,
      useNativeDriver: false,
      damping: 22,
      mass: 0.5,
      stiffness: 320,
      overshootClamping: true,
    }).start();
    if (target === 0) {
      if (openRow.current && openRow.current.id === rowId) openRow.current = null;
    } else {
      openRow.current = { id: rowId, close: () => settleTo(0) };
    }
  }

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    const raw = restRef.current + translationX;
    if (directionRef.current === null) {
      if (raw <= -DIRECTION_ACTIVATION_DISTANCE && onToggleFav) directionRef.current = 'left';
      else if (raw >= DIRECTION_ACTIVATION_DISTANCE && canDelete) directionRef.current = 'right';
    }
    const next = clampToDirection(raw, directionRef.current);
    x.setValue(next);

    // Crossing the full-swipe threshold only "arms" the gesture — it must
    // NOT run any business logic yet. That only happens at release (below).
    const isArmed = (next <= -fullThreshold && !!onToggleFav) || (next >= fullThreshold && canDelete);
    if (isArmed && !armedRef.current) {
      armedRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (!isArmed && armedRef.current) {
      armedRef.current = false;
    }
  };

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX } = event.nativeEvent;
    if (state === State.BEGAN) {
      x.stopAnimation();
      directionRef.current = null;
      armedRef.current = false;
      if (openRow.current && openRow.current.id !== rowId) {
        openRow.current.close();
      }
      return;
    }
    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      const raw = restRef.current + translationX;
      const finalValue = clampToDirection(raw, directionRef.current);
      const wasArmed = armedRef.current;
      armedRef.current = false;
      directionRef.current = null;

      // The decision uses the value AT RELEASE, not "was it ever armed" —
      // dragging past the threshold and back below it before lifting the
      // finger must cancel the action (test case D/G).
      if (wasArmed && finalValue <= -fullThreshold && onToggleFav) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onToggleFav();
        settleTo(0);
        return;
      }
      if (wasArmed && finalValue >= fullThreshold && canDelete) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        settleTo(0);
        if (onFullSwipeDelete) onFullSwipeDelete();
        else onDeleteConfirm?.();
        return;
      }
      const target = finalValue <= -OPEN_SNAP_THRESHOLD && onToggleFav
        ? -REVEAL_DISTANCE
        : finalValue >= OPEN_SNAP_THRESHOLD && canDelete
          ? REVEAL_DISTANCE
          : 0;
      settleTo(target);
    }
  };

  const onCardPress = () => {
    if (restRef.current !== 0) {
      settleTo(0);
      return;
    }
    onPress();
  };

  const handleFavTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    settleTo(0);
    onToggleFav?.();
  };

  const handleDeleteTap = () => {
    Alert.alert(
      'Bu kaydı silmek istediğine emin misin?',
      `${name} kalıcı olarak silinecek.`,
      [
        { text: 'Vazgeç', style: 'cancel', onPress: () => settleTo(0) },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            settleTo(0);
            onDeleteConfirm?.();
          },
        },
      ]
    );
  };

  const body = (
    <Pressable
      onPress={swipeEnabled ? onCardPress : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View
        style={[
          styles.avatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize === 44 ? 12 : 13, backgroundColor: color.soft },
        ]}
      >
        <Text style={[styles.avatarText, avatarSize === 44 && { fontSize: 17 }, { color: color.strong }]}>{initial}</Text>
      </View>
      <View style={styles.textCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {!!favMark && <Text style={styles.fav}>{favMark}</Text>}
          {lost ? <StatusBadge /> : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      {rightLabel ? <Text style={styles.rightLabel} numberOfLines={1}>{rightLabel}</Text> : null}
      {showChevron ? <ChevronRight /> : null}
    </Pressable>
  );

  if (!swipeEnabled) {
    return body;
  }

  // Phase 1 (0 -> REVEAL_DISTANCE): card shrinks from full width down to
  // openCardWidth while the pill reveals — this is the only phase where the
  // card's own content width changes.
  // Phase 2 (beyond REVEAL_DISTANCE): the card's width is pinned at
  // openCardWidth — extra drag only translates the (now rigid) card further
  // and grows the pill, so item text/avatar/timestamp never get squeezed.
  const cardWidth = x.interpolate({
    inputRange: [-maxOpen, -REVEAL_DISTANCE, 0, REVEAL_DISTANCE, maxOpen],
    outputRange: [openCardWidth, openCardWidth, rowWidth, openCardWidth, openCardWidth],
    extrapolate: 'clamp',
  });
  const cardTranslateX = x.interpolate({
    inputRange: [-maxOpen, -REVEAL_DISTANCE, 0, REVEAL_DISTANCE, maxOpen],
    outputRange: [-(maxOpen - REVEAL_DISTANCE), 0, 0, REVEAL_DISTANCE, maxOpen],
    extrapolate: 'clamp',
  });

  const favPillWidth = x.interpolate({
    inputRange: [-maxOpen, -ACTION_GAP],
    outputRange: [maxOpen - ACTION_GAP, 0],
    extrapolate: 'clamp',
  });
  const delPillWidth = x.interpolate({
    inputRange: [ACTION_GAP, maxOpen],
    outputRange: [0, maxOpen - ACTION_GAP],
    extrapolate: 'clamp',
  });
  const favIconOpacity = x.interpolate({
    inputRange: [-ACTION_WIDTH, -ACTION_WIDTH * 0.35],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const delIconOpacity = x.interpolate({
    inputRange: [ACTION_WIDTH * 0.35, ACTION_WIDTH],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const favIconScale = x.interpolate({
    inputRange: [-fullThreshold, -fullThreshold * 0.85],
    outputRange: [1.15, 1],
    extrapolate: 'clamp',
  });
  const delIconScale = x.interpolate({
    inputRange: [fullThreshold * 0.85, fullThreshold],
    outputRange: [1, 1.15],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={styles.rowWrap}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - rowWidth) > 0.5) setRowWidth(w);
      }}
    >
      {onToggleFav ? (
        <Animated.View style={[styles.pillSlot, styles.pillSlotRight, { width: favPillWidth }]}>
          <Pressable
            onPress={handleFavTap}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Favorilerden çıkar' : 'Favoriye ekle'}
            style={[styles.actionPill, { backgroundColor: colors.swipeFavorite }]}
          >
            <Animated.View style={{ opacity: favIconOpacity, transform: [{ scale: favIconScale }] }}>
              <StarIcon size={22} color="#fff" filled={!!isFav} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}

      {canDelete ? (
        <Animated.View style={[styles.pillSlot, styles.pillSlotLeft, { width: delPillWidth }]}>
          <Pressable
            onPress={handleDeleteTap}
            accessibilityRole="button"
            accessibilityLabel="Kaydı sil"
            style={[styles.actionPill, { backgroundColor: colors.swipeDelete }]}
          >
            <Animated.View style={{ opacity: delIconOpacity, transform: [{ scale: delIconScale }] }}>
              <TrashIcon size={22} color="#fff" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}

      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-8, 8]}
      >
        <Animated.View style={{ width: cardWidth, transform: [{ translateX: cardTranslateX }] }}>
          {body}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: { position: 'relative' },
  row: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  rowPressed: { backgroundColor: '#FBFAF7' },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontWeight: '700', fontSize: 18 },
  textCol: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontWeight: '600', fontSize: 16, color: colors.textPrimary, flexShrink: 1 },
  fav: { color: colors.favorite, fontWeight: '600', fontSize: 12 },
  subtitle: { fontSize: 13, color: colors.textSecondary },
  rightLabel: { fontSize: 11.5, color: colors.textTertiary, flexShrink: 0 },
  // Card and pills never overlap by construction — the card's own width
  // shrinks only up to REVEAL_DISTANCE, then stays fixed; a growing pill
  // never has to hide behind it, and nothing needs to be clipped.
  pillSlot: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  pillSlotRight: { right: 0 },
  pillSlotLeft: { left: 0 },
  actionPill: {
    flex: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
