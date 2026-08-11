import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { itemColor, type ItemColorKey } from '../lib/colors';

type Props = {
  initial: string;
  colorKey?: ItemColorKey;
  /** Stored photo, if any. Anything that fails to load falls back silently. */
  photoUri?: string | null;
  size?: number;
};

/**
 * The square slot at the head of every item row: a cropped photo when there
 * is one, the coloured initial otherwise.
 *
 * Deliberately no filesystem check here — this renders inside virtualized
 * lists, and a synchronous `File.exists` per row per render would show up as
 * scroll jank. A missing file simply fails to decode and `onError` swaps in
 * the letter, which is the same end state for the user.
 */
function ItemAvatar({ initial, colorKey = 'indigo', photoUri, size = 48 }: Props) {
  // Remembering *which* URI failed (rather than a boolean) means a newly
  // picked photo automatically gets a fresh attempt, with no effect needed
  // to reset the flag when the prop changes.
  const [brokenUri, setBrokenUri] = useState<string | null>(null);

  const color = itemColor(colorKey);
  // Ratios chosen to reproduce the existing hand-tuned values exactly:
  // 48 -> radius 13 / text 18, 44 -> radius 12 / text 17.
  const radius = Math.round(size * 0.27);
  const fontSize = Math.round(size * 0.38);
  const box = { width: size, height: size, borderRadius: radius };

  if (photoUri && brokenUri !== photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[styles.base, box, styles.photo]}
        resizeMode="cover"
        onError={() => setBrokenUri(photoUri)}
        // The row already announces the item's name; the thumbnail carries no
        // information a screen reader would need on top of that.
        accessible={false}
      />
    );
  }

  return (
    <View style={[styles.base, box, { backgroundColor: color.soft }]}>
      <Text style={[styles.text, { fontSize, color: color.strong }]}>{initial}</Text>
    </View>
  );
}

// Purely presentational and driven by primitives, so it never re-renders
// while an unrelated row changes.
export default React.memo(ItemAvatar);

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // Same neutral fill the detail screen uses, so a photo that is still
  // decoding shows a calm block rather than a flash of nothing.
  photo: { backgroundColor: colors.photoPlaceholderBg },
  text: { fontWeight: '700' },
});
