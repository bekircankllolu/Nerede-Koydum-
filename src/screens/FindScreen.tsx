import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii } from '../theme';
import { useCekmece } from '../state/CekmeceContext';
import { PrimaryButton, MicButton } from '../components/common';
import ItemRow from '../components/ItemRow';
import { CloseIcon, PlusIcon, SearchIcon } from '../components/icons';

export default function FindScreen() {
  const { q, setQ, results, card, startVoice, recent, goItems, openAdd, createFromQuery } = useCekmece();

  const hasQuery = q.trim().length > 0;
  const best = results.length ? results[0] : null;
  const others = results.length > 1 ? results.slice(1, 4) : [];
  const noResults = hasQuery && results.length === 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Neyi arıyorsun?</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Pasaport, anahtar, şarj aleti…"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
          />
          {hasQuery ? (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <CloseIcon size={16} />
            </Pressable>
          ) : null}
        </View>
        <MicButton onPress={() => startVoice('search')} />
      </View>

      {hasQuery ? (
        <View style={{ marginTop: 22 }}>
          {best ? (
            <View style={styles.bestCard}>
              <Text style={styles.bestLabel}>En iyi sonuç</Text>
              <Text style={styles.bestName}>{best.name}</Text>
              <View style={{ gap: 2 }}>
                {best.loc.split(' / ').map((line, i) => (
                  <Text key={i} style={styles.bestLine}>{line}</Text>
                ))}
              </View>
              <Text style={styles.bestConfirmed}>{card(best).ago} doğrulandı.</Text>
              <PrimaryButton label="Kaydı aç" onPress={() => card(best).open()} style={{ marginTop: 2 }} />
            </View>
          ) : null}

          {others.length ? (
            <View style={{ marginTop: 22, gap: 10 }}>
              <Text style={styles.sectionLabel}>Diğer sonuçlar</Text>
              {others.map((it) => {
                const c = card(it);
                return (
                  <ItemRow key={it.id} initial={c.initial} name={c.name} subtitle={c.shortLoc} onPress={c.open} avatarSize={44} showChevron />
                );
              })}
            </View>
          ) : null}

          {noResults ? (
            <View style={styles.noResultsCard}>
              <Text style={styles.noResultsTitle}>Bunu henüz kaydetmemişsin.</Text>
              <Text style={styles.noResultsBody}>Aradığın: “{q.trim()}”</Text>
              <Pressable style={styles.noResultsCta} onPress={createFromQuery}>
                <Text style={styles.noResultsCtaText}>“{q.trim()}” kaydı oluştur</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.quickAdd}>
            <Text style={styles.quickAddTitle}>Bir şeyi yerine mi koydun?</Text>
            <Text style={styles.quickAddBody}>Şimdi kaydet, sonra arama.</Text>
            <Pressable style={styles.quickAddBtn} onPress={openAdd}>
              <PlusIcon />
              <Text style={styles.quickAddBtnText}>Yeni eşya ekle</Text>
            </Pressable>
          </View>

          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>Son kayıtlar</Text>
            <Pressable onPress={goItems}>
              <Text style={styles.recentAll}>Tümü</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 10, gap: 10 }}>
            {recent.map((it) => {
              const c = card(it);
              return (
                <ItemRow key={it.id} initial={c.initial} name={c.name} subtitle={c.shortLoc} onPress={c.open} rightLabel={c.ago} />
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  title: { fontWeight: '700', fontSize: 30, letterSpacing: -0.7, color: colors.textPrimary, marginVertical: 10, marginBottom: 18 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: {
    flex: 1, height: 56, borderRadius: radii.md, backgroundColor: colors.card,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  searchInput: { flex: 1, fontSize: 17, color: colors.textPrimary, padding: 0 },
  bestCard: {
    borderRadius: radii.xl, backgroundColor: colors.card, padding: 22, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 2 },
  },
  bestLabel: { fontWeight: '600', fontSize: 12, color: colors.accent, letterSpacing: 0.6, textTransform: 'uppercase' },
  bestName: { fontWeight: '700', fontSize: 24, letterSpacing: -0.4, color: colors.textPrimary },
  bestLine: { fontWeight: '600', fontSize: 20, lineHeight: 27, color: colors.textPrimary },
  bestConfirmed: { fontSize: 13, color: colors.textSecondary },
  sectionLabel: { fontWeight: '600', fontSize: 13, color: colors.textSecondary, paddingLeft: 4 },
  noResultsCard: {
    borderRadius: radii.xl, backgroundColor: colors.card, padding: 22, paddingVertical: 26, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  noResultsTitle: { fontWeight: '600', fontSize: 19, color: colors.textPrimary },
  noResultsBody: { fontSize: 15, color: colors.textSecondary },
  noResultsCta: {
    height: 52, borderRadius: radii.md, backgroundColor: colors.indigoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  noResultsCtaText: { color: colors.indigo, fontWeight: '600', fontSize: 16 },
  quickAdd: { marginTop: 20, borderRadius: radii.xl, backgroundColor: colors.indigoLight, padding: 22, gap: 6 },
  quickAddTitle: { fontWeight: '600', fontSize: 19, color: colors.textPrimary },
  quickAddBody: { fontSize: 15, color: colors.indigo },
  quickAddBtn: {
    marginTop: 14, height: 52, borderRadius: radii.md, backgroundColor: colors.indigo,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  quickAddBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  recentHeader: { marginTop: 26, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 },
  recentAll: { fontWeight: '500', fontSize: 13, color: colors.indigo },
});
