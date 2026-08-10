import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, FREE_ITEM_LIMIT } from '../theme';
import { useDepo, type FilterKey } from '../state/DepoContext';
import ItemRow from '../components/ItemRow';
import EmptyState from '../components/EmptyState';
import { IconButton } from '../components/common';
import { PlusIcon, CloseIcon } from '../components/icons';

function lightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function ItemsScreen() {
  const {
    storedItems, listed, filter, setFilter, filterDefs, card, isPro, accent,
    toggleFavById, deleteItemById, deleteItemByIdWithUndo, openAddForm,
    selectedLoc, locationOptions, locFilterOpen, openLocFilterSheet, closeLocFilterSheet, chooseLocFilter,
  } = useDepo();
  const countLabel = `${storedItems.length} eşya${isPro ? '' : ` · ücretsiz sınır ${FREE_ITEM_LIMIT}`}`;

  const onChipPress = (key: FilterKey) => {
    lightHaptic();
    if (key === 'loc') {
      openLocFilterSheet();
      return;
    }
    setFilter(key);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Eşyalar</Text>
          <Text style={styles.count}>{countLabel}</Text>
        </View>
        <IconButton onPress={openAddForm} bg={colors.indigo} accessibilityLabel="Yeni eşya ekle">
          <PlusIcon size={18} />
        </IconButton>
      </View>

      {storedItems.length === 0 ? (
        <EmptyState
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
                  style={[styles.chip, { backgroundColor: on ? accent : colors.neutralChip }]}
                >
                  <Text style={[styles.chipText, { color: on ? '#fff' : colors.neutralChipText }]} numberOfLines={1}>
                    {label}
                  </Text>
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
                  colorKey={c.colorKey}
                  isFav={it.fav}
                  onToggleFav={() => toggleFavById(it.id)}
                  onDeleteConfirm={() => deleteItemById(it.id)}
                  onFullSwipeDelete={() => deleteItemByIdWithUndo(it.id)}
                />
              );
            })}

            {listed.length === 0 ? (
              <Text style={styles.empty}>Bu filtrede kayıt yok.</Text>
            ) : null}
          </ScrollView>
        </>
      )}

      <Modal visible={locFilterOpen} transparent animationType="fade" onRequestClose={closeLocFilterSheet}>
        <Pressable style={styles.sheetScrim} onPress={closeLocFilterSheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Konuma göre filtrele</Text>
              <Pressable onPress={closeLocFilterSheet} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat">
                <CloseIcon />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {locationOptions.length === 0 ? (
                <Text style={styles.sheetEmpty}>Henüz konum bilgisi yok.</Text>
              ) : (
                locationOptions.map((loc) => (
                  <Pressable
                    key={loc}
                    onPress={() => {
                      lightHaptic();
                      chooseLocFilter(loc);
                    }}
                    style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: colors.hairline }]}
                  >
                    <Text style={[styles.sheetRowText, selectedLoc === loc && { color: colors.indigo, fontWeight: '700' }]}>
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
  root: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
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
  sheetScrim: { flex: 1, backgroundColor: colors.sheetScrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.appBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, maxHeight: '70%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontWeight: '700', fontSize: 18, color: colors.textPrimary },
  sheetEmpty: { fontSize: 14, color: colors.textTertiary, paddingVertical: 16 },
  sheetRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  sheetRowText: { fontSize: 16, color: colors.textPrimary },
});
