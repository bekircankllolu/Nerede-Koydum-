import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import type { Item } from '../db';
import { daysBetween } from '../lib/search';
import ItemRow from '../components/ItemRow';
import EmptyState from '../components/EmptyState';
import { PlusIcon } from '../components/icons';

function lostAgeLabel(item: Item, now: number) {
  const days = Math.max(0, daysBetween(item.lostAt || item.updatedAt, now));
  if (days === 0) return 'bugün kayıp';
  if (days === 1) return '1 gündür kayıp';
  return `${days} gündür kayıp`;
}

export default function LostItemsScreen() {
  const { lostItems, card, openLostForm, openItem } = useDepo();
  const now = Math.floor(Date.now() / 60000) * 60000;

  const keyExtractor = useCallback((it: Item) => it.id, []);

  const renderItem = useCallback<ListRenderItem<Item>>(({ item }) => {
    const c = card(item);
    return (
      <ItemRow
        id={item.id}
        initial={c.initial}
        name={c.name}
        subtitle={c.fullLoc}
        onPress={openItem}
        rightLabel={lostAgeLabel(item, now)}
        colorKey={c.colorKey}
        showChevron
      />
    );
  }, [card, openItem, now]);

  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>Kayıp Eşyalar</Text>
        <Text style={styles.subtitle}>Bulamadığın eşyaları burada takip et.</Text>
      </View>
      <Pressable
        onPress={openLostForm}
        style={({ pressed }) => [styles.reportBtn, pressed && styles.reportBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Kayıp bildir"
      >
        <PlusIcon size={14} />
        <Text style={styles.reportBtnText}>Kayıp bildir</Text>
      </Pressable>
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={lostItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          title="Harika, şu an kayıp eşyan yok."
          body="Bir şeyi bulamazsan burada takip edebilirsin."
          ctaLabel="Kayıp bildir"
          onPress={openLostForm}
        />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={false}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={7}
      updateCellsBatchingPeriod={50}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 100, gap: spacing.sm + 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.xs },
  headerText: { flex: 1 },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  subtitle: { ...typography.subheadline, color: colors.textSecondary, marginTop: spacing.xs },
  reportBtn: {
    marginTop: spacing.xs, height: 36, paddingHorizontal: spacing.lg - 2, borderRadius: radii.pill,
    backgroundColor: colors.indigo, flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2,
  },
  reportBtnPressed: { opacity: 0.85 },
  reportBtnText: { color: '#fff', ...typography.caption, fontSize: 13.5, lineHeight: 18 },
});
