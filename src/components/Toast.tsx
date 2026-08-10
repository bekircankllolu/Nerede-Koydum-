import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, useReducedMotion, FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, motion, radii, spacing, typography } from '../theme';
import { useDepo } from '../state/DepoContext';

export default function Toast() {
  const { toast } = useDepo();
  const reduced = useReducedMotion();
  if (!toast) return null;

  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 12 }] });

  return (
    <Animated.View
      style={styles.wrap}
      pointerEvents="box-none"
      entering={entering}
      exiting={FadeOut.duration(motion.duration.fast)}
    >
      <View style={styles.textCol} pointerEvents="none">
        <Text style={styles.title}>{toast.title}</Text>
        <Text style={styles.body}>{toast.body}</Text>
      </View>
      {toast.action ? (
        <Pressable
          onPress={toast.action.onPress}
          hitSlop={10}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={toast.action.label}
        >
          <Text style={styles.actionText}>{toast.action.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 104, zIndex: 80,
    backgroundColor: colors.toastBg, borderRadius: radii.lg - 2, padding: spacing.lg - 1,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
  },
  textCol: { flex: 1, gap: spacing.xs },
  title: { ...typography.callout, fontWeight: '600', fontSize: 15.5, color: '#fff' },
  body: { ...typography.footnote, color: 'rgba(255,255,255,0.68)' },
  actionBtn: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.xs },
  actionBtnPressed: { opacity: 0.7 },
  actionText: { ...typography.callout, fontWeight: '700', color: colors.swipeFavorite },
});
