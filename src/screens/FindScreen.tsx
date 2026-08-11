import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, controls, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import { daysBetween } from '../lib/search';
import { isUnknownLocation } from '../lib/location';
import { PrimaryButton, MicButton } from '../components/common';
import ItemRow from '../components/ItemRow';
import StatusBadge from '../components/StatusBadge';
import { CloseIcon, PlusIcon, SearchIcon } from '../components/icons';

export default function FindScreen() {
  const {
    q, setQ, results, card, startVoice, recent, goItems, openAddForm, openLostForm, createFromQuery,
    toggleFavById, deleteItemById, deleteItemByIdWithUndo, openItem,
  } = useDepo();
  const { t } = useI18n();

  const now = Date.now();
  const hasQuery = q.trim().length > 0;
  const best = results.length ? results[0] : null;
  const others = results.length > 1 ? results.slice(1, 4) : [];
  const noResults = hasQuery && results.length === 0;
  const bestLost = best?.status === 'lost';
  // The breadcrumb is the user's own text, so it is shown verbatim; only the
  // "no location saved" placeholder comes from the translation layer.
  const bestLines = !best
    ? []
    : isUnknownLocation(best.loc)
      ? [t('common.unknownLocation')]
      : best.loc.split(' / ');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('find.title')}</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('find.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
          />
          {hasQuery ? (
            <Pressable
              onPress={() => setQ('')}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel={t('find.clearSearchA11y')}
            >
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
                <Text style={styles.bestLabel}>{t('find.bestResult')}</Text>
                {bestLost ? <StatusBadge /> : null}
              </View>
              <Text style={styles.bestName}>{best.name}</Text>
              {bestLost ? <Text style={styles.bestSubLabel}>{t('find.lastSeen')}</Text> : null}
              <View style={{ gap: 2 }}>
                {bestLines.map((line, i) => (
                  <Text key={i} style={styles.bestLine}>{line}</Text>
                ))}
              </View>
              {bestLost ? (
                <Text style={styles.bestLostLine}>
                  {best.lostAt
                    ? t('detail.lostDays', { count: Math.max(0, daysBetween(best.lostAt, now)) })
                    : t('find.lostFallback')}
                </Text>
              ) : (
                <Text style={styles.bestConfirmed}>{t('find.confirmedAgo', { ago: card(best).ago })}</Text>
              )}
              <PrimaryButton label={t('find.openRecord')} onPress={() => card(best).open()} style={{ marginTop: 2 }} />
            </View>
          ) : null}

          {others.length ? (
            <View style={{ marginTop: 22, gap: 10 }}>
              <Text style={styles.sectionLabel}>{t('find.otherResults')}</Text>
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
                    photoUri={c.photoUri}
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
              <Text style={styles.noResultsTitle}>{t('find.noResultsTitle')}</Text>
              <Text style={styles.noResultsBody}>{t('find.noResultsBody', { query: q.trim() })}</Text>
              <Pressable style={styles.noResultsCta} onPress={createFromQuery}>
                <Text style={styles.noResultsCtaText} numberOfLines={2}>
                  {t('find.noResultsCta', { query: q.trim() })}
                </Text>
              </Pressable>
              <Pressable
                style={styles.noResultsLostCta}
                onPress={openLostForm}
                hitSlop={9}
                accessibilityRole="button"
                accessibilityLabel={t('find.reportLostA11y')}
              >
                <Text style={styles.noResultsLostCtaText}>{t('find.noResultsLostCta')}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.quickAdd}>
            <Text style={styles.quickAddTitle}>{t('find.quickAddTitle')}</Text>
            <Text style={styles.quickAddBody}>{t('find.quickAddBody')}</Text>
            <Pressable
              style={({ pressed }) => [styles.quickAddBtn, pressed && styles.pressed]}
              onPress={openAddForm}
            >
              <PlusIcon />
              <Text style={styles.quickAddBtnText} numberOfLines={1}>{t('find.quickAddCta')}</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.lostLink}
            onPress={openLostForm}
            hitSlop={9}
            accessibilityRole="button"
            accessibilityLabel={t('find.reportLostA11y')}
          >
            <Text style={styles.lostLinkText}>{t('find.lostLink')}</Text>
          </Pressable>

          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>{t('find.recentTitle')}</Text>
            {/* 13pt text is ~18pt tall; 13 of slop on each side clears 44pt
                without moving the baseline it is aligned to. */}
            <Pressable onPress={goItems} hitSlop={13} accessibilityRole="button" accessibilityLabel={t('find.seeAllA11y')}>
              <Text style={styles.recentAll}>{t('find.seeAll')}</Text>
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
                  photoUri={c.photoUri}
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
  // Small glyph, full-height tap target: the icon stays visually light but
  // is comfortably hittable.
  clearBtn: {
    width: controls.iconButton, height: '100%',
    alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm,
  },
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
  noResultsBody: { ...typography.subheadline, color: colors.textTertiary },
  noResultsCta: {
    height: controls.secondaryHeight, borderRadius: radii.md, backgroundColor: colors.indigoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  noResultsCtaText: { ...typography.bodyStrong, color: colors.indigo },
  noResultsLostCta: { alignSelf: 'center', paddingVertical: spacing.xs },
  noResultsLostCtaText: { ...typography.footnote, color: colors.lost, fontWeight: '500' },
  quickAdd: {
    marginTop: spacing.xl, borderRadius: radii.xl, backgroundColor: colors.indigoLight,
    padding: spacing.xl, gap: spacing.xs,
  },
  quickAddTitle: { ...typography.title3, color: colors.textPrimary },
  quickAddBody: { ...typography.callout, fontWeight: '400', color: colors.indigo },
  quickAddBtn: {
    marginTop: spacing.md, height: controls.secondaryHeight, borderRadius: radii.md,
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
