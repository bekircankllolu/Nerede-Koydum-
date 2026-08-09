import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';
import { MicIcon } from './icons';

export function IconButton({
  onPress, children, size = 44, bg = colors.card, accessibilityLabel, style,
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
}: {
  label: string; onPress: () => void; bg?: string; disabled?: boolean; style?: ViewStyle; textColor?: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: bg, opacity: pressed && !disabled ? 0.9 : 1 },
        style,
      ]}
    >
      <Text style={[styles.primaryBtnText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryBtn, pressed && { backgroundColor: '#E7E3D8' }, style]}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
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
    height: 54, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontWeight: '600', fontSize: 17 },
  secondaryBtn: {
    height: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.neutralChip,
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 16, color: colors.textPrimary },
  micBtn: {
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: colors.indigo, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  spinnerWrap: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
});
