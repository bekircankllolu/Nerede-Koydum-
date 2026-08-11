import React, { useCallback } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { colors, radii, spacing, typography, FREE_ITEM_LIMIT } from '../theme';
import { useDepo, type FilterKey } from '../state/DepoContext';
import type { Item } from '../db';
import { haptics } from '../lib/haptics';
import ItemRow from '../components/ItemRow';
import EmptyState from '../components/EmptyState';
import { IconButton } from '../components/common';
import { PlusIcon, CloseIcon, HistoryIcon, TabItemsIcon } from '../components/icons';

export default function ItemsScreen() {
  const {
    storedItems, listed, filter, setFilter, filterDefs, card, isPro, accent,
    openItem, toggleFavById, deleteItemById, deleteItemByIdWithUndo, openAddForm,
    selectedLoc, locationOptions, locFilterOpen, openLocFilterSheet, closeLocFilterSheet, chooseLocFilter,
    openHistory,
  } = useDepo();
  // Free users get the limit inline rather than as a trailing sentence:
  // "8 / 20 eşya" reads in a glance where the old copy did not.
  const countLabel = isPro
    ? `${storedItems.length} eşya`
    : `${storedItems.length} / ${FREE_ITEM_LIMIT} eşya`;

  const onChipPress = (key: FilterKey) => {
    haptics.light();
    if (key === 'loc') {
      openLocFilterSheet();
      return;
    }
    setFilter(key);
  };

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
        photoUri={c.photoUri}
        showFavMark={c.fav}
        showChevron
        colorKey={c.colorKey}
        isFav={c.fav}
        onToggleFav={toggleFavById}
        onDeleteConfirm={deleteItemById}
        onFullSwipeDelete={deleteItemByIdWithUndo}
      />
    );
  }, [card, openItem, toggleFavById, deleteItemById, deleteItemByIdWithUndo]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Eşyalar</Text>
          <Text style={styles.count}>{countLabel}</Text>
        </View>
        {/* Both are the shared 44pt icon button. The history one stays on the
            calm card surface so the indigo add button remains the single
            primary action in this header. */}
        <View style={styles.headerActions}>
          <IconButton
            onPress={openHistory}
            bg={colors.card}
            style={styles.historyBtn}
            accessibilityLabel="Geçmişi aç"
          >
            <HistoryIcon size={19} color={colors.textSecondary} />
          </IconButton>
          <IconButton onPress={openAddForm} bg={colors.indigo} accessibilityLabel="Yeni eşya ekle">
            <PlusIcon size={18} />
          </IconButton>
        </View>
      </View>

      {storedItems.length === 0 ? (
        <EmptyState
          icon={<TabItemsIcon size={26} color={colors.indigo} />}
          title="Henüz eşya eklemedin."
          body="İlk eşyanı kaydet, sonra aramak zorunda kalma."
          ctaLabel="İlk eşyamı ekle"
          onPress={openAddForm}
        />
      ) : (
        <>
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
              const label = f.key === 'loc' && on && selectedLoc ? `Konum · ${selectedLoc}` : f.label;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => onChipPress(f.key)}
                  // Vertical only: horizontal slop would overlap the
                  // neighbouring chip, which sits just 8pt away.
                  hitSlop={{ top: 5, bottom: 5 }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: on ? accent : colors.neutralChip, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.chipText, { color: on ? '#fff' : colors.neutralChipText }]} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* removeClippedSubviews stays off: a swiped row translates beyond
              its own bounds, and clipping would cut the action capsule. */}
          <FlatList
            data={listed}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>Bu filtrede kayıt yok.</Text>}
          />
        </>
      )}

      <Modal visible={locFilterOpen} transparent animationType="fade" onRequestClose={closeLocFilterSheet}>
        <Pressable style={styles.sheetScrim} onPress={closeLocFilterSheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Konuma göre filtrele</Text>
              {/* The glyph is 17pt, so 14 of slop on each side clears 44pt
                  while leaving the header's alignment untouched. */}
              <Pressable onPress={closeLocFilterSheet} hitSlop={14} accessibilityRole="button" accessibilityLabel="Kapat">
                <CloseIcon />
              </Pressable>
            </View>
            <ScrollView style={styles.sheetScroll}>
              {locationOptions.length === 0 ? (
                <Text style={styles.sheetEmpty}>Henüz konum bilgisi yok.</Text>
              ) : (
                locationOptions.map((loc) => (
                  <Pressable
                    key={loc}
                    onPress={() => {
                      haptics.light();
                      chooseLocFilter(loc);
                    }}
                    style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
                  >
                    <Text style={[styles.sheetRowText, selectedLoc === loc && styles.sheetRowTextOn]}>
                      {loc}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl },
  header: { paddingTop: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // A hairline keeps the white button legible against the warm background
  // without adding a shadow to the header.
  historyBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairlineStrong },
  title: { ...typography.largeTitle, color: colors.textPrimary, marginBottom: spacing.xs },
  count: { ...typography.subheadline, color: colors.textSecondary },
  filterScroll: { flexGrow: 0, flexShrink: 0, marginTop: spacing.lg },
  filterRow: { gap: spacing.sm, alignItems: 'center', paddingVertical: 2 },
  chip: {
    height: 34, paddingHorizontal: spacing.lg - 2, borderRadius: radii.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { ...typography.caption, fontSize: 13.5, lineHeight: 18 },
  list: { flex: 1, marginTop: spacing.md },
  listContent: { gap: spacing.sm + 2, paddingTop: 2, paddingBottom: 100 },
  empty: { marginTop: spacing.xxl, textAlign: 'center', ...typography.subheadline, color: colors.textTertiary },
  sheetScrim: { flex: 1, backgroundColor: colors.sheetScrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.appBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl, maxHeight: '70%',
  },
  sheetScroll: { maxHeight: 360 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md,
  },
  sheetTitle: { ...typography.title3, color: colors.textPrimary },
  sheetEmpty: { ...typography.subheadline, color: colors.textTertiary, paddingVertical: spacing.lg },
  sheetRow: {
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  sheetRowPressed: { backgroundColor: colors.hairline },
  sheetRowText: { ...typography.body, color: colors.textPrimary },
  sheetRowTextOn: { color: colors.indigo, fontWeight: '700' },
});
