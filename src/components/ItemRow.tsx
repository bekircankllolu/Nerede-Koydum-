import React, { useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, radii } from '../theme';
import { ChevronRight } from './icons';

type Props = {
  initial: string;
  name: string;
  subtitle: string;
  onPress: () => void;
  avatarSize?: number;
  favMark?: string;
  rightLabel?: string;
  showChevron?: boolean;
  /** Swipe actions are enabled only when these are provided. */
  isFav?: boolean;
  onToggleFav?: () => void;
  onDelete?: () => void;
};

export default function ItemRow({
  initial, name, subtitle, onPress, avatarSize = 48, favMark, rightLabel, showChevron,
  isFav, onToggleFav, onDelete,
}: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const swipeEnabled = !!(onToggleFav || onDelete);

  const body = (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize === 44 ? 12 : 13 }]}>
        <Text style={[styles.avatarText, avatarSize === 44 && { fontSize: 17 }]}>{initial}</Text>
      </View>
      <View style={styles.textCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {!!favMark && <Text style={styles.fav}>{favMark}</Text>}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
      {showChevron ? <ChevronRight /> : null}
    </Pressable>
  );

  if (!swipeEnabled) {
    return <View style={styles.shadowWrap}>{body}</View>;
  }

  // Swiping the row left reveals the right-hand panel (favourite);
  // swiping it right reveals the left-hand panel (delete).
  const renderFavAction = () => (
    <View style={[styles.action, styles.actionFav]}>
      <Text style={styles.actionText}>{isFav ? '☆' : '★'}</Text>
      <Text style={styles.actionLabel}>{isFav ? 'Çıkar' : 'Favori'}</Text>
    </View>
  );

  const renderDeleteAction = () => (
    <View style={[styles.action, styles.actionDelete]}>
      <Text style={styles.actionText}>🗑</Text>
      <Text style={styles.actionLabel}>Sil</Text>
    </View>
  );

  const handleOpen = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      swipeRef.current?.close();
      onToggleFav?.();
      return;
    }
    Alert.alert(
      'Bu kaydı silmek istediğine emin misin?',
      `${name} kalıcı olarak silinecek.`,
      [
        { text: 'Vazgeç', style: 'cancel', onPress: () => swipeRef.current?.close() },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            onDelete?.();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.shadowWrap}>
      <Swipeable
        ref={swipeRef}
        containerStyle={styles.clip}
        friction={2}
        leftThreshold={64}
        rightThreshold={64}
        overshootLeft={false}
        overshootRight={false}
        renderRightActions={onToggleFav ? renderFavAction : undefined}
        renderLeftActions={onDelete ? renderDeleteAction : undefined}
        onSwipeableOpen={handleOpen}
      >
        {body}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  clip: { borderRadius: radii.md, overflow: 'hidden' },
  row: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  rowPressed: { backgroundColor: '#FBFAF7' },
  avatar: {
    backgroundColor: colors.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: colors.indigo, fontWeight: '700', fontSize: 18 },
  textCol: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontWeight: '600', fontSize: 16, color: colors.textPrimary, flexShrink: 1 },
  fav: { color: colors.favorite, fontWeight: '600', fontSize: 12 },
  subtitle: { fontSize: 13, color: colors.textSecondary },
  rightLabel: { fontSize: 11.5, color: colors.textTertiary, flexShrink: 0 },
  action: { width: 88, alignItems: 'center', justifyContent: 'center', gap: 3 },
  actionFav: { backgroundColor: colors.favorite },
  actionDelete: { backgroundColor: colors.danger },
  actionText: { color: '#fff', fontSize: 18 },
  actionLabel: { color: '#fff', fontWeight: '600', fontSize: 12.5 },
});
