import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import ItemRow from '../components/ItemRow';

export default function ItemsScreen() {
  const {
    items, listed, filter, setFilter, filterDefs, card, isPro, accent,
    toggleFavById, deleteItemById,
  } = useDepo();
  const countLabel = `${items.length} eşya${isPro ? '' : ` · ücretsiz sınır ${FREE_ITEM_LIMIT}`}`;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Eşyalar</Text>
        <Text style={styles.count}>{countLabel}</Text>
      </View>

      {/* flexGrow:0 keeps this horizontal strip from expanding to fill the
          column, and alignItems:'center' stops the chips stretching tall. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
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
            <ItemRow
              key={it.id}
              initial={c.initial}
              name={c.name}
              subtitle={c.fullLoc}
              onPress={c.open}
              favMark={c.favMark}
              showChevron
              isFav={it.fav}
              onToggleFav={() => toggleFavById(it.id)}
              onDelete={() => deleteItemById(it.id)}
            />
          );
        })}

        {listed.length === 0 ? (
          <Text style={styles.empty}>Bu filtrede kayıt yok.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 12 },
  title: { fontWeight: '700', fontSize: 30, letterSpacing: -0.7, color: colors.textPrimary, marginBottom: 4 },
  count: { fontSize: 14, color: colors.textSecondary },
  filterScroll: { flexGrow: 0, flexShrink: 0, marginTop: 16 },
  filterRow: { gap: 8, alignItems: 'center', paddingVertical: 2 },
  chip: {
    height: 34, paddingHorizontal: 14, borderRadius: radii.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontWeight: '600', fontSize: 13.5 },
  list: { marginTop: 14, gap: 10, paddingBottom: 100 },
  empty: { marginTop: 24, textAlign: 'center', fontSize: 14, color: colors.textTertiary },
});
