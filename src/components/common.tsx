import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, controls, radii, typography } from '../theme';
import { MicIcon } from './icons';

export function IconButton({
  onPress, children, size = controls.iconButton, bg = colors.card, accessibilityLabel, style,
}: {
  onPress: () => void; children: React.ReactNode; size?: number; bg?: string;
  accessibilityLabel: string; style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function PrimaryButton({
  label, onPress, bg = colors.indigo, disabled, style, textColor = '#fff',
  loading, accessibilityLabel,
}: {
  label: string; onPress: () => void; bg?: string; disabled?: boolean; style?: ViewStyle;
  textColor?: string; loading?: boolean; accessibilityLabel?: string;
}) {
  const blocked = disabled || loading;
  return (
    <Pressable
      onPress={blocked ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: bg, opacity: pressed && !blocked ? 0.9 : 1 },
        pressed && !blocked && styles.pressedScale,
        style,
      ]}
    >
      {/* The spinner sits beside a fixed label rather than replacing it, so
          the button never changes width mid-save. */}
      {loading ? <ActivityIndicator color={textColor} style={styles.btnSpinner} /> : null}
      <Text style={[styles.primaryBtnText, { color: textColor }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label, onPress, style, textColor, accessibilityLabel,
}: {
  label: string; onPress: () => void; style?: ViewStyle;
  textColor?: string; accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.secondaryBtn,
        pressed && styles.secondaryBtnPressed,
        pressed && styles.pressedScale,
        style,
      ]}
    >
      {/* textColor exists so callers that override the background (e.g. the
          emphasised stale-confirm action) can keep the label readable. */}
      <Text
        style={[styles.secondaryBtnText, textColor ? { color: textColor } : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function MicButton({ onPress, size = 56, small }: { onPress: () => void; size?: number; small?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.micBtn,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: small ? colors.indigoLight : colors.indigo,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <MicIcon size={small ? 19 : 21} color={small ? colors.indigo : '#fff'} />
    </Pressable>
  );
}

export function Spinner() {
  return (
    <View style={styles.spinnerWrap}>
      <ActivityIndicator color={colors.indigo} />
    </View>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    height: controls.primaryHeight, borderRadius: radii.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnSpinner: { marginRight: 8 },
  primaryBtnText: { ...typography.headline },
  secondaryBtn: {
    height: controls.secondaryHeight, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.neutralChip,
  },
  secondaryBtnText: { ...typography.bodyStrong, color: colors.textPrimary },
  // Deliberately no coloured glow — the mic is part of the search row, not a
  // floating neon button.
  micBtn: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  spinnerWrap: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  secondaryBtnPressed: { backgroundColor: colors.neutralChipPressed },
  /** Shared press feel: a barely-there settle rather than a bounce. */
  pressedScale: { transform: [{ scale: 0.99 }] },
});
