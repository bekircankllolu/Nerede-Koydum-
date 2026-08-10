import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, controls, radii, spacing, typography } from '../theme';

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
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 40, alignItems: 'center', paddingHorizontal: spacing.xxl, gap: spacing.sm },
  title: { ...typography.title3, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.subheadline, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: spacing.md, height: controls.secondaryHeight - 4, paddingHorizontal: spacing.xxl - 2,
    borderRadius: radii.md, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', ...typography.callout, fontWeight: '600' },
});
