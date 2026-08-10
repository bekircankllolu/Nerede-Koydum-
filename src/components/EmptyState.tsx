import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, controls, radii, spacing, typography } from '../theme';

export default function EmptyState({
  title, body, ctaLabel, onPress, icon,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
  /** Optional line icon, shown inside a soft circle above the title. */
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.iconCircle}>{icon}</View> : null}
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
  // A soft tinted circle rather than an illustration: no new asset, no new
  // dependency, and it stays quiet next to the copy.
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.indigoLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  title: { ...typography.title3, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.subheadline, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: spacing.md, height: controls.secondaryHeight - 4, paddingHorizontal: spacing.xxl - 2,
    borderRadius: radii.md, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: '#fff', ...typography.callout, fontWeight: '600' },
});
