import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';
import { ChevronRight } from '../components/icons';

export default function SettingsScreen() {
  const { isPro, openPaywall, openPrivacy, openHelp, exportCsv, deleteAllData, items } = useDepo();

  const onDeleteAll = () => {
    if (items.length === 0) {
      Alert.alert('Silinecek kayıt yok.', 'Henüz kayıtlı eşyan bulunmuyor.');
      return;
    }
    Alert.alert(
      'Bütün verileri silmek istediğine emin misin?',
      `${items.length} eşya kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Hepsini sil', style: 'destructive', onPress: deleteAllData },
      ]
    );
  };

  const rows: {
    label: string;
    value: string;
    onPress?: () => void;
    danger?: boolean;
  }[] = [
    { label: 'Verileri dışa aktar', value: isPro ? 'CSV' : 'Pro', onPress: exportCsv },
    { label: 'Dil', value: 'Türkçe' },
    { label: 'Gizlilik', value: '', onPress: openPrivacy },
    { label: 'Satın almayı geri yükle', value: '', onPress: openPaywall },
    { label: 'Yardım', value: '', onPress: openHelp },
    { label: 'Hakkında', value: '1.0' },
    { label: 'Bütün verileri sil', value: '', onPress: onDeleteAll, danger: true },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ayarlar</Text>

      <Pressable style={styles.proCard} onPress={openPaywall}>
        <Text style={styles.proTitle}>{isPro ? 'Depo Pro · etkin' : 'Depo Pro’ya geç'}</Text>
        <Text style={styles.proSub}>
          {isPro ? 'Sınırsız eşya, konum geçmişi ve dışa aktarma açık.' : 'Sınırsız eşya, aile paylaşımı, dışa aktarma. Tek seferlik ödeme.'}
        </Text>
      </Pressable>

      <View style={styles.rowsCard}>
        {rows.map((r, i) => {
          const isLast = i === rows.length - 1;
          const content = (
            <>
              <Text style={[styles.rowLabel, r.danger && { color: colors.danger }]}>{r.label}</Text>
              <View style={styles.rowRight}>
                {r.value ? <Text style={styles.rowValue}>{r.value}</Text> : null}
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

      <View style={styles.footNote}>
        <Text style={styles.footNoteTitle}>Eşyaların da bilgilerin de sende kalır.</Text>
        <Text style={styles.footNoteBody}>Fotoğraflar ve kayıtlar bu cihazda saklanır. Hesap açman gerekmez, reklam ve takip yoktur.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  title: { fontWeight: '700', fontSize: 30, letterSpacing: -0.7, color: colors.textPrimary, marginBottom: 20 },
  proCard: { borderRadius: radii.lg, backgroundColor: colors.paywallBg, padding: 20, gap: 6 },
  proTitle: { fontWeight: '600', fontSize: 17, color: '#fff' },
  proSub: { fontSize: 13.5, lineHeight: 18, color: 'rgba(255,255,255,0.68)' },
  rowsCard: {
    marginTop: 20, borderRadius: radii.md, backgroundColor: colors.card, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  row: {
    paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  rowLabel: { fontSize: 16, color: colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, color: colors.textTertiary },
  footNote: { marginTop: 18, padding: 16, borderRadius: radii.md, backgroundColor: colors.indigoLight, gap: 6 },
  footNoteTitle: { fontWeight: '600', fontSize: 14, color: colors.indigo },
  footNoteBody: { fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
});
