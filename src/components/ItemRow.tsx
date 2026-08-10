import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, interpolate, runOnJS, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, surfaces, typography } from '../theme';
import { itemColor, type ItemColorKey } from '../lib/colors';
import { ChevronRight, StarIcon, TrashIcon } from './icons';
import StatusBadge from './StatusBadge';

// Callbacks take the row's id rather than closing over it, so screens can
// pass referentially stable handlers and the React.memo below actually
// holds while a long list scrolls.
type Props = {
  id: string;
  initial: string;
  name: string;
  subtitle: string;
  onPress: (id: string) => void;
  avatarSize?: number;
  /** Passive favourite marker on the row (not the swipe action). */
  showFavMark?: boolean;
  rightLabel?: string;
  showChevron?: boolean;
  colorKey?: ItemColorKey;
  lost?: boolean;
  /** Swipe actions are enabled only when at least one of these is provided. */
  isFav?: boolean;
  onToggleFav?: (id: string) => void;
  /** Normal swipe + tap on the capsule: shows the existing confirm Alert. */
  onDeleteConfirm?: (id: string) => void;
  /** Full swipe past the commit threshold: immediate + undoable, no Alert. */
  onFullSwipeDelete?: (id: string) => void;
};

// Apple Music model: the card is a rigid, full-width layer that only ever
// translates — its width is never animated, so its content can't be squeezed.
// The coloured capsule sits behind it, hugging the row's outer edge, and
// grows as the card travels away from it.
const CAPSULE_REST_WIDTH = 64;
const ACTION_GAP = 8;
const REVEAL_DISTANCE = CAPSULE_REST_WIDTH + ACTION_GAP; // 1:1 finger tracking up to here
const RESISTANCE = 0.86; // applied to travel beyond REVEAL_DISTANCE
const DIRECTION_ACTIVATION_DISTANCE = 12; // dead zone before a gesture picks a side
const OPEN_SNAP_THRESHOLD = 42; // release without arming: snap open vs closed
const FULL_SWIPE_RATIO = 0.48; // commit threshold, fraction of row width (raw distance)
const MAX_RAW_RATIO = 0.85; // hard cap on raw finger travel
const ARMED_ICON_SCALE = 1.1;

const SPRING = { damping: 26, stiffness: 280, mass: 0.9, overshootClamping: true } as const;
/** Capsule fold-away after a committed full-swipe delete. */
const COLLAPSE_DURATION = 200;
/** Height/opacity collapse, once the capsule has visibly folded away. */
const REMOVE_DURATION = 170;

// Distance mapping. Past REVEAL_DISTANCE the card resists the finger, so
// `raw` (physical finger travel, what thresholds are judged on) and
// `effective` (what actually gets rendered) diverge.
function toEffective(raw: number): number {
  'worklet';
  const a = Math.abs(raw);
  if (a <= REVEAL_DISTANCE) return raw;
  return Math.sign(raw) * (REVEAL_DISTANCE + (a - REVEAL_DISTANCE) * RESISTANCE);
}

function toRaw(effective: number): number {
  'worklet';
  const a = Math.abs(effective);
  if (a <= REVEAL_DISTANCE) return effective;
  return Math.sign(effective) * (REVEAL_DISTANCE + (a - REVEAL_DISTANCE) / RESISTANCE);
}

// Only one row may sit in the resting-open state at a time.
const openRow: { current: { id: object; close: () => void } | null } = { current: null };

function ItemRow({
  id, initial, name, subtitle, onPress, avatarSize = 48, showFavMark, rightLabel, showChevron,
  colorKey = 'indigo', lost, isFav, onToggleFav, onDeleteConfirm, onFullSwipeDelete,
}: Props) {
  const swipeEnabled = !!(onToggleFav || onDeleteConfirm || onFullSwipeDelete);
  const canDelete = !!(onDeleteConfirm || onFullSwipeDelete);
  const color = itemColor(colorKey);

  const rowId = useRef({}).current;
  const [removing, setRemoving] = useState(false);

  // All gesture state lives on the UI thread — no React state per frame.
  const tx = useSharedValue(0); // effective translation, what the card renders at
  const dir = useSharedValue(0); // -1 favourite, +1 delete, 0 undecided
  const armed = useSharedValue(0);
  const armedBoost = useSharedValue(1);
  const startRaw = useSharedValue(0); // raw distance the current gesture began from
  const rowW = useSharedValue(0);
  const rowH = useSharedValue(0);
  const removeP = useSharedValue(1); // 1 = present, 0 = collapsed away
  const locked = useSharedValue(0); // set once an action is committing

  const close = useCallback(() => {
    tx.value = withSpring(0, SPRING);
    if (openRow.current && openRow.current.id === rowId) openRow.current = null;
  }, [rowId, tx]);

  const registerOpen = useCallback(() => {
    openRow.current = { id: rowId, close };
  }, [rowId, close]);

  const closeOthers = useCallback(() => {
    if (openRow.current && openRow.current.id !== rowId) openRow.current.close();
  }, [rowId]);

  const clearOpen = useCallback(() => {
    if (openRow.current && openRow.current.id === rowId) openRow.current = null;
  }, [rowId]);

  const hapticArm = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const commitFavorite = useCallback(() => {
    // The row stays mounted, so the collapse keeps playing while the star
    // fills in — no perceived delay.
    clearOpen();
    onToggleFav?.(id);
  }, [clearOpen, onToggleFav, id]);

  const startFullDelete = useCallback(() => {
    clearOpen();
    setRemoving(true);
  }, [clearOpen]);

  const finishFullDelete = useCallback(() => {
    if (onFullSwipeDelete) onFullSwipeDelete(id);
    else onDeleteConfirm?.(id);
  }, [onFullSwipeDelete, onDeleteConfirm, id]);

  const pan = Gesture.Pan()
    .enabled(swipeEnabled && !removing)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      if (locked.value) return;
      // Take over whatever the spring was doing at its current visible
      // position, so an interrupted animation never jumps.
      cancelAnimation(tx);
      startRaw.value = toRaw(tx.value);
      // A row that is already open stays locked to the side it's open on —
      // dragging back toward centre closes it rather than flipping sides.
      dir.value = tx.value < 0 ? -1 : tx.value > 0 ? 1 : 0;
      armed.value = 0;
      armedBoost.value = withSpring(1, SPRING);
    })
    .onUpdate((e) => {
      if (locked.value) return;
      const w = rowW.value;
      const maxRaw = Math.max(REVEAL_DISTANCE + 60, w * MAX_RAW_RATIO);
      const fullRaw = Math.max(REVEAL_DISTANCE + 30, w * FULL_SWIPE_RATIO);

      // Direction is picked from THIS gesture's travel only, never from the
      // resting offset, and once picked it cannot flip mid-gesture.
      if (dir.value === 0) {
        if (e.translationX <= -DIRECTION_ACTIVATION_DISTANCE && onToggleFav) dir.value = -1;
        else if (e.translationX >= DIRECTION_ACTIVATION_DISTANCE && canDelete) dir.value = 1;
        else return;
      }

      let raw = startRaw.value + e.translationX;
      raw = dir.value < 0 ? Math.min(0, raw) : Math.max(0, raw);
      raw = Math.max(-maxRaw, Math.min(maxRaw, raw));
      tx.value = toEffective(raw);

      // Crossing the threshold only arms the gesture; nothing commits until
      // the finger lifts.
      const shouldArm = Math.abs(raw) >= fullRaw ? 1 : 0;
      if (shouldArm !== armed.value) {
        armed.value = shouldArm;
        armedBoost.value = withSpring(shouldArm ? ARMED_ICON_SCALE : 1, SPRING);
        if (shouldArm) runOnJS(hapticArm)(); // one haptic per transition only
      }
    })
    .onEnd(() => {
      if (locked.value) return;
      const w = rowW.value;
      const fullRaw = Math.max(REVEAL_DISTANCE + 30, w * FULL_SWIPE_RATIO);
      const raw = toRaw(tx.value);
      const wasArmed = armed.value === 1;
      const d = dir.value;

      armed.value = 0;
      armedBoost.value = withSpring(1, SPRING);
      dir.value = 0;

      if (wasArmed && d < 0 && -raw >= fullRaw && onToggleFav) {
        locked.value = 1;
        tx.value = withSpring(0, SPRING, () => {
          locked.value = 0;
        });
        runOnJS(commitFavorite)();
        return;
      }

      if (wasArmed && d > 0 && raw >= fullRaw && canDelete) {
        locked.value = 1;
        runOnJS(startFullDelete)();
        // Sequence: the capsule visibly folds away first, and only then does
        // the row collapse and the item actually leave the list. A committed
        // action uses a timed curve rather than a spring so the whole
        // sequence stays snappy and predictable.
        tx.value = withTiming(0, { duration: COLLAPSE_DURATION }, (finished) => {
          if (!finished) return;
          removeP.value = withTiming(0, { duration: REMOVE_DURATION }, (done) => {
            if (done) runOnJS(finishFullDelete)();
          });
        });
        return;
      }

      const target = raw <= -OPEN_SNAP_THRESHOLD && onToggleFav
        ? -REVEAL_DISTANCE
        : raw >= OPEN_SNAP_THRESHOLD && canDelete
          ? REVEAL_DISTANCE
          : 0;
      tx.value = withSpring(target, SPRING);
      if (target === 0) runOnJS(clearOpen)();
      else runOnJS(registerOpen)();
    })
    .onTouchesDown(() => {
      runOnJS(closeOthers)();
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const wrapStyle = useAnimatedStyle(() => {
    // maxHeight (not height) so the row keeps its natural size until the
    // removal animation actually runs, and stays unconstrained while idle
    // so content can never be clamped to a stale measurement.
    const h = rowH.value > 0 ? rowH.value : 1000;
    return {
      maxHeight: removeP.value === 1 ? 1000 : h * removeP.value,
      opacity: removeP.value,
    };
  });

  const favCapsuleStyle = useAnimatedStyle(() => ({
    width: Math.max(0, -tx.value - ACTION_GAP),
  }));
  const delCapsuleStyle = useAnimatedStyle(() => ({
    width: Math.max(0, tx.value - ACTION_GAP),
  }));

  const favIconStyle = useAnimatedStyle(() => {
    const a = -tx.value;
    return {
      opacity: interpolate(a, [ACTION_GAP, REVEAL_DISTANCE * 0.5], [0, 1], Extrapolation.CLAMP),
      transform: [{
        scale: interpolate(a, [ACTION_GAP, REVEAL_DISTANCE], [0.85, 1], Extrapolation.CLAMP) * armedBoost.value,
      }],
    };
  });
  const delIconStyle = useAnimatedStyle(() => {
    const a = tx.value;
    return {
      opacity: interpolate(a, [ACTION_GAP, REVEAL_DISTANCE * 0.5], [0, 1], Extrapolation.CLAMP),
      transform: [{
        scale: interpolate(a, [ACTION_GAP, REVEAL_DISTANCE], [0.85, 1], Extrapolation.CLAMP) * armedBoost.value,
      }],
    };
  });

  // A tap on an open row closes it instead of navigating.
  const onCardPress = () => {
    if (tx.value !== 0) {
      close();
      return;
    }
    onPress(id);
  };

  const onPlainPress = () => onPress(id);

  const handleFavTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    close();
    onToggleFav?.(id);
  };

  const handleDeleteTap = () => {
    Alert.alert(
      'Bu kaydı silmek istediğine emin misin?',
      `${name} kalıcı olarak silinecek.`,
      [
        { text: 'Vazgeç', style: 'cancel', onPress: close },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            close();
            onDeleteConfirm?.(id);
          },
        },
      ]
    );
  };

  const body = (
    <Pressable
      onPress={swipeEnabled ? onCardPress : onPlainPress}
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
          {showFavMark ? <StarIcon size={13} color={colors.favorite} filled /> : null}
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

  return (
    <Animated.View
      style={[styles.rowWrap, wrapStyle]}
      pointerEvents={removing ? 'none' : 'auto'}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0) rowW.value = width;
        if (height > 0 && removeP.value === 1) rowH.value = height;
      }}
    >
      {onToggleFav ? (
        <Animated.View style={[styles.capsuleSlot, styles.capsuleSlotRight, favCapsuleStyle]}>
          <Pressable
            onPress={handleFavTap}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Favorilerden çıkar' : 'Favoriye ekle'}
            style={[styles.capsule, { backgroundColor: colors.swipeFavorite }]}
          >
            <Animated.View style={favIconStyle}>
              <StarIcon size={22} color="#fff" filled={!!isFav} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}

      {canDelete ? (
        <Animated.View style={[styles.capsuleSlot, styles.capsuleSlotLeft, delCapsuleStyle]}>
          <Pressable
            onPress={handleDeleteTap}
            accessibilityRole="button"
            accessibilityLabel="Kaydı sil"
            style={[styles.capsule, { backgroundColor: colors.swipeDelete }]}
          >
            <Animated.View style={delIconStyle}>
              <TrashIcon size={22} color="#fff" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>{body}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// Every prop is a primitive or a stable id-based callback, so this bails out
// of re-rendering unrelated rows when one item changes.
export default React.memo(ItemRow);

const styles = StyleSheet.create({
  rowWrap: { position: 'relative' },
  // No shadow here on purpose: a list of shadowed cards is both visually
  // noisy and the most expensive thing to composite while scrolling. A
  // hairline against the warm background separates it just as well.
  row: {
    ...surfaces.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowPressed: { backgroundColor: colors.cardPressed },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontWeight: '700', fontSize: 18 },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  name: { ...typography.bodyStrong, color: colors.textPrimary, flexShrink: 1 },
  subtitle: { ...typography.footnote, color: colors.textSecondary },
  rightLabel: { ...typography.caption, color: colors.textTertiary, flexShrink: 0 },
  // The capsule lives behind the (always full-width) card, pinned to the
  // row's own outer edge, so nothing ever has to clip anything else.
  capsuleSlot: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  capsuleSlotRight: { right: 0, alignItems: 'flex-end' },
  capsuleSlotLeft: { left: 0, alignItems: 'flex-start' },
  capsule: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
