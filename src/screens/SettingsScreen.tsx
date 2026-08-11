import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, surfaces, typography, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { ChevronRight } from '../components/icons';

type Row = { label: string; value: string; onPress?: () => void; danger?: boolean };

function RowsCard({ rows }: { rows: Row[] }) {
  return (
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

  const dataRows: Row[] = [
    { label: 'Verileri dışa aktar', value: isPro ? 'CSV' : 'Pro', onPress: exportCsv },
  ];
  const appRows: Row[] = [
    { label: 'Dil', value: 'Türkçe' },
    { label: 'Gizlilik', value: '', onPress: openPrivacy },
    // Restoring is its own StoreKit call — it must not route through the
    // purchase screen, or a returning user would have to look at a buy CTA
    // to get back something they already paid for.
    { label: 'Satın almayı geri yükle', value: restoring ? 'Yükleniyor…' : '', onPress: restorePro },
    { label: 'Yardım', value: '', onPress: openHelp },
  ];
  const aboutRows: Row[] = [
    { label: 'Sürüm', value: '1.0' },
  ];
  const dangerRows: Row[] = [
    { label: 'Bütün verileri sil', value: '', onPress: onDeleteAll, danger: true },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ayarlar</Text>

      {/* Same surface either way, but an active Pro user has nothing left to
          buy — the card becomes a plain status panel rather than a CTA that
          leads back into the purchase screen. */}
      {isPro ? (
        <View style={styles.proCard}>
          <Text style={styles.proTitle}>Depo Pro · etkin</Text>
          <Text style={styles.proSub}>Sınırsız eşya ve CSV dışa aktarma açık.</Text>
        </View>
      ) : (
        <Pressable
          style={styles.proCard}
          onPress={openPaywall}
          accessibilityRole="button"
          accessibilityLabel="Depo Pro’ya geç"
        >
          <Text style={styles.proTitle}>Depo Pro’ya geç</Text>
          <Text style={styles.proSub}>
            {`${FREE_ITEM_LIMIT} eşya sınırını kaldır ve verilerini dışa aktar. Tek seferlik ödeme.`}
          </Text>
        </Pressable>
      )}

      <Section label="VERİLER" rows={dataRows} />
      <Section label="UYGULAMA" rows={appRows} />
      <Section label="HAKKINDA" rows={aboutRows} />
      <Section rows={dangerRows} />

      <View style={styles.footNote}>
        <Text style={styles.footNoteTitle}>Eşyaların da bilgilerin de sende kalır.</Text>
        <Text style={styles.footNoteBody}>Fotoğraflar ve kayıtlar bu cihazda saklanır. Hesap açman gerekmez, reklam ve takip yoktur.</Text>
      </View>
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
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { ...typography.subheadline, color: colors.textTertiary },
  footNote: {
    marginTop: spacing.lg + 2, padding: spacing.lg, borderRadius: radii.md,
    backgroundColor: colors.indigoLight, gap: spacing.xs + 2,
  },
  footNoteTitle: { ...typography.subheadline, fontWeight: '600', color: colors.indigo },
  footNoteBody: { ...typography.footnote, color: colors.textSecondary },
});
