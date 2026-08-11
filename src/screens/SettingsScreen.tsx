import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, controls, radii, spacing, surfaces, typography, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { LanguagePreference, TranslationKey } from '../i18n';
import { haptics } from '../lib/haptics';
import { CheckIcon, ChevronRight, CloseIcon } from '../components/icons';

type Row = { label: string; value: string; onPress?: () => void; danger?: boolean };

const LANGUAGE_OPTIONS: { key: LanguagePreference; labelKey: TranslationKey }[] = [
  { key: 'auto', labelKey: 'settings.languageAuto' },
  { key: 'tr', labelKey: 'settings.languageTr' },
  { key: 'en', labelKey: 'settings.languageEn' },
];

function RowsCard({ rows }: { rows: Row[] }) {
  return (
    <View style={styles.rowsCard}>
      {rows.map((r, i) => {
        const isLast = i === rows.length - 1;
        const content = (
          <>
            <Text style={[styles.rowLabel, r.danger && { color: colors.danger }]} numberOfLines={2}>
              {r.label}
            </Text>
            <View style={styles.rowRight}>
              {r.value ? <Text style={styles.rowValue} numberOfLines={1}>{r.value}</Text> : null}
              {r.onPress && !r.danger ? <ChevronRight size={15} /> : null}
            </View>
          </>
        );

        if (!r.onPress) {
          return (
            <View key={r.label} style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
              {content}
            </View>
          );
        }

        return (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            style={({ pressed }) => [
              styles.row,
              isLast && { borderBottomWidth: 0 },
              pressed && { backgroundColor: colors.hairline },
            ]}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ label, rows }: { label?: string; rows: Row[] }) {
  return (
    <View style={styles.section}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <RowsCard rows={rows} />
    </View>
  );
}

export default function SettingsScreen() {
  const {
    isPro, openPaywall, restorePro, restoring, openPrivacy, openHelp, exportCsv, deleteAllData, items,
  } = useDepo();
  const { t, languagePreference, setLanguagePreference, preferenceLoaded } = useI18n();
  const [langSheetOpen, setLangSheetOpen] = useState(false);

  const onDeleteAll = () => {
    if (items.length === 0) {
      Alert.alert(t('settings.deleteAllNothingTitle'), t('settings.deleteAllNothingBody'));
      return;
    }
    Alert.alert(
      t('settings.deleteAllConfirmTitle'),
      t('settings.deleteAllConfirmBody', { count: items.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.deleteAllConfirmCta'), style: 'destructive', onPress: deleteAllData },
      ]
    );
  };

  const currentLanguageLabel = LANGUAGE_OPTIONS.find((o) => o.key === languagePreference)?.labelKey;
  const chooseLanguage = (next: LanguagePreference) => {
    haptics.light();
    setLanguagePreference(next);
    setLangSheetOpen(false);
  };

  const dataRows: Row[] = [
    {
      label: t('settings.exportData'),
      value: isPro ? t('settings.exportValuePro') : t('settings.exportValueFree'),
      onPress: exportCsv,
    },
  ];
  const appRows: Row[] = [
    {
      label: t('settings.language'),
      // Until the stored preference has been read back, showing a concrete
      // language would be a guess — so it stays neutral for that instant.
      value: preferenceLoaded && currentLanguageLabel
        ? t(currentLanguageLabel)
        : t('settings.loading'),
      onPress: () => setLangSheetOpen(true),
    },
    { label: t('settings.privacy'), value: '', onPress: openPrivacy },
    // Restoring is its own StoreKit call — it must not route through the
    // purchase screen, or a returning user would have to look at a buy CTA
    // to get back something they already paid for.
    {
      label: t('settings.restore'),
      value: restoring ? t('settings.loading') : '',
      onPress: restorePro,
    },
    { label: t('settings.help'), value: '', onPress: openHelp },
  ];
  const aboutRows: Row[] = [
    { label: t('settings.version'), value: '1.0' },
  ];
  const dangerRows: Row[] = [
    { label: t('settings.deleteAll'), value: '', onPress: onDeleteAll, danger: true },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Same surface either way, but an active Pro user has nothing left to
          buy — the card becomes a plain status panel rather than a CTA that
          leads back into the purchase screen. */}
      {isPro ? (
        <View style={styles.proCard}>
          <Text style={styles.proTitle}>{t('pro.activeTitle')}</Text>
          <Text style={styles.proSub}>{t('pro.activeBody')}</Text>
        </View>
      ) : (
        <Pressable
          style={styles.proCard}
          onPress={openPaywall}
          accessibilityRole="button"
          accessibilityLabel={t('pro.upgradeTitle')}
        >
          <Text style={styles.proTitle}>{t('pro.upgradeTitle')}</Text>
          <Text style={styles.proSub}>{t('pro.upgradeBody', { limit: FREE_ITEM_LIMIT })}</Text>
        </Pressable>
      )}

      <Section label={t('settings.sectionData')} rows={dataRows} />
      <Section label={t('settings.sectionApp')} rows={appRows} />
      <Section label={t('settings.sectionAbout')} rows={aboutRows} />
      <Section rows={dangerRows} />

      <View style={styles.footNote}>
        <Text style={styles.footNoteTitle}>{t('settings.footNoteTitle')}</Text>
        <Text style={styles.footNoteBody}>{t('settings.footNoteBody')}</Text>
      </View>

      {/* Same bottom-sheet pattern as the Items location filter — no new
          design language, and the selection applies immediately. */}
      <Modal
        visible={langSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangSheetOpen(false)}
      >
        <Pressable style={styles.sheetScrim} onPress={() => setLangSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{t('settings.languageSheetTitle')}</Text>
              <Pressable
                onPress={() => setLangSheetOpen(false)}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <CloseIcon />
              </Pressable>
            </View>
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = languagePreference === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => chooseLanguage(option.key)}
                  style={({ pressed }) => [styles.langRow, pressed && styles.langRowPressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(option.labelKey)}
                >
                  <View style={styles.langText}>
                    <Text style={[styles.langLabel, selected && styles.langLabelOn]}>
                      {t(option.labelKey)}
                    </Text>
                    {option.key === 'auto' ? (
                      <Text style={styles.langHint}>{t('settings.languageAutoHint')}</Text>
                    ) : null}
                  </View>
                  {selected ? <CheckIcon size={18} color={colors.indigo} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 100 },
  title: { ...typography.largeTitle, color: colors.textPrimary, marginBottom: spacing.xl },
  proCard: { borderRadius: radii.lg, backgroundColor: colors.paywallBg, padding: spacing.xl, gap: spacing.xs + 2 },
  proTitle: { ...typography.headline, color: '#fff' },
  proSub: { ...typography.footnote, color: 'rgba(255,255,255,0.68)' },
  section: { marginTop: spacing.xl },
  sectionLabel: {
    ...typography.overline, color: colors.textTertiary,
    marginBottom: spacing.sm, paddingLeft: spacing.xs,
  },
  // Grouped like iOS Settings: one hairline-bounded surface per section
  // instead of a stack of individually shadowed cards.
  rowsCard: { ...surfaces.card, overflow: 'hidden' },
  row: {
    paddingVertical: spacing.lg - 1, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  // flex:1 on the label and flexShrink on the value keep long English
  // strings ("Restore purchases") from colliding with the value column.
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1, marginRight: spacing.md },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  rowValue: { ...typography.subheadline, color: colors.textTertiary, flexShrink: 1 },
  sheetScrim: { flex: 1, backgroundColor: colors.sheetScrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.appBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: { ...typography.title3, color: colors.textPrimary, flex: 1, marginRight: spacing.md },
  langRow: {
    minHeight: controls.iconButton,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  langRowPressed: { backgroundColor: colors.hairline },
  langText: { flex: 1, gap: 1 },
  langLabel: { ...typography.body, color: colors.textPrimary },
  langLabelOn: { color: colors.indigo, fontWeight: '700' },
  langHint: { ...typography.caption, color: colors.textTertiary },
  footNote: {
    marginTop: spacing.lg + 2, padding: spacing.lg, borderRadius: radii.md,
    backgroundColor: colors.indigoLight, gap: spacing.xs + 2,
  },
  footNoteTitle: { ...typography.subheadline, fontWeight: '600', color: colors.indigo },
  footNoteBody: { ...typography.footnote, color: colors.textSecondary },
});
