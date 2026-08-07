import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';

const SECTIONS = [
  {
    title: 'Veriler cihazında kalır',
    body: 'Eşya adları, konumları, notların ve fotoğrafların yalnızca telefonunda saklanır. Depo hiçbir sunucuya bağlanmaz, hiçbir veriyi dışarı göndermez.',
  },
  {
    title: 'Hesap gerekmez',
    body: 'Depo\'yu kullanmak için kayıt olman ya da giriş yapman gerekmiyor. Uygulama sildiğinde veya cihazı değiştirdiğinde eski verilere erişemezsin, çünkü hiçbir yerde bir kopyası tutulmaz.',
  },
  {
    title: 'Sesle kayıt',
    body: 'Konuşma tanıma, işletim sisteminin kendi servisi üzerinden çalışır. Depo, söylediklerinin bir kopyasını saklamaz.',
  },
  {
    title: 'Reklam ve takip yok',
    body: 'Uygulama içinde reklam ağı, analitik takip ya da üçüncü taraf paylaşımı bulunmuyor.',
  },
];

export default function PrivacyScreen() {
  const { closePrivacy } = useDepo();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={closePrivacy} hitSlop={8}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gizlilik</Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: colors.appBg },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: colors.indigo, fontWeight: '500', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  title: { fontWeight: '700', fontSize: 28, letterSpacing: -0.6, color: colors.textPrimary, marginBottom: 6 },
  card: { borderRadius: radii.md, backgroundColor: colors.card, padding: 16, gap: 6 },
  cardTitle: { fontWeight: '600', fontSize: 15, color: colors.textPrimary },
  cardBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
