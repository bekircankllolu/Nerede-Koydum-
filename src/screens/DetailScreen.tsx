import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useCekmece } from '../state/CekmeceContext';
import { PrimaryButton, SecondaryButton } from '../components/common';
import { PhotoIcon } from '../components/icons';

export default function DetailScreen() {
  const { detail, closeDetail, toggleFav, openMove, confirmLoc, deleteItem, flash } = useCekmece();
  const d = detail();
  if (!d) return null;

  const onDelete = () => {
    Alert.alert('Bu kaydı silmek istediğine emin misin?', d.name + ' kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: deleteItem },
    ]);
  };

  const stub = () => flash('Yakında', 'Bu özellik henüz eklenmedi.');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={closeDetail} hitSlop={8}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <Pressable onPress={toggleFav} hitSlop={8}>
          <Text style={styles.favToggle}>{d.item.fav ? '★ Favoride' : '☆ Favoriye ekle'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {d.item.photoUri ? (
          <Image source={{ uri: d.item.photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <PhotoIcon />
            <Text style={styles.photoPlaceholderText}>Fotoğraf eklenmedi</Text>
          </View>
        )}

        <Text style={styles.name}>{d.name}</Text>

        <View style={styles.locCard}>
          <Text style={styles.locLabel}>Bulunduğu yer</Text>
          <View style={{ gap: 2 }}>
            {d.lines.map((line, i) => (
              <Text key={i} style={styles.locLine}>{line}</Text>
            ))}
          </View>
          <Text style={styles.confirmed}>{d.confirmed}</Text>
          <View style={styles.locActions}>
            <PrimaryButton label="Yerini değiştir" onPress={openMove} style={{ flex: 1, height: 52 }} />
            <SecondaryButton label="Konumu doğrula" onPress={confirmLoc} style={{ flex: 1, backgroundColor: colors.indigoLight }} />
          </View>
        </View>

        {d.note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>NOT</Text>
            <Text style={styles.noteText}>{d.note}</Text>
          </View>
        ) : null}

        <Text style={styles.historyLabel}>Geçmiş</Text>
        <View style={styles.historyCard}>
          {d.history.map((h, i) => (
            <View key={i} style={[styles.historyRow, i === d.history.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.dot, { backgroundColor: h.dot }]} />
              <Text style={styles.historyWhere}>{h.where}</Text>
              <Text style={styles.historyWhen}>{h.when}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chipRow}>
          <Pressable style={styles.chip} onPress={stub}><Text style={styles.chipText}>Düzenle</Text></Pressable>
          <Pressable style={styles.chip} onPress={stub}><Text style={styles.chipText}>Paylaş</Text></Pressable>
          <Pressable style={styles.chip} onPress={stub}><Text style={styles.chipText}>Arşivle</Text></Pressable>
          <Pressable style={styles.chip} onPress={onDelete}><Text style={[styles.chipText, { color: colors.danger }]}>Sil</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: colors.appBg },
  header: {
    paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: colors.indigo, fontWeight: '500', fontSize: 16 },
  favToggle: { color: colors.indigo, fontWeight: '600', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  photo: { borderRadius: radii.lg, height: 190, backgroundColor: colors.photoPlaceholderBg },
  photoPlaceholder: {
    borderRadius: radii.lg, height: 190, backgroundColor: colors.photoPlaceholderBg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.photoPlaceholderBorder,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  photoPlaceholderText: { fontWeight: '500', fontSize: 12.5, color: colors.textWarm2 },
  name: { fontWeight: '700', fontSize: 28, letterSpacing: -0.6, color: colors.textPrimary, marginVertical: 16 },
  locCard: {
    borderRadius: radii.xl, backgroundColor: colors.card, padding: 22, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 2 },
  },
  locLabel: { fontWeight: '600', fontSize: 12, color: colors.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' },
  locLine: { fontWeight: '600', fontSize: 21, lineHeight: 28, color: colors.textPrimary },
  confirmed: { fontSize: 13, color: colors.accent },
  locActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  noteCard: { marginTop: 16, borderRadius: radii.md, backgroundColor: colors.card, padding: 16 },
  noteLabel: { fontWeight: '600', fontSize: 12, color: colors.textSecondary, marginBottom: 7 },
  noteText: { fontSize: 15, lineHeight: 21.75, color: colors.textPrimary },
  historyLabel: { marginTop: 24, fontWeight: '600', fontSize: 13, color: colors.textSecondary, paddingLeft: 4 },
  historyCard: { marginTop: 10, borderRadius: radii.md, backgroundColor: colors.card, overflow: 'hidden' },
  historyRow: {
    paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  dot: { width: 8, height: 8, borderRadius: 99 },
  historyWhere: { flex: 1, fontWeight: '500', fontSize: 15, color: colors.textPrimary },
  historyWhen: { fontSize: 13, color: colors.textTertiary },
  chipRow: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: radii.sm, backgroundColor: colors.card,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  chipText: { fontWeight: '500', fontSize: 14, color: colors.textPrimary },
});
