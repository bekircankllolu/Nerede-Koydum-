import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslateFn } from '../i18n/I18nProvider';
import type { Item } from '../db';
import { daysBetween } from '../lib/search';
import ItemRow from '../components/ItemRow';
import EmptyState from '../components/EmptyState';
import { PlusIcon, TabLostIcon } from '../components/icons';

function lostAgeLabel(item: Item, now: number, t: TranslateFn) {
  const days = Math.max(0, daysBetween(item.lostAt || item.updatedAt, now));
  if (days === 0) return t('lost.ageToday');
  return t('lost.ageDays', { count: days });
}

export default function LostItemsScreen() {
  const { lostItems, card, openLostForm, openItem } = useDepo();
  const { t } = useI18n();
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
        photoUri={c.photoUri}
        rightLabel={lostAgeLabel(item, now, t)}
        rightLabelColor={colors.lost}
        colorKey={c.colorKey}
        showChevron
      />
    );
  }, [card, openItem, now, t]);

  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{t('lost.title')}</Text>
        <Text style={styles.subtitle}>{t('lost.subtitle')}</Text>
      </View>
      <Pressable
        onPress={openLostForm}
        // 36pt pill + 4 of slop top and bottom = 44pt, with the header's
        // alignment left exactly as it was.
        hitSlop={{ top: 4, bottom: 4 }}
        style={({ pressed }) => [styles.reportBtn, pressed && styles.reportBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('lost.report')}
      >
        <PlusIcon size={14} />
        <Text style={styles.reportBtnText} numberOfLines={1}>{t('lost.report')}</Text>
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
          icon={<TabLostIcon size={26} color={colors.indigo} />}
          title={t('lost.emptyTitle')}
          body={t('lost.emptyBody')}
          ctaLabel={t('lost.report')}
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
