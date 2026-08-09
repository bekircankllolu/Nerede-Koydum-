import React, { useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, radii } from '../theme';
import { itemColor, type ItemColorKey } from '../lib/colors';
import { ChevronRight, StarIcon, TrashIcon } from './icons';
import StatusBadge from './StatusBadge';

// Only one row's swipe actions may be open at a time.
const openSwipeRef: { current: Swipeable | null } = { current: null };

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
  /** Swipe actions are enabled only when these are provided. */
  isFav?: boolean;
  onToggleFav?: () => void;
  onDelete?: () => void;
};

const ACTION_WIDTH = 64;
const ACTION_GAP = 8;

export default function ItemRow({
  initial, name, subtitle, onPress, avatarSize = 48, favMark, rightLabel, showChevron,
  colorKey = 'indigo', lost, isFav, onToggleFav, onDelete,
}: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const swipeEnabled = !!(onToggleFav || onDelete);
  const color = itemColor(colorKey);

  const close = () => swipeRef.current?.close();

  const body = (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
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

  const handleFavPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    close();
    onToggleFav?.();
  };

  const handleDeletePress = () => {
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
            onDelete?.();
          },
        },
      ]
    );
  };

  const renderFavAction = () => (
    <View style={[styles.actionSlot, styles.actionSlotRight]}>
      <Pressable
        onPress={handleFavPress}
        accessibilityRole="button"
        accessibilityLabel={isFav ? 'Favorilerden çıkar' : 'Favoriye ekle'}
        style={[styles.actionPill, { backgroundColor: colors.swipeFavorite }]}
      >
        <StarIcon size={22} color="#fff" filled={!!isFav} />
      </Pressable>
    </View>
  );

  const renderDeleteAction = () => (
    <View style={[styles.actionSlot, styles.actionSlotLeft]}>
      <Pressable
        onPress={handleDeletePress}
        accessibilityRole="button"
        accessibilityLabel="Kaydı sil"
        style={[styles.actionPill, { backgroundColor: colors.swipeDelete }]}
      >
        <TrashIcon size={22} color="#fff" />
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={onToggleFav ? renderFavAction : undefined}
      renderLeftActions={onDelete ? renderDeleteAction : undefined}
      onSwipeableWillOpen={() => {
        if (openSwipeRef.current && openSwipeRef.current !== swipeRef.current) {
          openSwipeRef.current.close();
        }
        openSwipeRef.current = swipeRef.current;
      }}
    >
      {body}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
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
  // Slot reserves the swipe-travel width; the pill inside sits with an 8px
  // gap from the card and keeps its own independent rounded corners —
  // nothing clips it, unlike the old shared-container design.
  actionSlot: { width: ACTION_WIDTH + ACTION_GAP, justifyContent: 'center' },
  actionSlotRight: { alignItems: 'flex-end', paddingLeft: ACTION_GAP },
  actionSlotLeft: { alignItems: 'flex-start', paddingRight: ACTION_GAP },
  actionPill: {
    width: ACTION_WIDTH,
    alignSelf: 'stretch',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
