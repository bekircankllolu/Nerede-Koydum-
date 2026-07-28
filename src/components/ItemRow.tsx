import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
};

export default function ItemRow({
  initial, name, subtitle, onPress, avatarSize = 48, favMark, rightLabel, showChevron,
}: Props) {
  return (
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
});
