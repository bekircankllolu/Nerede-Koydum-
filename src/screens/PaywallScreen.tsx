import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, controls, radii, spacing, typography, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { CheckIcon } from '../components/icons';

// Only what `isPro` genuinely unlocks today: the item limit and CSV export.
// Multiple photos, widgets/shortcuts and family sharing were listed here but
// are not built, and promising them on a purchase screen is not acceptable.
const FEATURES = [
  'Sınırsız eşya kaydı',
  'Eşyalarını CSV olarak dışa aktarma',
  'Tek seferlik ödeme, abonelik yok',
];

export default function PaywallScreen() {
  const {
    closePaywall, buyPro, restorePro, offeringStatus, lifetimePackage, purchasing, restoring,
  } = useDepo();

  // Never falls back to the old hard-coded ₺299 — a stale price is worse
  // than a loading state, and the buy button stays disabled until this is
  // the Store's own localized string.
  const priceLabel = lifetimePackage
    ? `${lifetimePackage.product.priceString} · tek seferlik`
    : offeringStatus === 'error' ? 'Fiyat şu anda alınamıyor'
    : 'Fiyat yükleniyor…';
  const buyDisabled = !lifetimePackage || purchasing || restoring;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Pressable onPress={closePaywall} style={styles.closeBtn}>
        <Text style={styles.closeText}>Şimdilik değil</Text>
      </Pressable>

      <View style={styles.mid}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Her şeyin yerini hatırla.</Text>
          <Text style={styles.subtitle}>
            {`Ücretsiz hesabında ${FREE_ITEM_LIMIT} eşya kaydettin. Depo Pro ile sınırsız devam et.`}
          </Text>
        </View>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <CheckIcon />
              <Text style={styles.featureText}>{f}</Text>
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
          accessibilityLabel="Ömür Boyu Pro satın al"
          accessibilityState={{ disabled: buyDisabled, busy: purchasing }}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" style={styles.buySpinner} />
          ) : (
            <>
              <Text style={styles.buyTitle}>Ömür Boyu Pro</Text>
              <Text style={styles.buySub}>{priceLabel}</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={purchasing || restoring ? undefined : restorePro}
          disabled={purchasing || restoring}
          style={styles.restoreBtn}
          accessibilityRole="button"
          accessibilityLabel="Satın almayı geri yükle"
          accessibilityState={{ busy: restoring }}
        >
          {restoring ? (
            <ActivityIndicator color="rgba(255,255,255,0.62)" size="small" />
          ) : (
            <Text style={styles.restoreText}>Satın almayı geri yükle</Text>
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
