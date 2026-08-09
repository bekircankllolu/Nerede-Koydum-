import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';
import { PrimaryButton, SecondaryButton } from '../components/common';
import { PhotoIcon, StarIcon } from '../components/icons';

export default function DetailScreen() {
  const {
    detail, closeDetail, toggleFav, openMove, confirmLoc, deleteItem, openEditForm, markLost, openFoundSheet,
  } = useDepo();
  const d = detail();
  if (!d) return null;

  const onDelete = () => {
    Alert.alert('Bu kaydı silmek istediğine emin misin?', d.name + ' kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: deleteItem },
    ]);
  };

  const onMarkLost = () => {
    Alert.alert(
      `${d.name}'i kayıp olarak işaretlemek istiyor musun?`,
      'Son bilinen konumu Kayıplar bölümünde saklarız.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kayıp olarak işaretle', style: 'destructive', onPress: markLost },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={closeDetail} hitSlop={8}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <Pressable onPress={openEditForm} hitSlop={8} accessibilityRole="button" accessibilityLabel="Eşyayı düzenle">
          <Text style={styles.edit}>Düzenle</Text>
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

        <View style={styles.nameRow}>
          <Text style={styles.name}>{d.name}</Text>
          <Pressable
            onPress={toggleFav}
            hitSlop={10}
            style={styles.favBtn}
            accessibilityRole="button"
            accessibilityLabel={d.item.fav ? 'Favorilerden çıkar' : 'Favoriye ekle'}
          >
            <StarIcon size={24} color={d.item.fav ? colors.favorite : colors.textTertiary} filled={d.item.fav} />
          </Pressable>
        </View>

        <View style={styles.locCard}>
          <Text style={styles.locLabel}>{d.isLost ? 'Son bilinen konum' : 'Bulunduğu yer'}</Text>
          <View style={{ gap: 2 }}>
            {d.lines.map((line, i) => (
              <Text key={i} style={styles.locLine}>{line}</Text>
            ))}
          </View>
          {d.isLost ? (
            <Text style={styles.lostLine}>{d.lostDaysLabel}</Text>
          ) : (
            <Text style={styles.confirmed}>{d.confirmed}</Text>
          )}
          {!d.isLost ? (
            <View style={styles.locActions}>
              <PrimaryButton label="Yerini değiştir" onPress={openMove} style={{ flex: 1, height: 52 }} />
              <SecondaryButton label="Konumu doğrula" onPress={confirmLoc} style={{ flex: 1, backgroundColor: colors.indigoLight }} />
            </View>
          ) : null}
        </View>

        {d.isLost ? (
          <Pressable style={styles.foundBtn} onPress={openFoundSheet} accessibilityRole="button" accessibilityLabel="Buldum">
            <Text style={styles.foundBtnText}>Buldum</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onMarkLost} style={styles.markLostBtn} accessibilityRole="button" accessibilityLabel="Kayıp olarak işaretle">
            <Text style={styles.markLostText}>Kayıp olarak işaretle</Text>
          </Pressable>
        )}

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

        <Pressable onPress={onDelete} style={styles.deleteBtn} accessibilityRole="button" accessibilityLabel="Kaydı sil">
          <Text style={styles.deleteText}>Kaydı sil</Text>
        </Pressable>
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
  edit: { color: colors.indigo, fontWeight: '600', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  photo: { borderRadius: radii.lg, height: 190, backgroundColor: colors.photoPlaceholderBg },
  photoPlaceholder: {
    borderRadius: radii.lg, height: 190, backgroundColor: colors.photoPlaceholderBg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.photoPlaceholderBorder,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  photoPlaceholderText: { fontWeight: '500', fontSize: 12.5, color: colors.textWarm2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16, gap: 10 },
  name: { flex: 1, fontWeight: '700', fontSize: 28, letterSpacing: -0.6, color: colors.textPrimary },
  favBtn: { padding: 2 },
  locCard: {
    borderRadius: radii.xl, backgroundColor: colors.card, padding: 22, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 2 },
  },
  locLabel: { fontWeight: '600', fontSize: 12, color: colors.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' },
  locLine: { fontWeight: '600', fontSize: 21, lineHeight: 28, color: colors.textPrimary },
  confirmed: { fontSize: 13, color: colors.accent },
  lostLine: { fontSize: 13, color: colors.lost, fontWeight: '600' },
  locActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  foundBtn: {
    marginTop: 14, height: 56, borderRadius: radii.md, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  foundBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  markLostBtn: { marginTop: 14, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  markLostText: { color: colors.lost, fontWeight: '500', fontSize: 14 },
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
  deleteBtn: { marginTop: 26, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  deleteText: { color: colors.danger, fontWeight: '500', fontSize: 15 },
});
