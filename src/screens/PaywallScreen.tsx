import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, controls, radii, spacing, typography, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
import { CheckIcon } from '../components/icons';

// Only what `isPro` genuinely unlocks today: the item limit and CSV export.
// Multiple photos, widgets/shortcuts and family sharing were listed here but
// are not built, and promising them on a purchase screen is not acceptable.
const FEATURE_KEYS: TranslationKey[] = ['pro.feature1', 'pro.feature2', 'pro.feature3'];

export default function PaywallScreen() {
  const {
    closePaywall, buyPro, restorePro, offeringStatus, lifetimePackage, purchasing, restoring,
  } = useDepo();
  const { t } = useI18n();

  // The amount always comes from StoreKit via RevenueCat and is never
  // hard-coded; only the wording around it is translated. A stale price would
  // be worse than a loading state, so the buy button stays disabled until the
  // Store's own localized string has arrived.
  const priceLabel = lifetimePackage
    ? t('pro.oneTime', { price: lifetimePackage.product.priceString })
    : offeringStatus === 'error' ? t('pro.priceUnavailable')
    : t('pro.priceLoading');
  const buyDisabled = !lifetimePackage || purchasing || restoring;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Pressable onPress={closePaywall} style={styles.closeBtn}>
        <Text style={styles.closeText} numberOfLines={1}>{t('pro.paywallClose')}</Text>
      </Pressable>

      <View style={styles.mid}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{t('pro.paywallTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('pro.paywallSubtitle', { limit: FREE_ITEM_LIMIT })}
          </Text>
        </View>
        <View style={styles.featureList}>
          {FEATURE_KEYS.map((key) => (
            <View key={key} style={styles.featureRow}>
              <CheckIcon />
              <Text style={styles.featureText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buyGroup}>
        <Pressable
          style={({ pressed }) => [
            styles.buyBtn, pressed && !buyDisabled && styles.buyBtnPressed, buyDisabled && styles.buyBtnDisabled,
          ]}
          onPress={buyDisabled ? undefined : buyPro}
          disabled={buyDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('pro.buyA11y')}
          accessibilityState={{ disabled: buyDisabled, busy: purchasing }}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" style={styles.buySpinner} />
          ) : (
            <>
              <Text style={styles.buyTitle} numberOfLines={1}>{t('pro.buyTitle')}</Text>
              <Text style={styles.buySub} numberOfLines={1}>{priceLabel}</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={purchasing || restoring ? undefined : restorePro}
          disabled={purchasing || restoring}
          style={styles.restoreBtn}
          accessibilityRole="button"
          accessibilityLabel={t('pro.restore')}
          accessibilityState={{ busy: restoring }}
        >
          {restoring ? (
            <ActivityIndicator color="rgba(255,255,255,0.62)" size="small" />
          ) : (
            <Text style={styles.restoreText} numberOfLines={1}>{t('pro.restore')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70, backgroundColor: colors.paywallBg,
    paddingHorizontal: spacing.xxl, paddingBottom: spacing.md,
  },
  closeBtn: {
    alignSelf: 'flex-end', minHeight: controls.iconButton, justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  closeText: { ...typography.callout, color: 'rgba(255,255,255,0.6)' },
  mid: { flex: 1, justifyContent: 'center', gap: spacing.xxl - 2 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, color: '#fff' },
  subtitle: { ...typography.body, lineHeight: 23, color: 'rgba(255,255,255,0.65)' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 1 },
  featureText: { ...typography.callout, fontWeight: '400', color: 'rgba(255,255,255,0.9)' },
  buyBtn: {
    height: 56, borderRadius: radii.md, backgroundColor: colors.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
  buyTitle: { ...typography.headline, color: '#fff' },
  buySub: { ...typography.caption, fontWeight: '400', color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  restoreBtn: { alignItems: 'center', minHeight: controls.iconButton, justifyContent: 'center' },
  restoreText: { ...typography.subheadline, fontWeight: '500', color: 'rgba(255,255,255,0.62)' },
  titleGroup: { gap: spacing.md },
  featureList: { gap: spacing.md - 1 },
  buyGroup: { gap: spacing.md },
  buyBtnPressed: { opacity: 0.9 },
  // Same button, same height — no layout shift while the offering loads or
  // a purchase is in flight, only the opacity signals "not tappable yet".
  buyBtnDisabled: { opacity: 0.5 },
  buySpinner: { height: 22 },
});
