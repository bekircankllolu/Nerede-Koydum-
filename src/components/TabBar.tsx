import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, motion, spacing, typography } from '../theme';
import { useDepo, type Screen } from '../state/DepoContext';
import { haptics } from '../lib/haptics';
import { TabFindIcon, TabItemsIcon, TabLostIcon, TabSettingsIcon } from './icons';

const TABS: { key: Screen; label: string; Icon: typeof TabFindIcon }[] = [
  { key: 'find', label: 'Bul', Icon: TabFindIcon },
  { key: 'items', label: 'Eşyalar', Icon: TabItemsIcon },
  { key: 'lost', label: 'Kayıplar', Icon: TabLostIcon },
  { key: 'settings', label: 'Ayarlar', Icon: TabSettingsIcon },
];

function Tab({
  label, Icon, active, accent, onPress,
}: {
  label: string;
  Icon: typeof TabFindIcon;
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  const p = useSharedValue(active ? 1 : 0);
  const reduced = useReducedMotion();

  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, { duration: motion.duration.fast });
  }, [active, p]);

  // Reduce Motion keeps the state change legible through opacity alone.
  const iconStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + p.value * 0.28,
    transform: reduced ? [] : [{ scale: 0.94 + p.value * 0.06 }],
  }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: p.value }));

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={iconStyle}>
        <Icon size={22} color={active ? accent : colors.tabInactive} />
      </Animated.View>
      <Text style={[styles.label, { color: active ? accent : colors.tabInactive }]} numberOfLines={1}>{label}</Text>
      <Animated.View style={[styles.dot, { backgroundColor: accent }, dotStyle]} />
    </Pressable>
  );
}

export default function TabBar() {
  const { screen, nav, accent } = useDepo();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map((t) => (
        <Tab
          key={t.key}
          label={t.label}
          Icon={t.Icon}
          active={screen === t.key}
          accent={accent}
          onPress={() => {
            if (screen !== t.key) haptics.selection();
            nav({ screen: t.key, q: '' });
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Solid translucent warm surface rather than a live BlurView — the blur
  // would cost a full-screen composite on every scroll frame behind it.
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 15,
    paddingTop: spacing.sm, paddingHorizontal: spacing.xs + 2,
    backgroundColor: 'rgba(247,245,240,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  tab: { flex: 1, alignItems: 'center', gap: spacing.xs + 1, paddingTop: spacing.xs + 2 },
  label: { ...typography.caption, fontSize: 10, lineHeight: 13 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});
