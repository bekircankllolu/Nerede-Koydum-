import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { ITEM_COLOR_ORDER, ITEM_COLORS, type ItemColorKey } from '../lib/colors';

export default function ColorPicker({
  value, onChange,
}: {
  value: ItemColorKey;
  onChange: (key: ItemColorKey) => void;
}) {
  return (
    <View style={styles.row}>
      {ITEM_COLOR_ORDER.map((key) => {
        const def = ITEM_COLORS[key];
        const selected = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityLabel={`Renk seç: ${key}`}
            style={styles.touchTarget}
          >
            <View style={[styles.ring, selected && styles.ringSelected]}>
              <View style={[styles.swatch, { backgroundColor: def.strong }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  touchTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  ringSelected: { borderColor: colors.textPrimary },
  swatch: { width: 26, height: 26, borderRadius: 13 },
});
