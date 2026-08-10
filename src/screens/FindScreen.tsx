import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, controls, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { daysBetween } from '../lib/search';
import { PrimaryButton, MicButton } from '../components/common';
import ItemRow from '../components/ItemRow';
import StatusBadge from '../components/StatusBadge';
import { CloseIcon, PlusIcon, SearchIcon } from '../components/icons';

export default function FindScreen() {
  const {
    q, setQ, results, card, startVoice, recent, goItems, openAddForm, openLostForm, createFromQuery,
    toggleFavById, deleteItemById, deleteItemByIdWithUndo, openItem,
  } = useDepo();

  const now = Date.now();
  const hasQuery = q.trim().length > 0;
  const best = results.length ? results[0] : null;
  const others = results.length > 1 ? results.slice(1, 4) : [];
  const noResults = hasQuery && results.length === 0;
  const bestLost = best?.status === 'lost';

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
              <View style={styles.bestLabelRow}>
                <Text style={styles.bestLabel}>En iyi sonuç</Text>
                {bestLost ? <StatusBadge /> : null}
              </View>
              <Text style={styles.bestName}>{best.name}</Text>
              {bestLost ? <Text style={styles.bestSubLabel}>Son görüldüğü yer</Text> : null}
              <View style={{ gap: 2 }}>
                {(best.loc ? best.loc.split(' / ') : ['Konum bilinmiyor']).map((line, i) => (
                  <Text key={i} style={styles.bestLine}>{line}</Text>
                ))}
              </View>
              {bestLost ? (
                <Text style={styles.bestLostLine}>
                  {best.lostAt ? `${Math.max(0, daysBetween(best.lostAt, now))} gündür kayıp` : 'Kayıp'}
                </Text>
              ) : (
                <Text style={styles.bestConfirmed}>{card(best).ago} doğrulandı.</Text>
              )}
              <PrimaryButton label="Kaydı aç" onPress={() => card(best).open()} style={{ marginTop: 2 }} />
            </View>
          ) : null}

          {others.length ? (
            <View style={{ marginTop: 22, gap: 10 }}>
              <Text style={styles.sectionLabel}>Diğer sonuçlar</Text>
              {others.map((it) => {
                const c = card(it);
                return (
                  <ItemRow
                    key={it.id}
                    id={it.id}
                    initial={c.initial}
                    name={c.name}
                    subtitle={c.shortLoc}
                    onPress={openItem}
                    avatarSize={44}
                    showChevron
                    colorKey={c.colorKey}
                    lost={c.lost}
                  />
                );
              })}
            </View>
          ) : null}

          {noResults ? (
            <View style={styles.noResultsCard}>
              <Text style={styles.noResultsTitle}>Bunu henüz kaydetmemişsin.</Text>
              <Text style={styles.noResultsBody}>Aradığın: “{q.trim()}”</Text>
              <Pressable style={styles.noResultsCta} onPress={createFromQuery}>
                <Text style={styles.noResultsCtaText}>“{q.trim()}” eşya olarak kaydet</Text>
              </Pressable>
              <Pressable style={styles.noResultsLostCta} onPress={openLostForm}>
                <Text style={styles.noResultsLostCtaText}>Kayıp mı? Kayıp bildir</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.quickAdd}>
            <Text style={styles.quickAddTitle}>Bir şeyi yerine mi koydun?</Text>
            <Text style={styles.quickAddBody}>Şimdi kaydet, sonra arama.</Text>
            <Pressable
              style={({ pressed }) => [styles.quickAddBtn, pressed && styles.pressed]}
              onPress={openAddForm}
            >
              <PlusIcon />
              <Text style={styles.quickAddBtnText}>Yeni eşya ekle</Text>
            </Pressable>
          </View>

          <Pressable style={styles.lostLink} onPress={openLostForm}>
            <Text style={styles.lostLinkText}>Bir şey mi kaybettin? Kayıp bildir</Text>
          </Pressable>

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
                <ItemRow
                  key={it.id}
                  id={it.id}
                  initial={c.initial}
                  name={c.name}
                  subtitle={c.shortLoc}
                  onPress={openItem}
                  rightLabel={c.ago}
                  showFavMark={c.fav}
                  colorKey={c.colorKey}
                  lost={c.lost}
                  isFav={c.fav}
                  onToggleFav={toggleFavById}
                  onDeleteConfirm={deleteItemById}
                  onFullSwipeDelete={deleteItemByIdWithUndo}
                />
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
  pressed: { opacity: 0.9 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 100 },
  title: { ...typography.largeTitle, color: colors.textPrimary, marginBottom: spacing.lg + 2 },
  searchRow: { flexDirection: 'row', gap: spacing.sm + 2, alignItems: 'center' },
  // The search row is the primary interaction on the app's home screen, so
  // this is one of the few surfaces that earns real elevation.
  searchBox: {
    ...surfaces.raised,
    flex: 1, height: controls.fieldHeight,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, ...typography.headline, fontWeight: '400', color: colors.textPrimary, padding: 0 },
  bestCard: { ...surfaces.hero, padding: spacing.xxl - 2, gap: spacing.lg },
  bestLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bestLabel: { ...typography.overline, color: colors.accent, textTransform: 'uppercase' },
  bestName: { ...typography.title1, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  bestSubLabel: { ...typography.overline, color: colors.textSecondary, textTransform: 'uppercase', marginTop: -10 },
  bestLine: { ...typography.title3, fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  bestConfirmed: { ...typography.footnote, color: colors.textSecondary },
  bestLostLine: { ...typography.footnote, color: colors.lost, fontWeight: '600' },
  sectionLabel: { ...typography.footnote, fontWeight: '600', color: colors.textSecondary, paddingLeft: spacing.xs },
  noResultsCard: {
    ...surfaces.card, borderRadius: radii.xl,
    padding: spacing.xxl - 2, paddingVertical: spacing.xxl + 2, gap: spacing.md + 2,
  },
  noResultsTitle: { ...typography.title3, color: colors.textPrimary },
  noResultsBody: { ...typography.callout, fontWeight: '400', color: colors.textSecondary },
  noResultsCta: {
    height: controls.secondaryHeight, borderRadius: radii.md, backgroundColor: colors.indigoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  noResultsCtaText: { ...typography.bodyStrong, color: colors.indigo },
  noResultsLostCta: { alignSelf: 'center', paddingVertical: spacing.xs },
  noResultsLostCtaText: { ...typography.footnote, color: colors.lost, fontWeight: '500' },
  quickAdd: {
    marginTop: spacing.xl, borderRadius: radii.xl, backgroundColor: colors.indigoLight,
    padding: spacing.xxl - 2, gap: spacing.xs + 2,
  },
  quickAddTitle: { ...typography.title3, color: colors.textPrimary },
  quickAddBody: { ...typography.callout, fontWeight: '400', color: colors.indigo },
  quickAddBtn: {
    marginTop: spacing.md + 2, height: controls.secondaryHeight, borderRadius: radii.md,
    backgroundColor: colors.indigo,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  quickAddBtnText: { color: '#fff', ...typography.bodyStrong },
  // Deliberately quieter than the primary add CTA above it.
  lostLink: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.xs },
  lostLinkText: { ...typography.footnote, color: colors.textSecondary, fontWeight: '500' },
  recentHeader: {
    marginTop: spacing.xxl - 2, flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', paddingHorizontal: spacing.xs,
  },
  recentAll: { ...typography.footnote, color: colors.indigo, fontWeight: '500' },
});
