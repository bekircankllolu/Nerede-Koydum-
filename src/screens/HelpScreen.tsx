import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';

const TOPICS = [
  {
    title: 'Bir eşya nasıl kaydedilir?',
    body: '"Eşyalar" sekmesinde sağ üstteki artı düğmesine bas, adını ve konumunu yaz ya da söyle. İstersen bir fotoğraf ekle.',
  },
  {
    title: 'Bir eşyayı nasıl bulurum?',
    body: '"Bul" sekmesine adını yaz, örneğin "pasaport nerede" — Depo soru kalıplarını temizleyip sonuçları isim, not ve konum eşleşmesine göre sıralar.',
  },
  {
    title: 'Sesle nasıl kaydedebilirim?',
    body: 'Arama kutusu, eşya adı, konum ve yer değiştirme alanlarındaki mikrofon simgesine bas, konuş, bitince otomatik yazıya çevrilir.',
  },
  {
    title: 'Bir eşyanın yerini nasıl güncellerim?',
    body: 'Eşyanın detay sayfasında "Yerini değiştir" ile yeni konuma taşı, ya da hâlâ aynı yerdeyse "Konumu doğrula" ile kaydı tazele.',
  },
  {
    title: 'Ücretsiz sınır nedir?',
    body: `Ücretsiz hesapta ${FREE_ITEM_LIMIT} eşyaya kadar kayıt tutabilirsin. Daha fazlası için Depo Pro'ya geçmen gerekir.`,
  },
];

export default function HelpScreen() {
  const { closeHelp } = useDepo();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={closeHelp} hitSlop={8}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Yardım</Text>

        {TOPICS.map((t) => (
          <View key={t.title} style={styles.card}>
            <Text style={styles.cardTitle}>{t.title}</Text>
            <Text style={styles.cardBody}>{t.body}</Text>
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
