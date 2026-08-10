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

// Apple Music model: the item card is a rigid, full-width layer that only
// ever translates — it never resizes, so its content (avatar/name/location/
// timestamp) never gets squeezed. The colored capsule lives in its own layer
// behind the card, hugging the row's outer edge, and grows as the card
// translates away from it.
const CAPSULE_MAX = 64; // capsule's "resting" size once normal-open
const ACTION_GAP = 8; // breathing room between the capsule and the card
// Distance at which the capsule reaches CAPSULE_MAX and 1:1 finger tracking
// gives way to resistance — the boundary between "normal swipe" and "full swipe".
const REVEAL_DISTANCE = CAPSULE_MAX + ACTION_GAP;
const RESISTANCE = 0.88; // damping applied to card/capsule growth beyond REVEAL_DISTANCE
const DIRECTION_ACTIVATION_DISTANCE = 10; // dead zone before a gesture's direction locks
const FULL_SWIPE_RATIO = 0.48; // committed-action threshold, fraction of row width
const MAX_RAW_RATIO = 0.85; // hard cap on raw finger travel, fraction of row width
const OPEN_SNAP_THRESHOLD = 40; // release-without-arming: snap open vs snap closed
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
  // Raw (direction-clamped) signed drag distance in px. Negative = favorite
  // side (left swipe), positive = delete side (right swipe).
  const x = useRef(new Animated.Value(0)).current;
  const restRef = useRef(0);
  const armedRef = useRef(false);
  const directionRef = useRef<'left' | 'right' | null>(null);
  const [rowWidth, setRowWidth] = useState(DEFAULT_ROW_WIDTH);

  const maxRaw = Math.max(REVEAL_DISTANCE + 60, rowWidth * MAX_RAW_RATIO);
  const fullThreshold = Math.max(REVEAL_DISTANCE + 30, rowWidth * FULL_SWIPE_RATIO);
  // How far the card has actually translated at maxRaw, after resistance.
  const maxEffective = REVEAL_DISTANCE + (maxRaw - REVEAL_DISTANCE) * RESISTANCE;

  // A gesture's direction, once locked, cannot flip sides mid-gesture — a
  // right-swipe-in-progress can shrink back toward 0 but must never cross
  // into favorite territory, and vice versa.
  function clampToDirection(raw: number, dir: 'left' | 'right' | null): number {
    let v = raw;
    if (dir === 'left') v = Math.min(0, v);
    else if (dir === 'right') v = Math.max(0, v);
    return Math.max(-maxRaw, Math.min(maxRaw, v));
  }

  function settleTo(target: number) {
    restRef.current = target;
    Animated.spring(x, {
      toValue: target,
      useNativeDriver: false,
      damping: 24,
      mass: 0.85,
      stiffness: 260,
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
      // finger must cancel the action.
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

  // The card's own width is never animated — it stays exactly rowWidth
  // (its natural flex-stretched size) for the entire gesture. Only its
  // translateX moves: 1:1 with the finger up to REVEAL_DISTANCE, then
  // resisted beyond it, exactly mirroring how far the capsule can grow.
  const cardTranslateX = x.interpolate({
    inputRange: [-maxRaw, -REVEAL_DISTANCE, 0, REVEAL_DISTANCE, maxRaw],
    outputRange: [-maxEffective, -REVEAL_DISTANCE, 0, REVEAL_DISTANCE, maxEffective],
    extrapolate: 'clamp',
  });

  // Capsule width = how far the card has receded, minus the fixed gap —
  // this keeps the capsule always exactly ACTION_GAP away from the card's
  // moving edge, whether in the 1:1 zone or the resisted full-swipe zone.
  const favPillWidth = x.interpolate({
    inputRange: [-maxRaw, -REVEAL_DISTANCE, -ACTION_GAP],
    outputRange: [maxEffective - ACTION_GAP, CAPSULE_MAX, 0],
    extrapolate: 'clamp',
  });
  const delPillWidth = x.interpolate({
    inputRange: [ACTION_GAP, REVEAL_DISTANCE, maxRaw],
    outputRange: [0, CAPSULE_MAX, maxEffective - ACTION_GAP],
    extrapolate: 'clamp',
  });

  const favIconOpacity = x.interpolate({
    inputRange: [-REVEAL_DISTANCE * 0.5, -ACTION_GAP],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const delIconOpacity = x.interpolate({
    inputRange: [ACTION_GAP, REVEAL_DISTANCE * 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // One continuous curve: starts small on reveal (0.85), settles at normal
  // size (1) once resting-open, then pulses up (1.1) once armed for commit.
  const favIconScale = x.interpolate({
    inputRange: [-fullThreshold, -fullThreshold * 0.85, -REVEAL_DISTANCE, -ACTION_GAP],
    outputRange: [1.1, 1, 1, 0.85],
    extrapolate: 'clamp',
  });
  const delIconScale = x.interpolate({
    inputRange: [ACTION_GAP, REVEAL_DISTANCE, fullThreshold * 0.85, fullThreshold],
    outputRange: [0.85, 1, 1, 1.1],
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
        <Animated.View style={{ transform: [{ translateX: cardTranslateX }] }}>
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
  // The capsule lives behind the (always full-width) card, hugging the
  // row's own outer edge — nothing ever needs to clip anything else.
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
