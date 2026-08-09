import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

export default function EmptyState({
  title, body, ctaLabel, onPress,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onPress ? (
        <Pressable style={styles.cta} onPress={onPress} accessibilityRole="button" accessibilityLabel={ctaLabel}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 40, alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  title: { fontWeight: '700', fontSize: 18, color: colors.textPrimary, textAlign: 'center' },
  body: { fontSize: 14.5, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: 12, height: 48, paddingHorizontal: 22, borderRadius: radii.md,
    backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
