import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, FREE_ITEM_LIMIT } from '../theme';
import { useKoydum } from '../state/KoydumContext';
import ItemRow from '../components/ItemRow';

export default function ItemsScreen() {
  const { items, listed, filter, setFilter, filterDefs, card, isPro, accent } = useKoydum();
  const countLabel = `${items.length} eşya${isPro ? '' : ` · ücretsiz sınır ${FREE_ITEM_LIMIT}`}`;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Eşyalar</Text>
        <Text style={styles.count}>{countLabel}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterDefs.map((f) => {
          const on = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, { backgroundColor: on ? accent : colors.neutralChip }]}
            >
              <Text style={[styles.chipText, { color: on ? '#fff' : colors.neutralChipText }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.list}>
        {listed.map((it) => {
          const c = card(it);
          return (
            <ItemRow key={it.id} initial={c.initial} name={c.name} subtitle={c.fullLoc} onPress={c.open} favMark={c.favMark} showChevron />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 20 },
  title: { fontWeight: '700', fontSize: 30, letterSpacing: -0.7, color: colors.textPrimary, marginBottom: 4 },
  count: { fontSize: 14, color: colors.textSecondary },
  filterRow: { gap: 8, marginTop: 18, paddingBottom: 4 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radii.sm },
  chipText: { fontWeight: '600', fontSize: 13.5 },
  list: { marginTop: 16, gap: 10, paddingBottom: 100 },
});
