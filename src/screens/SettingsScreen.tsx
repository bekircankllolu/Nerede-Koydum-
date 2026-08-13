import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { colors, controls, radii, spacing, surfaces, typography, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { LanguagePreference, TranslationKey } from '../i18n';
import { haptics } from '../lib/haptics';
import {
  CheckIcon, ChevronRight, CloseIcon, ExportIcon, GlobeIcon, HelpIcon, LockIcon, RestoreIcon,
  ShieldIcon, TrashIcon,
} from '../components/icons';

type Row = {
  label: string;
  value: string;
  onPress?: () => void;
  danger?: boolean;
  /** Fixed-width leading glyph; omitted rows still reserve the slot so every label lines up. */
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

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
            <View style={styles.rowMain}>
              <View style={styles.rowIcon}>{r.icon}</View>
              <Text style={[styles.rowLabel, r.danger && { color: colors.danger }]} numberOfLines={2}>
                {r.label}
              </Text>
            </View>
            <View style={styles.rowRight}>
              {r.loading ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <>
                  {r.value ? <Text style={styles.rowValue} numberOfLines={1}>{r.value}</Text> : null}
                  {r.onPress && !r.danger ? <ChevronRight size={15} /> : null}
                </>
              )}
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
            disabled={r.disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!r.disabled, busy: !!r.loading }}
            style={({ pressed }) => [
              styles.row,
              isLast && { borderBottomWidth: 0 },
              pressed && { backgroundColor: r.danger ? colors.lostSoft : colors.hairline },
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
  const { t, locale, languagePreference, setLanguagePreference, preferenceLoaded } = useI18n();
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

  // 'auto' shows what it actually resolved to (device locale, via the same
  // I18nProvider value everything else in the app reads) so the row never
  // just says "Automatic" with no way to tell which language that means.
  // Explicit tr/en never repeat themselves ("Türkçe · Türkçe").
  const languageValue = !preferenceLoaded
    ? t('settings.loading')
    : languagePreference === 'auto'
      ? t('settings.languageAutoResolved', {
          auto: t('settings.languageAuto'),
          resolved: t(locale === 'tr' ? 'settings.languageTr' : 'settings.languageEn'),
        })
      : t(languagePreference === 'tr' ? 'settings.languageTr' : 'settings.languageEn');

  const chooseLanguage = (next: LanguagePreference) => {
    haptics.light();
    setLanguagePreference(next);
    setLangSheetOpen(false);
  };

  // expo-application reads the real native binary, not app.json — app.json
  // isn't a runtime source of truth once the app is built. Either value can
  // legitimately be null (e.g. web), so both degrade gracefully.
  const nativeVersion = Application.nativeApplicationVersion;
  const nativeBuild = Application.nativeBuildVersion;
  const versionValue = nativeVersion
    ? (nativeBuild ? t('settings.versionValue', { version: nativeVersion, build: nativeBuild }) : nativeVersion)
    : '—';

  const dataRows: Row[] = [
    {
      label: t('settings.exportData'),
      value: isPro ? t('settings.exportValuePro') : t('settings.exportValueFree'),
      icon: <ExportIcon size={18} color={colors.textTertiary} />,
      onPress: exportCsv,
    },
  ];
  const appRows: Row[] = [
    {
      label: t('settings.language'),
      value: languageValue,
      icon: <GlobeIcon size={18} color={colors.textTertiary} />,
      onPress: () => setLangSheetOpen(true),
    },
    {
      label: t('settings.privacy'),
      value: '',
      icon: <LockIcon size={18} color={colors.textTertiary} />,
      onPress: openPrivacy,
    },
    // Restoring is its own StoreKit call — it must not route through the
    // purchase screen, or a returning user would have to look at a buy CTA
    // to get back something they already paid for.
    {
      label: t('settings.restore'),
      value: '',
      icon: <RestoreIcon size={18} color={colors.textTertiary} />,
      onPress: restorePro,
      loading: restoring,
      disabled: restoring,
    },
    {
      label: t('settings.help'),
      value: '',
      icon: <HelpIcon size={18} color={colors.textTertiary} />,
      onPress: openHelp,
    },
  ];
  const aboutRows: Row[] = [
    { label: t('settings.version'), value: versionValue },
  ];
  const dangerRows: Row[] = [
    {
      label: t('settings.deleteAll'),
      value: '',
      icon: <TrashIcon size={18} color={colors.danger} />,
      onPress: onDeleteAll,
      danger: true,
    },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* An active Pro user has nothing left to buy, so this isn't the same
          dark purchase surface with different copy — it's a distinct, calm
          success status panel. Plain View, no onPress: read-only. */}
      {isPro ? (
        <View style={styles.proActiveCard}>
          <View style={styles.proActiveIcon}>
            <CheckIcon size={16} color={colors.success} />
          </View>
          <View style={styles.proActiveText}>
            <View style={styles.proActiveTitleRow}>
              <Text style={styles.proActiveTitle}>{t('pro.activeTitle')}</Text>
              <View style={styles.proActiveBadge}>
                <Text style={styles.proActiveBadgeText} numberOfLines={1}>{t('pro.lifetimeBadge')}</Text>
              </View>
            </View>
            <Text style={styles.proActiveSub}>{t('pro.activeBody')}</Text>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.proCard, pressed && styles.proCardPressed]}
          onPress={() => {
            haptics.light();
            openPaywall();
          }}
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
      <Section label={t('settings.sectionDanger')} rows={dangerRows} />

      <View style={styles.footNote}>
        <View style={styles.footNoteIcon}>
          <ShieldIcon size={16} color={colors.indigo} />
        </View>
        <View style={styles.footNoteText}>
          <Text style={styles.footNoteTitle}>{t('settings.footNoteTitle')}</Text>
          <Text style={styles.footNoteBody}>{t('settings.footNoteBody')}</Text>
        </View>
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
                  style={({ pressed }) => [
                    styles.langRow,
                    selected && styles.langRowSelected,
                    pressed && styles.langRowPressed,
                  ]}
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
  // Deliberately subtle: this is a settled, calm surface, not a bouncy CTA.
  proCardPressed: { opacity: 0.95, transform: [{ scale: 0.995 }] },
  proTitle: { ...typography.headline, color: '#fff' },
  proSub: { ...typography.footnote, color: 'rgba(255,255,255,0.68)' },
  // Deliberately not `surfaces.card`: that's a hairline-only neutral, and
  // this needs to read as "success" on sight, not just structurally match
  // the settings rows below it.
  proActiveCard: {
    borderRadius: radii.lg, backgroundColor: colors.successSoft,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.successBorder,
    padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  proActiveIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.successBorder,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  proActiveText: { flex: 1, gap: 2 },
  // flexWrap lets the badge drop to its own line rather than ever overlap
  // the title — the only thing that changes across locales here is which
  // line wraps first.
  proActiveTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  proActiveTitle: { ...typography.headline, color: colors.success },
  proActiveBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill,
    backgroundColor: colors.successBorder,
  },
  proActiveBadgeText: { ...typography.caption, fontSize: 10, letterSpacing: 0.5, fontWeight: '700', color: colors.success },
  proActiveSub: { ...typography.footnote, color: colors.textSecondary },
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
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  // Icon + label share this flexible left side so `rowRight` is pushed to
  // the row's end without relying on justify-content across three children.
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  // Fixed width — present or not, every row's icon slot is identical, so
  // every label starts on the same vertical axis.
  rowIcon: { width: 22, alignItems: 'center', flexShrink: 0 },
  // flex:1 on the label and flexShrink on the value keep long English
  // strings ("Restore purchases") from colliding with the value column.
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
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
  // Calm, flat tint — same technique as the pressed state below, not a
  // filled button or a radio-card. Pressed still visibly overrides it.
  langRowSelected: { backgroundColor: colors.indigoLight },
  langRowPressed: { backgroundColor: colors.hairline },
  langText: { flex: 1, gap: 1 },
  langLabel: { ...typography.body, color: colors.textPrimary },
  langLabelOn: { color: colors.indigo, fontWeight: '700' },
  langHint: { ...typography.caption, color: colors.textTertiary },
  footNote: {
    marginTop: spacing.lg + 2, padding: spacing.lg, borderRadius: radii.md,
    backgroundColor: colors.indigoLight, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
  },
  footNoteIcon: { width: 22, alignItems: 'center', marginTop: 1, flexShrink: 0 },
  footNoteText: { flex: 1, gap: spacing.xs + 2 },
  footNoteTitle: { ...typography.subheadline, fontWeight: '600', color: colors.indigo },
  footNoteBody: { ...typography.footnote, color: colors.textSecondary },
});
