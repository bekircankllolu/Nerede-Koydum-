import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useDepo, type Screen } from '../state/DepoContext';
import { TabFindIcon, TabItemsIcon, TabLostIcon, TabSettingsIcon } from './icons';

const TABS: { key: Screen; label: string; Icon: typeof TabFindIcon }[] = [
  { key: 'find', label: 'Bul', Icon: TabFindIcon },
  { key: 'items', label: 'Eşyalar', Icon: TabItemsIcon },
  { key: 'lost', label: 'Kayıplar', Icon: TabLostIcon },
  { key: 'settings', label: 'Ayarlar', Icon: TabSettingsIcon },
];

export default function TabBar() {
  const { screen, nav, accent } = useDepo();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const on = screen === t.key;
        const color = on ? accent : '#9A968F';
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            onPress={() => nav({ screen: t.key, q: '' })}
            accessibilityRole="button"
            accessibilityLabel={t.label}
          >
            <t.Icon size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 15,
    paddingTop: 8, paddingHorizontal: 6,
    backgroundColor: 'rgba(247,245,240,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  tab: { flex: 1, alignItems: 'center', gap: 5, paddingTop: 6 },
  label: { fontWeight: '600', fontSize: 10 },
});
