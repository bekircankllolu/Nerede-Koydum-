import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { CheckIcon } from '../components/icons';

const FEATURES = [
  'Sınırsız eşya',
  'Birden fazla fotoğraf',
  'Sınırsız konum geçmişi',
  'Verileri dışa aktarma',
  'Widget ve Kestirmeler',
  'Aile paylaşımı',
];

export default function PaywallScreen() {
  const { closePaywall, buyPro, restorePro } = useDepo();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Pressable onPress={closePaywall} style={styles.closeBtn}>
        <Text style={styles.closeText}>Şimdilik değil</Text>
      </Pressable>

      <View style={styles.mid}>
        <View style={{ gap: 12 }}>
          <Text style={styles.title}>Her şeyin yerini hatırla.</Text>
          <Text style={styles.subtitle}>
            {`Ücretsiz hesabında ${FREE_ITEM_LIMIT} eşya kaydettin. Depo Pro ile sınırsız devam et.`}
          </Text>
        </View>
        <View style={{ gap: 11 }}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <CheckIcon />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Pressable style={styles.buyBtn} onPress={buyPro}>
          <Text style={styles.buyTitle}>Ömür Boyu Pro</Text>
          <Text style={styles.buySub}>₺299 · tek seferlik</Text>
        </Pressable>
        <Pressable onPress={restorePro} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Satın almayı geri yükle</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70, backgroundColor: colors.paywallBg,
    paddingHorizontal: 24, paddingBottom: 12,
  },
  closeBtn: { alignSelf: 'flex-end', paddingVertical: 6 },
  closeText: { color: 'rgba(255,255,255,0.6)', fontWeight: '500', fontSize: 15 },
  mid: { flex: 1, justifyContent: 'center', gap: 22 },
  title: { fontWeight: '700', fontSize: 32, letterSpacing: -0.8, color: '#fff' },
  subtitle: { fontSize: 16, lineHeight: 23.2, color: 'rgba(255,255,255,0.65)' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureText: { fontSize: 15.5, color: 'rgba(255,255,255,0.9)' },
  buyBtn: { height: 56, borderRadius: 16, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  buyTitle: { fontWeight: '600', fontSize: 17, color: '#fff' },
  buySub: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { color: 'rgba(255,255,255,0.62)', fontWeight: '500', fontSize: 14 },
});
